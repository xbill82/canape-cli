import config from './config.js'

export type MailchimpContact = {
  contact_id: string
  email_address: string
  email_type: string
  full_name: string
  id: string
  status: string
  unique_email_id: string
  web_id: number
}

export type MailchimpContactResponse = {
  exact_matches: {
    members: MailchimpContact[]
  }
}

export const baseUrl = `https://${config.mailchimpServerPrefix}.api.mailchimp.com/3.0`
