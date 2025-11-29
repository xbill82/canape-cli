import {Command} from '@oclif/core'
import confirm from '@inquirer/confirm'
import input from '@inquirer/input'
import dayjs from 'dayjs'

import conf from '../../services/config.js'

import {getBackend, getThrottle} from '../../services/notion.backend.js'
import {
  getBackend as getFacturationProBackend,
  getThrottle as getFacturationProThrottle,
} from '../../services/facturation.pro.backend.js'
import DealService from '../../services/deal.service.js'
import PersonService from '../../services/person.service.js'
import {create as createDeal} from '../../repositories/deal.repository.js'
import {updateOrganizationWithPerson} from '../../repositories/organization.repository.js'
import {Gig} from '../../domain/gig.js'
import {Deal} from '../../domain/deal.js'

export default class NewDeal extends Command {
  static description = 'Create a new deal in Notion'

  async run(): Promise<void> {
    const backend = getBackend(conf.notionApiKey)
    const throttle = getThrottle()

    const dealService = new DealService(backend, throttle)
    const personService = new PersonService(backend, throttle)

    const dealTitle = await input({
      message: 'Deal title:',
      validate: (value) => value.trim().length > 0 || 'Deal title is required',
    })

    const organization = await dealService.selectOrCreateOrganization()

    this.log(`\n📋 Organization: ${organization.name}`)

    const today = dayjs().format('YYYY-MM-DD')
    const minimalDeal: Deal = {
      id: '',
      date: today,
      amount: 0,
      deadlineForCommElements: dayjs(today).subtract(20, 'day').format('D MMMM YYYY'),
      gigs: [],
      organization,
    } as Deal

    const dealId = await createDeal(backend, minimalDeal, dealTitle.trim(), '')

    const shouldCreatePerson = await confirm({
      message: 'Do you want to create a person for this deal?',
      default: false,
    })

    if (shouldCreatePerson) {
      const person = await personService.createPerson(organization.id, dealId)

      this.log('\n👤 Person Details:')
      this.log(`   ID: ${person.id}`)
      this.log(`   Name: ${person.name}`)
      this.log(`   Email: ${person.email}`)
      if (person.phoneNumber) this.log(`   Phone: ${person.phoneNumber}`)

      await backend.pages.update({
        page_id: dealId,
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

    this.log(`\n✅ Deal created successfully!`)
    this.log(`   ID: ${dealId}`)
    this.log(`   Title: ${dealTitle}`)
    this.log(`   Organization: ${organization.name}`)
    if (shouldCreatePerson) {
      this.log(`   Person: Linked`)
    }
  }
}
