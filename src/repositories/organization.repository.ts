import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Organization} from '../domain/organization.js'
import {ThrottleFunction} from '../services/notion.backend.js'

export const database_id = '2b43368090ff4153bc4896d7a1abdc94'

export const fetchOrganizationById = async (
  backend: Client,
  throttle: ThrottleFunction,
  id: string,
): Promise<Organization> => {
  console.debug(`🏗️ Fetching Organization with id ${id}...`)

  const response = await throttle(() =>
    backend.pages.retrieve({
      page_id: id,
    }),
  )

  return new Organization(response as PageObjectResponse)
}

export async function create(backend: Client, organization: Organization): Promise<string> {
  const response = await backend.pages.create({
    parent: {
      database_id,
      type: 'database_id',
    },
    properties: {
      Address: {
        rich_text: [
          {
            text: {
              content: organization.address,
            },
          },
        ],
      },
      name: {
        title: [
          {
            text: {
              content: organization.name,
            },
          },
        ],
      },
      // Website: {
      //   url: organization.website
      // }
      // Type: {
      //   multi_select: [
      //     {
      //       name: organization.
      //     }
      //   ]
      // }
    },
  })

  return response.id
}
