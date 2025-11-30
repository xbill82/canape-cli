import {Client} from '@notionhq/client'
import {ThrottleFunction} from './notion.backend.js'
import {search} from '@inquirer/prompts'
import confirm from '@inquirer/confirm'
import input from '@inquirer/input'
import dayjs from 'dayjs'
import {searchOrganizationsByName} from '../repositories/organization.repository.js'
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

export type CreateDealResult = {
  dealId: string
  dealTitle: string
  organization: Organization
  person?: Person
  gigId?: string
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
}
