import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Deal, DealRelations} from '../domain/deal.js'
import {ThrottleFunction, findPropertyById} from '../services/notion.backend.js'
import {fetchGigById} from './gig.repository.js'
import {fetchOrganizationById} from './organization.repository.js'

const gigsKeyId = '%3E%5BC%60'
const organizationKeyId = '%60pci'
export const database_id = 'fa11369600934541bd62329dcad2ec16'

export const fetchDealById = async (backend: Client, throttle: ThrottleFunction, id: string): Promise<Deal> => {
  console.debug(`🏗️ Fetching Deal with id ${id}...`)
  const response: PageObjectResponse = await throttle(
    () =>
      backend.pages.retrieve({
        page_id: id,
      }) as Promise<PageObjectResponse>,
  )

  // console.debug(JSON.stringify(response, null, 2))

  const relations: DealRelations = {
    gigs: undefined,
    organization: undefined,
  }

  const gigsProp = findPropertyById(response.properties, gigsKeyId)
  if (gigsProp?.relation) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gigIds = gigsProp.relation.map((r: any) => r.id)
    relations.gigs = await Promise.all(gigIds.map((id: string) => fetchGigById(backend, throttle, id)))
  }

  const organizationProp = findPropertyById(response.properties, organizationKeyId)
  if (organizationProp?.relation) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const organizationId = organizationProp.relation.map((r: any) => r.id)[0]
    relations.organization = await fetchOrganizationById(backend, throttle, organizationId)
  }

  return new Deal(response, relations)
}

export async function create(backend: Client, deal: Deal, dealName: string, content: string) {
  const response = await backend.pages.create({
    children: [
      {
        object: 'block',
        paragraph: {
          rich_text: [
            {
              text: {
                content,
              },
            },
          ],
        },
      },
    ],
    parent: {
      database_id,
      type: 'database_id',
    },
    properties: {
      Date: {
        date: {
          start: deal.date,
        },
      },
      Gigs: {
        relation: deal.gigs.map((g) => ({id: g.id})),
      },
      Name: {
        title: [
          {
            text: {
              content: dealName,
            },
          },
        ],
      },
      Organization: {
        relation: [
          {
            id: deal.organization.id,
          },
        ],
      },
      // TODO Person relation
    },
  })

  return response.id
}
