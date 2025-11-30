import {Client} from '@notionhq/client'
import {ThrottleFunction} from './notion.backend.js'
import {select} from '@inquirer/prompts'
import {searchShowsByTitle} from '../repositories/show.repository.js'
import {Show} from '../domain/show.js'
import {create as createGig, CreateGigData} from '../repositories/gig.repository.js'

export default class GigService {
  private backend: Client
  private throttle: ThrottleFunction

  constructor(backend: Client, throttle: ThrottleFunction) {
    this.backend = backend
    this.throttle = throttle
  }

  async selectShow(): Promise<Show> {
    const shows = await searchShowsByTitle(this.backend, this.throttle)

    if (shows.length === 0) {
      throw new Error('No shows found. Please create a show first.')
    }

    const selectedShow = await select({
      message: 'Select a show:',
      choices: shows.map((show) => ({
        name: show.title,
        value: show,
      })),
    })

    return selectedShow
  }

  async createGig(gigData: CreateGigData): Promise<string> {
    return await createGig(this.backend, this.throttle, gigData)
  }
}
