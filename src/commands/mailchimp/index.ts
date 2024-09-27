import {Args, Command} from '@oclif/core'

import {searchMailchimpContact} from '../../use-cases/mailchimpContact.js'

export default class MailchimpSearch extends Command {
  static args = {
    email: Args.string({description: 'Email address to search for', required: true}),
  }

  static description = 'Search for a contact in Mailchimp by email'

  static examples = ['<%= config.bin %> <%= command.id %> user@example.com']

  async run(): Promise<void> {
    const {args} = await this.parse(MailchimpSearch)

    this.log(`🔍 Searching for contact with email: ${args.email}`)

    try {
      const contact = await searchMailchimpContact(args.email)

      if (contact) {
        this.log('✅ Contact found:')
        this.log(JSON.stringify(contact, null, 2))
      } else {
        this.log('❌ Contact not found')
      }
    } catch (error) {
      this.error(`An error occurred while searching for the contact: ${(error as Error).message}`, {exit: 1})
    }
  }
}
