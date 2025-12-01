import {Client} from '@notionhq/client'
import {PageObjectResponse, QueryDatabaseParameters} from '@notionhq/client/build/src/api-endpoints.js'

import {Show} from '../domain/show.js'
import {ThrottleFunction} from '../services/notion.backend.js'

import createDebug from 'debug'
const debug = createDebug('show:repository')

// TODO: Replace with actual show database ID from Notion
export const database_id = 'ca3d9449a5b14e11a41d4b051085e8b8'

export async function searchShowsByTitle(
  backend: Client,
  throttle: ThrottleFunction,
  searchTerm?: string,
): Promise<Show[]> {
  let filter: QueryDatabaseParameters['filter'] | undefined = undefined
  if (searchTerm && searchTerm.trim()) {
    filter = {
      property: 'Title',
      title: {
        contains: searchTerm.trim(),
      },
    }
  }

  const response = await throttle(() =>
    backend.databases.query({
      database_id,
      filter,
    }),
  )

  return response.results.map((page) => new Show(page as PageObjectResponse))
}

export const fetchShowById = async (backend: Client, throttle: ThrottleFunction, id: string): Promise<Show> => {
  debug(`🏗️ Fetching Show with id ${id}...`)
  const response = await throttle(() =>
    backend.pages.retrieve({
      page_id: id,
    }),
  )

  return new Show(response as PageObjectResponse)
}
