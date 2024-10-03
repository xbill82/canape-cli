import {Command} from '@oclif/core'

import {structureMail} from '../../LLMWorkflows/structureMail.LLM.js'
import {fetchEmails} from '../../repositories/email.repository.js'
import {openInbox} from '../../services/imap.backend.js'

export default class NewDeals extends Command {
  static description = 'Crawls the inbox for new deals and creates them in Notion'

  async run(): Promise<void> {
    const inbox = await openInbox('New Deals')
    const emails = await fetchEmails(inbox)

    for (const [index, email] of emails.entries()) {
      const rawDeal = await structureMail(email)

      console.log(`Structured mail ${index}`)
      console.log(JSON.stringify(rawDeal, null, 2))
    }
  }
}
