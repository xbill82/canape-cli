import axios from 'axios'

import config from '../services/config.js'
import {MailchimpContact, MailchimpContactResponse, baseUrl} from '../services/mailchimp.api.js'

export async function searchMailchimpContact(email: string): Promise<MailchimpContact> {
  try {
    const response = await axios.get(`${baseUrl}/search-members`, {
      headers: {
        Authorization: `Bearer ${config.mailchimpApiKey}`,
      },
      params: {query: email},
    })

    const searchResult = response.data as MailchimpContactResponse

    if ('exact_matches' in searchResult && searchResult.exact_matches.members.length > 0) {
      return searchResult.exact_matches.members[0]
    }

    throw new Error('Contact not found')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'An error occurred while searching for the contact')
    }

    throw error
  }
}
