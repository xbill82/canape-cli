import {Client} from '@notionhq/client'
import {Person} from '../domain/person.js'
import {ThrottleFunction} from './notion.backend.js'
import input from '@inquirer/input'
import {search} from '@inquirer/prompts'
import {searchPersonsByName, create as createPerson} from '../repositories/person.repository.js'

type NewPersonOption = {isNew: true; name: string}
type SearchResult = Person | NewPersonOption

export default class PersonService {
  private backend: Client
  private throttle: ThrottleFunction

  constructor(backend: Client, throttle: ThrottleFunction) {
    this.backend = backend
    this.throttle = throttle
  }

  private isNewPerson(value: SearchResult): value is NewPersonOption {
    return 'isNew' in value && value.isNew === true
  }

  async createPerson(organizationId?: string, dealId?: string): Promise<Person> {
    const selected = await search<SearchResult>({
      message: 'Type the person name:',
      source: async (input) => {
        if (!input || input.trim().length === 0) {
          return []
        }

        const persons = await searchPersonsByName(this.backend, this.throttle, input.trim())
        const choices = persons.map((person) => ({
          name: person.name,
          value: person as SearchResult,
        }))

        choices.push({
          name: `Create new person with name "${input.trim()}"`,
          value: {isNew: true, name: input.trim()} as SearchResult,
        })

        return choices
      },
    })

    if (this.isNewPerson(selected)) {
      const name = selected.name
      const email = await input({
        message: 'Email:',
        validate: (value) => value.trim().length > 0 || 'Email is required',
      })
      const phoneNumber = await input({message: 'Phone number (optional):', default: ''})

      const newPerson: Person = {
        id: '', // Will be set after creation
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || '',
        mailchimpProfile: '',
        organizations: [],
        deals: [],
      } as Person

      return await createPerson(this.backend, this.throttle, newPerson, organizationId, dealId)
    } else {
      return selected
    }
  }
}
