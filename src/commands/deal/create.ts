import {Command} from '@oclif/core'

import conf from '../../services/config.js'

import {getBackend, getThrottle} from '../../services/notion.backend.js'
import DealService from '../../services/deal.service.js'
import {fetchDealById} from '../../repositories/deal.repository.js'

export default class NewDeal extends Command {
  static description = 'Create a new deal in Notion'

  async run(): Promise<void> {
    const backend = getBackend(conf.notionApiKey)
    const throttle = getThrottle()

    const dealService = new DealService(backend, throttle)
    const deal = await dealService.createDeal()

    this.log(`\n✅ Deal created successfully!`)
    this.log(`   URL: ${deal.url}`)
  }
}
