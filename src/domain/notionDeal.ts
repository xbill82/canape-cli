import _ from 'lodash';
import dayjs from 'dayjs'
import 'dayjs/locale/fr.js';
import { Gig } from "./notionGig.js";
import { findPropertyById, getDate } from '../services/notion.backend.js';
import { Organization } from './notionOrganization.js';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';

const amountKeyId = '%7CDkA'

export type DealRelations = {
    gigs?: Gig[]
    organization?: Organization
}

export class Deal {
    id: string
    amount: number
    gigs: Gig[]
    organization: Organization
    date: string
    deadlineForCommElements: string

    constructor(rawDeal: PageObjectResponse, relations: DealRelations) {
        const amountProp = findPropertyById(rawDeal.properties, amountKeyId)

        this.id = rawDeal.id;
        this.amount = amountProp.number;
        this.date = getDate(rawDeal.properties, 'Date')

        if (!relations.gigs) {
            throw new Error('Unable to create Deal without Gigs')
        }
        this.gigs = relations.gigs;

        if (!relations.organization) {
            throw new Error('Unable to create Deal without Organization')
        }
        this.organization = relations.organization;
        this.deadlineForCommElements = dayjs(this.date).subtract(20, 'day').locale('fr').format('D MMMM YYYY');
    }
}