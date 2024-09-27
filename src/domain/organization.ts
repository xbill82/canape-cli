import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {getNumber, getRichText, getTitle} from '../services/notion.backend.js'

export class Organization {
  address: string
  APE?: string
  id: string
  legalPersonName: string
  legalPersonPosition: string
  licenceNumber?: number
  name: string
  SIRET: number

  constructor(rawOrg: PageObjectResponse) {
    this.id = rawOrg.id
    this.name = getTitle(rawOrg.properties, 'Name')
    this.SIRET = getNumber(rawOrg.properties, 'SIRET')
    this.APE = getRichText(rawOrg.properties, 'APE')
    this.licenceNumber = getNumber(rawOrg.properties, 'Licence')
    this.legalPersonName = getRichText(rawOrg.properties, 'LegalPersonName')
    this.legalPersonPosition = getRichText(rawOrg.properties, 'LegalPersonPosition')
    this.address = getRichText(rawOrg.properties, 'Address')
  }
}
