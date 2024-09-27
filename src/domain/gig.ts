import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'
import dayjs from 'dayjs'
import 'dayjs/locale/fr.js'
import _ from 'lodash'

import {getDate, getRichText} from '../services/notion.backend.js'
import {Show} from './show.js'

export type GigRelations = {
  show?: Show
}

export class Gig {
  city: string
  formattedDate: string
  id: string
  showTitle: string
  timestamp: string

  constructor(rawGig: PageObjectResponse, relations: GigRelations) {
    this.id = `${_.get(rawGig.properties, 'ID.unique_id.prefix', 'GIG')}-${_.get(
      rawGig.properties,
      'ID.unique_id.number',
      null,
    )}`
    this.showTitle = _.get(relations, 'show.title', false) || getRichText(rawGig.properties, 'CustomTitle')
    this.timestamp = getDate(rawGig.properties, 'When')
    this.formattedDate = dayjs(this.timestamp).locale('fr').format('D MMMM YYYY')
    this.city = getRichText(rawGig.properties, 'City')
  }
}