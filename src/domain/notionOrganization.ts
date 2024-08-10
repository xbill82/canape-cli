import _ from 'lodash';
import { getNumber, getRichText, getTitle } from '../services/notion.backend.js';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';

export class Organization {
    id: string
    name: string
    SIRET: number
    APE?: string
    licenceNumber?: number
    legalPersonName: string
    legalPersonPosition: string
    address: string

    constructor(rawOrg: PageObjectResponse) {
        this.id = rawOrg.id;
        this.name = getTitle(rawOrg.properties, 'Name');
        this.SIRET = getNumber(rawOrg.properties, 'SIRET');
        this.APE = getRichText(rawOrg.properties, 'APE');
        this.licenceNumber = getNumber(rawOrg.properties, 'Licence');
        this.legalPersonName = getRichText(rawOrg.properties, 'LegalPersonName');
        this.legalPersonPosition = getRichText(rawOrg.properties, 'LegalPersonPosition');
        this.address = getRichText(rawOrg.properties, 'Address');
    }
}