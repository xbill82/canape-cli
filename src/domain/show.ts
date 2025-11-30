import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {getTitle} from '../services/notion.backend.js'

export class Show {
  id: string
  title: string

  constructor(rawShow: PageObjectResponse) {
    this.id = rawShow.id
    this.title = getTitle(rawShow.properties, 'Title')
  }
}
