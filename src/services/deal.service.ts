import {Client} from '@notionhq/client'
import {ThrottleFunction} from './notion.backend.js'
import {search} from '@inquirer/prompts'
import {searchOrganizationsByName} from '../repositories/organization.repository.js'
import {Organization} from '../domain/organization.js'
import OrganizationService from './organization.service.js'

type NewOrganizationOption = {isNew: true; name: string}
type SearchResult = Organization | NewOrganizationOption

export default class DealService {
  private backend: Client
  private throttle: ThrottleFunction
  private organizationService: OrganizationService

  constructor(backend: Client, throttle: ThrottleFunction) {
    this.backend = backend
    this.throttle = throttle
    this.organizationService = new OrganizationService(backend, throttle)
  }

  private isNewOrganization(value: SearchResult): value is NewOrganizationOption {
    return 'isNew' in value && value.isNew === true
  }

  async selectOrCreateOrganization(): Promise<Organization> {
    const selected = await search<SearchResult>({
      message: 'Type the organization name:',
      source: async (input) => {
        if (!input || input.trim().length === 0) {
          return []
        }

        const organizations = await searchOrganizationsByName(this.backend, this.throttle, input.trim())
        const choices = organizations.map((org) => ({
          name: org.name,
          value: org as SearchResult,
        }))

        choices.push({
          name: `Create new organization with name "${input.trim()}"`,
          value: {isNew: true, name: input.trim()} as SearchResult,
        })

        return choices
      },
    })

    if (this.isNewOrganization(selected)) {
      return await this.organizationService.createOrganization()
    } else {
      return selected
    }
  }
}
