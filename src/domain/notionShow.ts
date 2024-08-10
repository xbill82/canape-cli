import _ from 'lodash';
import { getRichText, getTitle } from '../services/notion.backend.js';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';

export class Show {
    id: string
    title: string

    constructor(rawShow: PageObjectResponse) {
        this.id = getRichText(rawShow.properties, 'ID');
        this.title = getTitle(rawShow.properties, 'Title');
    }
}
