import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'
import dayjs from 'dayjs'
import 'dayjs/locale/fr.js'

import {findPropertyById, getDate} from '../services/notion.backend.js'
import {Gig} from './gig.js'
import {Organization} from './organization.js'

const amountKeyId = '%7CDkA'

export type DealRelations = {
  gigs?: Gig[]
  organization?: Organization
}

export class Deal {
  amount: number
  date: string
  deadlineForCommElements: string
  gigs: Gig[]
  id: string
  organization: Organization
  url: string

  constructor(rawDeal: PageObjectResponse, relations: DealRelations) {
    const amountProp = findPropertyById(rawDeal.properties, amountKeyId)

    this.id = rawDeal.id
    this.url = rawDeal.url
    this.amount = amountProp.number
    this.date = getDate(rawDeal.properties, 'Date')

    if (!relations.gigs) {
      throw new Error('Unable to create Deal without Gigs')
    }

    this.gigs = relations.gigs

    if (!relations.organization) {
      throw new Error('Unable to create Deal without Organization')
    }

    this.organization = relations.organization
    this.deadlineForCommElements = dayjs(this.date).subtract(20, 'day').locale('fr').format('D MMMM YYYY')
  }
}
