import {Client} from '@notionhq/client'
import {ThrottleFunction} from './notion.backend.js'
import {search} from '@inquirer/prompts'
import confirm from '@inquirer/confirm'
import input from '@inquirer/input'
import dayjs from 'dayjs'
import {
  searchOrganizationsByName,
  create as createOrganization,
  fetchOrganizationById,
} from '../repositories/organization.repository.js'
import {Organization} from '../domain/organization.js'
import {Person} from '../domain/person.js'
import {Deal} from '../domain/deal.js'
import OrganizationService from './organization.service.js'
import PersonService from './person.service.js'
import GigService from './gig.service.js'
import {create as createDeal, fetchDealById} from '../repositories/deal.repository.js'
import {updateOrganizationWithPerson} from '../repositories/organization.repository.js'
import {
  getBackend as getFacturationProBackend,
  getThrottle as getFacturationProThrottle,
} from './facturation.pro.backend.js'
import conf from './config.js'
import {searchPersonsByName, create as createPerson} from '../repositories/person.repository.js'
import {searchShowsByTitle, fetchShowById} from '../repositories/show.repository.js'
import {Show} from '../domain/show.js'

export type CreateDealResult = {
  dealId: string
  dealTitle: string
  organization: Organization
  person?: Person
  gigId?: string
}

export type CreateDealFromDataResult = {
  deal: Deal
  organizationId: string
  personId?: string
  gigId?: string
  wasOrganizationCreated: boolean
  wasPersonCreated: boolean
  wasGigCreated: boolean
}

export type CreateDealInput = {
  dealTitle: string
  organizer: Organization | {name: string; email: string; [key: string]: unknown}
  decisionMaker?: Person | {name: string; email: string; phoneNumber?: string}
  gig?: {
    show: Show | {id: string} | {title: string}
    timestamp: string
    city?: string
    gigTitle?: string
  }
}

export default class DealService {
  private backend: Client
  private throttle: ThrottleFunction
  private organizationService: OrganizationService
  private personService: PersonService
  private gigService: GigService

  constructor(backend: Client, throttle: ThrottleFunction) {
    this.backend = backend
    this.throttle = throttle
    this.organizationService = new OrganizationService(backend, throttle)
    this.personService = new PersonService(backend, throttle)
    this.gigService = new GigService(backend, throttle)
  }

  async createDeal(): Promise<Deal> {
    const dealTitle = await input({
      message: 'Deal title:',
      validate: (value) => value.trim().length > 0 || 'Deal title is required',
    })

    const organization = await this.organizationService.findOrCreateOrganization('Who is the organizer?')

    const today = dayjs().format('YYYY-MM-DD')
    const minimalDeal: Deal = {
      id: '',
      date: today,
      amount: 0,
      deadlineForCommElements: dayjs(today).subtract(20, 'day').format('D MMMM YYYY'),
      gigs: [],
      organization,
      url: '',
    } as Deal

    const deal = await createDeal(this.backend, minimalDeal, dealTitle.trim(), '')
    const createdDeal = await fetchDealById(this.backend, this.throttle, deal.id)

    deal.url = createdDeal.url

    const shouldCreatePerson = await confirm({
      message: 'Is there a decision maker for this deal?',
      default: false,
    })

    let person: Person | undefined

    if (shouldCreatePerson) {
      person = await this.personService.createPerson(organization.id, deal.id)

      await this.backend.pages.update({
        page_id: deal.id,
        properties: {
          'Decision-maker': {
            relation: [
              {
                id: person.id,
              },
            ],
          },
        },
      })

      if (conf.facturationProApiIdentifier && conf.facturationProApiKey && conf.facturationProFirmId) {
        const facturationProBackend = getFacturationProBackend({
          apiIdentifier: conf.facturationProApiIdentifier,
          apiKey: conf.facturationProApiKey,
          firmId: conf.facturationProFirmId,
        })
        const facturationProThrottle = getFacturationProThrottle()

        await updateOrganizationWithPerson(
          organization,
          person,
          facturationProBackend,
          facturationProThrottle,
          conf.facturationProFirmId,
        )
      }
    }

    const shouldCreateGig = await confirm({
      message: 'Do you want to create a gig for this deal?',
      default: false,
    })

    let gigId: string | undefined

    if (shouldCreateGig) {
      const show = await this.gigService.selectShow()
      const timestamp = await input({message: 'Date/Time (YYYY-MM-DD or YYYY-MM-DDTHH:mm):'})
      const city = await input({message: 'City (optional):', default: ''})

      gigId = await this.gigService.createGig({
        gigTitle: `${show.title} @ ${city.trim()} / ${timestamp.trim()}`,
        show,
        dealId: deal.id,
        organizationId: organization.id,
        city: city.trim() || undefined,
        timestamp: timestamp.trim(),
      })

      await this.backend.pages.update({
        page_id: deal.id,
        properties: {
          Gigs: {
            relation: [
              {
                id: gigId,
              },
            ],
          },
        },
      })
    }

    return deal
  }

  async createDealFromData(input: CreateDealInput): Promise<CreateDealFromDataResult> {
    let organization: Organization
    let wasOrganizationCreated = false

    if ('id' in input.organizer && input.organizer.id && typeof input.organizer.id === 'string') {
      organization = await fetchOrganizationById(this.backend, this.throttle, input.organizer.id)
    } else {
      const orgs = await searchOrganizationsByName(this.backend, this.throttle, input.organizer.name)
      if (orgs.length > 0) {
        organization = orgs[0]
      } else {
        wasOrganizationCreated = true
        const newOrganization: Organization = {
          id: '',
          name: input.organizer.name,
          email: input.organizer.email,
          address: 'address' in input.organizer ? (input.organizer.address as string | undefined) : undefined,
          APE: 'APE' in input.organizer ? (input.organizer.APE as string | undefined) : undefined,
          legalPersonName:
            'legalPersonName' in input.organizer ? (input.organizer.legalPersonName as string | undefined) : undefined,
          legalPersonPosition:
            'legalPersonPosition' in input.organizer
              ? (input.organizer.legalPersonPosition as string | undefined)
              : undefined,
          SIRET: 'SIRET' in input.organizer ? (input.organizer.SIRET as number | undefined) : undefined,
          licenceNumber:
            'licenceNumber' in input.organizer ? (input.organizer.licenceNumber as number | undefined) : undefined,
          website: 'website' in input.organizer ? (input.organizer.website as string | undefined) : undefined,
          type: 'type' in input.organizer ? (input.organizer.type as string[] | undefined) : undefined,
          facturationProId: undefined,
        } as Organization

        let facturationProBackend
        let facturationProThrottle
        let firmId

        if (conf.facturationProApiIdentifier && conf.facturationProApiKey && conf.facturationProFirmId) {
          facturationProBackend = getFacturationProBackend({
            apiIdentifier: conf.facturationProApiIdentifier,
            apiKey: conf.facturationProApiKey,
            firmId: conf.facturationProFirmId,
          })
          facturationProThrottle = getFacturationProThrottle()
          firmId = conf.facturationProFirmId
        }

        organization = await createOrganization(
          this.backend,
          newOrganization,
          facturationProBackend,
          facturationProThrottle,
          firmId,
        )
      }
    }

    const today = dayjs().format('YYYY-MM-DD')
    const minimalDeal: Deal = {
      id: '',
      date: today,
      amount: 0,
      deadlineForCommElements: dayjs(today).subtract(20, 'day').format('D MMMM YYYY'),
      gigs: [],
      organization,
      url: '',
    } as Deal

    const deal = await createDeal(this.backend, minimalDeal, input.dealTitle.trim(), '')
    const createdDeal = await fetchDealById(this.backend, this.throttle, deal.id)

    deal.url = createdDeal.url

    let person: Person | undefined
    let wasPersonCreated = false

    if (input.decisionMaker) {
      if (
        'id' in input.decisionMaker &&
        input.decisionMaker.id &&
        typeof input.decisionMaker.id === 'string' &&
        'name' in input.decisionMaker &&
        'email' in input.decisionMaker
      ) {
        person = input.decisionMaker as Person
      } else if ('name' in input.decisionMaker && 'email' in input.decisionMaker) {
        const persons = await searchPersonsByName(this.backend, this.throttle, input.decisionMaker.name)
        if (persons.length > 0) {
          person = persons[0]
        } else {
          wasPersonCreated = true
          const newPerson: Person = {
            id: '',
            name: input.decisionMaker.name,
            email: input.decisionMaker.email,
            phoneNumber: input.decisionMaker.phoneNumber || '',
            mailchimpProfile: '',
            organizations: [],
            deals: [],
          } as Person

          person = await createPerson(this.backend, this.throttle, newPerson, organization.id, deal.id)
        }
      }

      if (person) {
        await this.backend.pages.update({
          page_id: deal.id,
          properties: {
            'Decision-maker': {
              relation: [
                {
                  id: person.id,
                },
              ],
            },
          },
        })

        if (conf.facturationProApiIdentifier && conf.facturationProApiKey && conf.facturationProFirmId) {
          const facturationProBackend = getFacturationProBackend({
            apiIdentifier: conf.facturationProApiIdentifier,
            apiKey: conf.facturationProApiKey,
            firmId: conf.facturationProFirmId,
          })
          const facturationProThrottle = getFacturationProThrottle()

          await updateOrganizationWithPerson(
            organization,
            person,
            facturationProBackend,
            facturationProThrottle,
            conf.facturationProFirmId,
          )
        }
      }
    }

    let gigId: string | undefined
    let wasGigCreated = false

    if (input.gig) {
      wasGigCreated = true
      let show: Show

      if ('id' in input.gig.show && input.gig.show.id) {
        show = await fetchShowById(this.backend, this.throttle, input.gig.show.id)
      } else if ('title' in input.gig.show && input.gig.show.title) {
        const shows = await searchShowsByTitle(this.backend, this.throttle, input.gig.show.title)
        if (shows.length === 0) {
          throw new Error(`No show found with title "${input.gig.show.title}"`)
        }
        show = shows[0]
      } else {
        show = input.gig.show as Show
      }

      const cityPart = input.gig.city?.trim() ? ` @ ${input.gig.city.trim()}` : ''
      const gigTitle = input.gig.gigTitle || `${show.title}${cityPart} / ${input.gig.timestamp.trim()}`

      gigId = await this.gigService.createGig({
        gigTitle,
        show,
        dealId: deal.id,
        organizationId: organization.id,
        city: input.gig.city?.trim() || undefined,
        timestamp: input.gig.timestamp.trim(),
      })

      await this.backend.pages.update({
        page_id: deal.id,
        properties: {
          Gigs: {
            relation: [
              {
                id: gigId,
              },
            ],
          },
        },
      })
    }

    return {
      deal,
      organizationId: organization.id,
      personId: person?.id,
      gigId,
      wasOrganizationCreated,
      wasPersonCreated,
      wasGigCreated,
    }
  }
}
