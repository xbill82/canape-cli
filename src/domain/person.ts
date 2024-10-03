import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {getEmail, getPhone, getTitle, getUrl} from '../services/notion.backend.js'
import {Deal} from './deal.js'
import {Organization} from './organization.js'

export class Person {
  deals: Deal[]
  email: string
  id: string
  mailchimpProfile: string
  name: string
  organizations: Organization[]
  phoneNumber: string

  constructor(rawPerson: PageObjectResponse) {
    this.id = rawPerson.id
    this.name = getTitle(rawPerson.properties, 'Name')
    this.email = getEmail(rawPerson.properties, 'Email')
    this.mailchimpProfile = getUrl(rawPerson.properties, 'MailchimpProfile')
    this.phoneNumber = getPhone(rawPerson.properties, 'Phone')
    this.organizations = []
    this.deals = []
  }
}
