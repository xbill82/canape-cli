import {Command} from '@oclif/core'
import input from '@inquirer/input'
import confirm from '@inquirer/confirm'
import {search} from '@inquirer/prompts'

import {Organization} from '../../domain/organization.js'
import {create as createOrganization, searchOrganizationsByName} from '../../repositories/organization.repository.js'
import conf from '../../services/config.js'
import {getBackend, getThrottle} from '../../services/notion.backend.js'

type NewOrganizationOption = {isNew: true; name: string}
type SearchResult = Organization | NewOrganizationOption

function isNewOrganization(value: SearchResult): value is NewOrganizationOption {
  return 'isNew' in value && value.isNew === true
}

export default class NewOrganization extends Command {
  static description = 'Create a new organization in Notion'

  async run(): Promise<void> {
    const backend = getBackend(conf.notionApiKey)
    const throttle = getThrottle()

    const selected = await search<SearchResult>({
      message: 'Type the organization name:',
      source: async (input) => {
        if (!input || input.trim().length === 0) {
          return []
        }

        const organizations = await searchOrganizationsByName(backend, throttle, input.trim())
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

    if (isNewOrganization(selected)) {
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

      const organization: Organization = {
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

      const organizationId = await createOrganization(backend, organization)

      this.log(`✅ Organization created with ID: ${organizationId}`)
    } else {
      const org = selected
      this.log('\n📋 Organization Details:')
      this.log(`   ID: ${org.id}`)
      this.log(`   Name: ${org.name}`)
      this.log(`   Email: ${org.email}`)
      if (org.address) this.log(`   Address: ${org.address}`)
      if (org.APE) this.log(`   APE: ${org.APE}`)
      if (org.SIRET) this.log(`   SIRET: ${org.SIRET}`)
      if (org.licenceNumber) this.log(`   Licence: ${org.licenceNumber}`)
      if (org.legalPersonName) this.log(`   Legal Person Name: ${org.legalPersonName}`)
      if (org.legalPersonPosition) this.log(`   Legal Person Position: ${org.legalPersonPosition}`)
      if (org.website) this.log(`   Website: ${org.website}`)
      if (org.type && org.type.length > 0) this.log(`   Type: ${org.type.join(', ')}`)
    }
  }
}
