import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'

import {getEmail, getMultiSelect, getNumber, getRichText, getTitle, getUrl} from '../services/notion.backend.js'

export class Organization {
  address?: string
  APE?: string
  id: string
  legalPersonName?: string
  legalPersonPosition?: string
  licenceNumber?: number
  name: string
  SIRET?: number
  email: string
  website?: string
  type?: string[]
  facturationProId?: number

  constructor(rawOrg: PageObjectResponse) {
    this.id = rawOrg.id
    this.name = getTitle(rawOrg.properties, 'Name')
    this.SIRET = getNumber(rawOrg.properties, 'SIRET')
    this.APE = getRichText(rawOrg.properties, 'APE')
    this.licenceNumber = getNumber(rawOrg.properties, 'Licence')
    this.legalPersonName = getRichText(rawOrg.properties, 'LegalPersonName')
    this.legalPersonPosition = getRichText(rawOrg.properties, 'LegalPersonPosition')
    this.address = getRichText(rawOrg.properties, 'Address')
    this.email = getEmail(rawOrg.properties, 'Email')
    this.website = getUrl(rawOrg.properties, 'Website')
    this.type = getMultiSelect(rawOrg.properties, 'Type') ?? []
    this.facturationProId = getNumber(rawOrg.properties, 'FacturationProId')
  }
}
