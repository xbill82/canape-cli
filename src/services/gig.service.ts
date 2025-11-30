import {Client} from '@notionhq/client'
import {ThrottleFunction} from './notion.backend.js'
import {select} from '@inquirer/prompts'
import input from '@inquirer/input'
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
    const searchTerm = await input({
      message: 'Search for a show:',
      validate: (value) => value.trim().length > 0 || 'Show search term is required',
    })

    const shows = await searchShowsByTitle(this.backend, this.throttle, searchTerm.trim())

    if (shows.length === 0) {
      throw new Error(`No shows found matching "${searchTerm}"`)
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
