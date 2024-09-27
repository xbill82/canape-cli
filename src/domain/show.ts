import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {getRichText, getTitle} from '../services/notion.backend.js'

export class Show {
  id: string
  title: string

  constructor(rawShow: PageObjectResponse) {
    this.id = getRichText(rawShow.properties, 'ID')
    this.title = getTitle(rawShow.properties, 'Title')
  }
}
