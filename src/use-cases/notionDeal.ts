import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Deal, DealRelations} from '../domain/deal.js'
import {ThrottleFunction, findPropertyById} from '../services/notion.backend.js'
import {fetchGigById} from './notionGig.js'
import {fetchOrganizationById} from './notionOrganization.js'

const gigsKeyId = '%3E%5BC%60'
const organizationKeyId = '%60pci'

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
