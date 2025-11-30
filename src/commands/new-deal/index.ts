import {Command} from '@oclif/core'

import conf from '../../services/config.js'

import {getBackend, getThrottle} from '../../services/notion.backend.js'
import DealService from '../../services/deal.service.js'

export default class NewDeal extends Command {
  static description = 'Create a new deal in Notion'

  async run(): Promise<void> {
    const backend = getBackend(conf.notionApiKey)
    const throttle = getThrottle()

    const dealService = new DealService(backend, throttle)
    const result = await dealService.createDeal()

    this.log(`\n📋 Organization: ${result.organization.name}`)

    if (result.person) {
      this.log('\n👤 Person Details:')
      this.log(`   ID: ${result.person.id}`)
      this.log(`   Name: ${result.person.name}`)
      this.log(`   Email: ${result.person.email}`)
      if (result.person.phoneNumber) this.log(`   Phone: ${result.person.phoneNumber}`)
    }

    this.log(`\n✅ Deal created successfully!`)
    this.log(`   ID: ${result.dealId}`)
    this.log(`   Title: ${result.dealTitle}`)
    this.log(`   Organization: ${result.organization.name}`)
    if (result.person) {
      this.log(`   Person: Linked`)
    }
    if (result.gigId) {
      this.log(`   Gig: Linked (ID: ${result.gigId})`)
    }
  }
}
