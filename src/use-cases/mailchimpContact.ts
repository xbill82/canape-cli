import * as mailchimp from '@mailchimp/mailchimp_marketing'

import {mailchimpClient} from '../services/mailchimp.api.js'

export async function searchMailchimpContact(
  email: string,
): Promise<mailchimp.lists.MembersSuccessResponse | undefined> {
  const mailchimp = mailchimpClient()

  const searchResult = await mailchimp.searchMembers.search(email)

  if (typeof searchResult === 'object' && 'exact_matches' in searchResult) {
    return searchResult.exact_matches.members[0]
  }

  console.error('Error searching for Mailchimp contact:', searchResult.title)
  return undefined
}
