import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Show} from '../domain/show.js'
import {ThrottleFunction} from '../services/notion.backend.js'

export const fetchShowById = async (backend: Client, throttle: ThrottleFunction, id: string): Promise<Show> => {
  console.debug(`🏗️ Fetching Show with id ${id}...`)
  const response = await throttle(() =>
    backend.pages.retrieve({
      page_id: id,
    }),
  )

  // console.debug(JSON.stringify(response, null, 2))

  return new Show(response as PageObjectResponse)
}
