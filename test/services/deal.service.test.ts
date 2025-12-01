import {expect} from 'chai'
import {Client} from '@notionhq/client'

import DealService, {CreateDealInput} from '../../src/services/deal.service.js'
import {getBackend, getThrottle} from '../../src/services/notion.backend.js'
import conf from '../../src/services/config.js'
import {searchShowsByTitle} from '../../src/repositories/show.repository.js'

describe('DealService.createDealFromData', () => {
  let backend: Client
  let throttle: ReturnType<typeof getThrottle>
  let dealService: DealService
  let testShowId: string

  before(async () => {
    if (!conf.notionApiKey) {
      throw new Error('NOTION_API_KEY environment variable is required for tests')
    }

    backend = getBackend(conf.notionApiKey)
    throttle = getThrottle()
    dealService = new DealService(backend, throttle)

    // Get a show for testing (we need at least one show to exist)
    const shows = await searchShowsByTitle(backend, throttle)
    if (shows.length === 0) {
      throw new Error('No shows found in Notion. Please create at least one show before running tests.')
    }
    testShowId = shows[0].id
  })

  const archivePage = async (pageId: string): Promise<void> => {
    await throttle(() =>
      backend.pages.update({
        page_id: pageId,
        archived: true,
      }),
    )
  }

  describe('Test 1: New deal from new organization, with new decision maker and new gig', () => {
    it('should create all entities successfully', async () => {
      const timestamp = new Date().toISOString().split('T')[0]
      const uniqueSuffix = Date.now().toString()

      const input: CreateDealInput = {
        dealTitle: `Test Deal ${uniqueSuffix}`,
        organizer: {
          name: `Test Org ${uniqueSuffix}`,
          email: `testorg${uniqueSuffix}@example.com`,
        },
        decisionMaker: {
          name: `Test Person ${uniqueSuffix}`,
          email: `testperson${uniqueSuffix}@example.com`,
          phoneNumber: '+33123456789',
        },
        gig: {
          show: {id: testShowId},
          timestamp,
          city: 'Test City',
        },
      }

      const result = await dealService.createDealFromData(input)

      expect(result).to.have.property('deal')
      expect(result.deal.id).to.be.a('string').and.not.be.empty
      expect(result.deal.organization.id).to.equal(result.organizationId)
      expect(result.organizationId).to.be.a('string').and.not.be.empty
      expect(result.personId).to.be.a('string').and.not.be.empty
      expect(result.gigId).to.be.a('string').and.not.be.empty
      expect(result.wasOrganizationCreated).to.be.true
      expect(result.wasPersonCreated).to.be.true
      expect(result.wasGigCreated).to.be.true

      // Cleanup
      if (result.gigId) {
        await archivePage(result.gigId)
      }
      if (result.personId) {
        await archivePage(result.personId)
      }
      await archivePage(result.deal.id)
      if (result.wasOrganizationCreated) {
        await archivePage(result.organizationId)
      }
    })
  })

  describe('Test 2: New deal from existing organization, with new decision maker and new gig', () => {
    let existingOrgId: string

    before(async () => {
      // Create an organization that will be reused
      const uniqueSuffix = Date.now().toString()
      const input: CreateDealInput = {
        dealTitle: `Setup Org Deal ${uniqueSuffix}`,
        organizer: {
          name: `Existing Org ${uniqueSuffix}`,
          email: `existingorg${uniqueSuffix}@example.com`,
        },
      }

      const result = await dealService.createDealFromData(input)
      existingOrgId = result.organizationId

      // Cleanup the setup deal
      await archivePage(result.deal.id)
    })

    it('should create deal with existing organization, new person and new gig', async () => {
      const timestamp = new Date().toISOString().split('T')[0]
      const uniqueSuffix = Date.now().toString()

      const input: CreateDealInput = {
        dealTitle: `Test Deal ${uniqueSuffix}`,
        organizer: {id: existingOrgId, name: 'Existing Org', email: 'existingorg@example.com'},
        decisionMaker: {
          name: `Test Person ${uniqueSuffix}`,
          email: `testperson${uniqueSuffix}@example.com`,
        },
        gig: {
          show: {id: testShowId},
          timestamp,
          city: 'Test City',
        },
      }

      const result = await dealService.createDealFromData(input)

      expect(result).to.have.property('deal')
      expect(result.deal.id).to.be.a('string').and.not.be.empty
      expect(result.organizationId).to.equal(existingOrgId)
      expect(result.personId).to.be.a('string').and.not.be.empty
      expect(result.gigId).to.be.a('string').and.not.be.empty
      expect(result.wasOrganizationCreated).to.be.false
      expect(result.wasPersonCreated).to.be.true
      expect(result.wasGigCreated).to.be.true

      // Cleanup
      if (result.gigId) {
        await archivePage(result.gigId)
      }
      if (result.personId) {
        await archivePage(result.personId)
      }
      await archivePage(result.deal.id)
    })

    after(async () => {
      // Cleanup the existing organization
      await archivePage(existingOrgId)
    })
  })

  describe('Test 3: New deal from existing organization with existing decision maker and new gig', () => {
    let existingOrgId: string
    let existingPersonId: string
    let existingPersonName: string

    before(async () => {
      // Create an organization and person that will be reused
      const uniqueSuffix = Date.now().toString()
      existingPersonName = `Existing Person ${uniqueSuffix}`

      // Create organization
      const orgInput: CreateDealInput = {
        dealTitle: `Setup Org Deal ${uniqueSuffix}`,
        organizer: {
          name: `Existing Org ${uniqueSuffix}`,
          email: `existingorg${uniqueSuffix}@example.com`,
        },
        decisionMaker: {
          name: existingPersonName,
          email: `existingperson${uniqueSuffix}@example.com`,
        },
      }

      const orgResult = await dealService.createDealFromData(orgInput)
      existingOrgId = orgResult.organizationId
      existingPersonId = orgResult.personId!

      // Cleanup the setup deal
      await archivePage(orgResult.deal.id)
    })

    it('should create deal with existing organization and existing person, new gig', async () => {
      const timestamp = new Date().toISOString().split('T')[0]
      const uniqueSuffix = Date.now().toString()

      // Search for the existing person by name to get the full Person object
      const {searchPersonsByName} = await import('../../src/repositories/person.repository.js')
      const existingPersons = await searchPersonsByName(backend, throttle, existingPersonName)

      if (existingPersons.length === 0) {
        throw new Error('Setup person not found')
      }
      const existingPerson = existingPersons[0]

      const input: CreateDealInput = {
        dealTitle: `Test Deal ${uniqueSuffix}`,
        organizer: {id: existingOrgId, name: 'Existing Org', email: 'existingorg@example.com'},
        decisionMaker: existingPerson,
        gig: {
          show: {id: testShowId},
          timestamp,
          city: 'Test City',
        },
      }

      const result = await dealService.createDealFromData(input)

      expect(result).to.have.property('deal')
      expect(result.deal.id).to.be.a('string').and.not.be.empty
      expect(result.organizationId).to.equal(existingOrgId)
      expect(result.personId).to.equal(existingPersonId)
      expect(result.gigId).to.be.a('string').and.not.be.empty
      expect(result.wasOrganizationCreated).to.be.false
      expect(result.wasPersonCreated).to.be.false
      expect(result.wasGigCreated).to.be.true

      // Cleanup
      if (result.gigId) {
        await archivePage(result.gigId)
      }
      await archivePage(result.deal.id)
    })

    after(async () => {
      // Cleanup the existing organization and person
      if (existingPersonId) {
        await archivePage(existingPersonId)
      }
      await archivePage(existingOrgId)
    })
  })
})
