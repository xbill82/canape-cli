import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Gig, GigRelations} from '../domain/gig.js'
import {Person} from '../domain/person.js'
import {ThrottleFunction, findPropertyById} from '../services/notion.backend.js'
import {fetchShowById} from './show.repository.js'

const showKeyId = '%2F7eo'
export const database_id = '52873389c460496ab652ce3027453753'

export const fetchGigById = async (backend: Client, throttle: ThrottleFunction, id: string): Promise<Gig> => {
  console.debug(`🏗️ Fetching Gig with id ${id}...`)
  const response: PageObjectResponse = await throttle(
    () =>
      backend.pages.retrieve({
        page_id: id,
      }) as Promise<PageObjectResponse>,
  )

  // console.debug(JSON.stringify(response, null, 2))

  const relations: GigRelations = {
    show: undefined,
  }

  const showProp = findPropertyById(response.properties, showKeyId)

  if (showProp?.relation) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const showId = showProp.relation.map((r: any) => r.id)[0]
    relations.show = await fetchShowById(backend, throttle, showId)
  }

  return new Gig(response, relations)
}

export async function create(backend: Client, person: Person): Promise<string> {
  const response = await backend.pages.create({
    parent: {
      database_id,
      type: 'database_id',
    },
    properties: {
      Email: {
        email: person.email,
      },
      Phone: {
        phone_number: person.phoneNumber,
      },
      name: {
        title: [
          {
            text: {
              content: person.name,
            },
          },
        ],
      },
      // TODO relations (organizations, deals)
    },
  })

  return response.id
}
