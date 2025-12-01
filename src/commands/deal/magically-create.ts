import {Command} from '@oclif/core'

import {structureMail} from '../../LLMWorkflows/structureMail.LLM.js'
import {fetchEmails} from '../../repositories/email.repository.js'
import {openInbox} from '../../services/imap.backend.js'
import DealService from '../../services/deal.service.js'
import {getBackend, getThrottle} from '../../services/notion.backend.js'
import conf from '../../services/config.js'

export default class NewDeals extends Command {
  static description = 'Crawls the inbox for new deals and creates them in Notion'

  async run(): Promise<void> {
    const inbox = await openInbox('New Deals')
    const emails = await fetchEmails(inbox)

    for (const [index, email] of emails.entries()) {
      const rawDeal = await structureMail(email)

      console.log(`Structured mail ${index}`)
      console.log(JSON.stringify(rawDeal, null, 2))

      const dealService = new DealService(getBackend(conf.notionApiKey), getThrottle())
      const result = await dealService.createDealFromData({
        dealTitle: rawDeal.dealTitle,
        organizer: rawDeal.organizer,
      })

      console.log(`Deal created ${rawDeal.dealTitle}`)
      console.log(`Deal URL: ${result.deal.url}`)
    }
  }
}
