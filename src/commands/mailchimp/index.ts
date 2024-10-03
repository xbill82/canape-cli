import {Command} from '@oclif/core'

import conf from '../../services/config.js'
import {getBackend, getThrottle} from '../../services/notion.backend.js'
import {syncMailchimpProfiles} from '../../use-cases/mailchimpSync.js'

export default class MailchimpSearch extends Command {
  static args = {}

  static description = 'Synchronize People with their Mailchimp contact'

  static examples = ['<%= config.bin %> <%= command.id %> user@example.com']

  async run(): Promise<void> {
    const backend = getBackend(conf.notionApiKey)
    const throttle = getThrottle()

    try {
      this.log(`🔍 Syncing contacts with their Mailchimp profile...`)
      const {created, updated} = await syncMailchimpProfiles(backend, throttle)
      console.log(
        'Updated people:',
        updated.map((person) => person.name),
      )

      console.log(
        'Contacts created in Mailchimp:',
        created.map((person) => person.name),
      )
    } catch (error) {
      this.error(`An error occurred while searching for the contact: ${(error as Error).message}`, {exit: 1})
    }
  }
}
