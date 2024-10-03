import {ImapSimple} from 'imap-simple'
import {simpleParser} from 'mailparser'

export class Email {
  constructor(public date: Date, public from: string, public subject: string, public text: string) {}

  public serialize() {
    return `From: ${this.from}
    Subject: ${this.subject}

  ${this.text}
    `
  }
}

export async function fetchEmails(inbox: ImapSimple): Promise<Email[]> {
  try {
    // Search criteria: all emails
    const searchCriteria = ['ALL']

    // Fetch options
    const fetchOptions = {bodies: ['']}

    // Search for emails
    const results = await inbox.search(searchCriteria, fetchOptions)
    const emails: Email[] = []

    for (const item of results) {
      const all = item.parts.find((part) => part.which === '')
      if (all) {
        const parsedEmail = await simpleParser(all.body)
        emails.push(
          new Email(
            parsedEmail.date || new Date(),
            parsedEmail.from?.text || '',
            parsedEmail.subject || '',
            parsedEmail.text || '',
          ),
        )
      }
    }

    await inbox.end()

    return emails
  } catch (error) {
    console.error('Error fetching emails:', error)
    return []
  }
}
