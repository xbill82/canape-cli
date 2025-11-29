import {Client} from '@notionhq/client'
import {Organization} from '../domain/organization.js'
import {ThrottleFunction} from './facturation.pro.backend.js'
import input from '@inquirer/input'
import confirm from '@inquirer/confirm'
import {search} from '@inquirer/prompts'
import {
  getBackend as getFacturationProBackend,
  getThrottle as getFacturationProThrottle,
} from './facturation.pro.backend.js'
import {searchOrganizationsByName, create as createOrganization} from '../repositories/organization.repository.js'
import conf from '../services/config.js'

type NewOrganizationOption = {isNew: true; name: string}
type SearchResult = Organization | NewOrganizationOption

export default class OrganizationService {
  private backend: Client
  private throttle: ThrottleFunction

  constructor(backend: Client, throttle: ThrottleFunction) {
    this.backend = backend
    this.throttle = throttle
  }

  private isNewOrganization(value: SearchResult): value is NewOrganizationOption {
    return 'isNew' in value && value.isNew === true
  }

  async createOrganization(): Promise<Organization> {
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
      const name = selected.name
      const email = await input({
        message: 'Email:',
        validate: (value) => value.trim().length > 0 || 'Email is required',
      })
      const address = await input({message: 'Address (optional):', default: ''})
      const APE = await input({message: 'APE (optional):', default: ''})
      const legalPersonName = await input({message: 'Legal person name (optional):', default: ''})
      const legalPersonPosition = await input({message: 'Legal person position (optional):', default: ''})

      const siretInput = await input({message: 'SIRET (optional):', default: ''})
      const SIRET = siretInput.trim() ? Number(siretInput) : undefined

      const licenceInput = await input({message: 'Licence number (optional):', default: ''})
      const licenceNumber = licenceInput.trim() ? Number(licenceInput) : undefined

      const website = await input({message: 'Website (optional):', default: ''})

      const types: string[] = []
      let addType = true
      while (addType) {
        const type = await input({message: 'Type (optional, press Enter to skip):', default: ''})
        if (type.trim()) {
          types.push(type.trim())
          addType = await confirm({message: 'Add another type?', default: false})
        } else {
          addType = false
        }
      }

      const createdOrganization: Organization = {
        id: '', // Will be set after creation
        name: name.trim(),
        email: email.trim(),
        address: address.trim() || undefined,
        APE: APE.trim() || undefined,
        legalPersonName: legalPersonName.trim() || undefined,
        legalPersonPosition: legalPersonPosition.trim() || undefined,
        SIRET,
        licenceNumber,
        website: website.trim() || undefined,
        type: types.length > 0 ? types : undefined,
      } as Organization

      let facturationProBackend
      let facturationProThrottle
      let firmId

      if (conf.facturationProApiIdentifier && conf.facturationProApiKey && conf.facturationProFirmId) {
        facturationProBackend = getFacturationProBackend({
          apiIdentifier: conf.facturationProApiIdentifier,
          apiKey: conf.facturationProApiKey,
          firmId: conf.facturationProFirmId,
        })
        facturationProThrottle = getFacturationProThrottle()
        firmId = conf.facturationProFirmId
      }

      const organizationId = await createOrganization(
        this.backend,
        createdOrganization,
        facturationProBackend,
        facturationProThrottle,
        firmId,
      )

      createdOrganization.id = organizationId
      return createdOrganization
    } else {
      return selected
    }
  }
}
