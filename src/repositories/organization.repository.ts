import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Organization} from '../domain/organization.js'
import {ThrottleFunction} from '../services/notion.backend.js'

export const database_id = '2b43368090ff4153bc4896d7a1abdc94'

export async function searchOrganizationsByName(
  backend: Client,
  throttle: ThrottleFunction,
  searchTerm: string,
): Promise<Organization[]> {
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

  return response.results.map((page) => new Organization(page as PageObjectResponse))
}

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
              content: organization.address ?? '',
            },
          },
        ],
      },
      Name: {
        title: [
          {
            text: {
              content: organization.name,
            },
          },
        ],
      },
      Email: {
        email: organization.email,
      },
      SIRET: {
        number: organization.SIRET ?? null,
      },
      APE: {
        rich_text: [
          {
            text: {
              content: organization.APE ?? '',
            },
          },
        ],
      },
      Licence: {
        number: organization.licenceNumber ?? null,
      },
      LegalPersonName: {
        rich_text: [
          {
            text: {
              content: organization.legalPersonName ?? '',
            },
          },
        ],
      },
      LegalPersonPosition: {
        rich_text: [
          {
            text: {
              content: organization.legalPersonPosition ?? '',
            },
          },
        ],
      },
      Website: {
        url: organization.website ?? null,
      },
      Type: {
        multi_select: (organization.type ?? []).map((type) => ({name: type})),
      },
    },
  })

  return response.id
}
