import {Client} from '@notionhq/client'

import {Show} from '../domain/show.js'

export const fetchShowById = async (backend: Client, throttle: Function, id: string): Promise<Show> => {
  console.debug(`🏗️ Fetching Show with id ${id}...`)
  const response = await throttle(() =>
    backend.pages.retrieve({
      page_id: id,
    }),
  )

  // console.debug(JSON.stringify(response, null, 2))

  return new Show(response)
}
