import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Gig, GigRelations} from '../domain/gig.js'
import {findPropertyById} from '../services/notion.backend.js'
import {fetchShowById} from './notionShow.js'

const showKeyId = '%2F7eo'

export const fetchGigById = async (backend: Client, throttle: Function, id: string): Promise<Gig> => {
  console.debug(`🏗️ Fetching Gig with id ${id}...`)
  const response: PageObjectResponse = await throttle(() =>
    backend.pages.retrieve({
      page_id: id,
    }),
  )

  // console.debug(JSON.stringify(response, null, 2))

  const relations: GigRelations = {
    show: undefined,
  }

  const showProp = findPropertyById(response.properties, showKeyId)

  if (showProp?.relation) {
    const showId = showProp.relation.map((r: any) => r.id)[0]
    relations.show = await fetchShowById(backend, throttle, showId)
  }

  return new Gig(response, relations)
}
