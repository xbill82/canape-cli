import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'
import axios from 'axios'

import {Person} from '../domain/person.js'
import config from '../services/config.js'
import {baseUrl} from '../services/mailchimp.api.js'
import {ThrottleFunction} from '../services/notion.backend.js'

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

export async function searchContactsByMail(email: string): Promise<MailchimpContact | null> {
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

    return null
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'An error occurred while searching for the contact')
    }

    throw error
  }
}

function splitName(name: string): {firstName: string; lastName: string} {
  const nameParts = name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
  return {firstName, lastName}
}

export async function createMailchimpContact(person: Person): Promise<string | undefined> {
  const {firstName, lastName} = splitName(person.name)
  const mailchimpData = {
    email_address: person.email,
    merge_fields: {
      FNAME: firstName,
      LNAME: lastName,
      PHONE: person.phoneNumber || undefined,
    },
    status: 'subscribed',
  }

  try {
    const response = await axios.post(`${baseUrl}/lists/${config.mailchimpAudienceId}/members`, mailchimpData, {
      headers: {
        Authorization: `Bearer ${config.mailchimpApiKey}`,
        'Content-Type': 'application/json',
      },
    })
    console.log(`Contact ${person.name} created successfully in Mailchimp.`)
    return response.data.id
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error creating contact ${person.name} in Mailchimp:`, error.response?.data)
    } else {
      console.error('An unexpected error occurred:', error)
    }
  }
}

export const database_id = '52873389c460496ab652ce3027453753'

export async function searchPersonsByName(
  backend: Client,
  throttle: ThrottleFunction,
  searchTerm: string,
): Promise<Person[]> {
  if (!searchTerm.trim()) {
    return []
  }

  const response = await throttle(() =>
    backend.databases.query({
      database_id,
      filter: {
        property: 'Name',
        title: {
          contains: searchTerm,
        },
      },
    }),
  )

  return response.results.map((page) => new Person(page as PageObjectResponse))
}

export async function findPersonsWithEmptyMailchimpProfiles(backend: Client, throttle: ThrottleFunction) {
  const response = await throttle(() =>
    backend.databases.query({
      database_id,
      filter: {
        and: [
          {
            email: {
              is_not_empty: true,
            },
            property: 'Email',
          },
          {
            property: 'MailchimpProfile',
            url: {
              is_empty: true,
            },
          },
        ],
      },
    }),
  )

  return response.results.map((page) => new Person(page as PageObjectResponse))
}

export async function create(
  backend: Client,
  throttle: ThrottleFunction,
  person: Person,
  organizationId?: string,
): Promise<string> {
  const properties: Record<string, unknown> = {
    Email: {
      email: person.email || null,
    },
    Phone: {
      phone_number: person.phoneNumber || null,
    },
    Name: {
      title: [
        {
          text: {
            content: person.name,
          },
        },
      ],
    },
  }

  if (organizationId) {
    properties.Organization = {
      relation: [
        {
          id: organizationId,
        },
      ],
    }
  }

  const response = await throttle(() =>
    backend.pages.create({
      parent: {
        database_id,
        type: 'database_id',
      },
      // @ts-ignore
      properties,
    }),
  )

  return response.id
}

export async function updatePerson(backend: Client, throttle: ThrottleFunction, person: Person): Promise<void> {
  try {
    // Save the updated Person object back to Notion
    await throttle(() =>
      backend.pages.update({
        page_id: person.id,
        properties: {
          Email: {
            email: person.email,
          },
          MailchimpProfile: {
            url: person.mailchimpProfile,
          },
          Name: {
            title: [
              {
                text: {
                  content: person.name,
                },
              },
            ],
          },
          Phone: {
            phone_number: person.phoneNumber,
          },
        },
      }),
    )

    console.log(`Person ${person.id} updated`)
  } catch (error) {
    console.error(`Failed to update  person with ID ${person.id}:`, error)
    throw error
  }
}
