import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Organization} from '../domain/organization.js'
import {ThrottleFunction} from '../services/notion.backend.js'

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
