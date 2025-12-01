import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {Gig, GigRelations} from '../domain/gig.js'
import {Show} from '../domain/show.js'
import {ThrottleFunction, findPropertyById} from '../services/notion.backend.js'
import {fetchShowById} from './show.repository.js'

import createDebug from 'debug'
const debug = createDebug('gig:repository')

const showKeyId = '%2F7eo'
export const database_id = '13b920e1f55247fb9a7708a9c29faaa7'

export type CreateGigData = {
  gigTitle: string
  dealId: string
  timestamp: string
  show?: Show
  organizationId?: string
  city?: string
  customTitle?: string
}

export const fetchGigById = async (backend: Client, throttle: ThrottleFunction, id: string): Promise<Gig> => {
  debug(`🏗️ Fetching Gig with id ${id}...`)
  const response: PageObjectResponse = await throttle(
    () =>
      backend.pages.retrieve({
        page_id: id,
      }) as Promise<PageObjectResponse>,
  )

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

export async function create(backend: Client, throttle: ThrottleFunction, gigData: CreateGigData): Promise<string> {
  const properties: Record<string, unknown> = {
    Title: {
      title: [
        {
          text: {
            content: gigData.gigTitle,
          },
        },
      ],
    },
  }

  if (gigData.show) {
    properties.Show = {
      relation: [
        {
          id: gigData.show.id,
        },
      ],
    }
  }

  if (gigData.dealId) {
    properties.Deal = {
      relation: [
        {
          id: gigData.dealId,
        },
      ],
    }
  }

  if (gigData.organizationId) {
    properties.Organizer = {
      relation: [
        {
          id: gigData.organizationId,
        },
      ],
    }
  }

  if (gigData.city) {
    properties.City = {
      rich_text: [
        {
          text: {
            content: gigData.city,
          },
        },
      ],
    }
  }

  if (gigData.timestamp) {
    properties.When = {
      date: {
        start: gigData.timestamp,
      },
    }
  }

  if (gigData.customTitle) {
    properties.CustomTitle = {
      rich_text: [
        {
          text: {
            content: gigData.customTitle,
          },
        },
      ],
    }
  }

  const response = await throttle(() =>
    backend.pages.create({
      parent: {
        database_id,
        type: 'database_id',
      },
      // @ts-ignore
      properties,
    }),
  )

  return response.id
}
