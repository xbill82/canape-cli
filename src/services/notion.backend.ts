import throttledQueue from 'throttled-queue';
import _ from 'lodash';
import { Client } from '@notionhq/client'

export type NotionResponseProperty = {
  id: string
  type: 'relation' | 'number' | 'title' | 'text' | 'url'
}

export const getBackend = (apiKey: string) => new Client({
    auth: apiKey,
  })

export const getThrottle = () => throttledQueue(5, 1000);

export const findPropertyById = (properties: any, propertyId: string):any => {
  const propertyKey: string = _.findKey(properties, { 'id': propertyId }) as string;
  return properties[propertyKey]
}

export const getNumber = (props: any, key: string): number => _.get(props, `${key}.number`);
export const getRichText = (props: any, key: string): string => _.get(props, `${key}.rich_text[0].text.content`);
export const getTitle = (props: any, key: string): string => _.get(props, `${key}.title[0].text.content`);
export const getDate = (props: any, key: string): string => _.get(props, `${key}.date.start`) as unknown as string