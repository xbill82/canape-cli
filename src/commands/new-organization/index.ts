import {Command} from '@oclif/core'
import confirm from '@inquirer/confirm'

import conf from '../../services/config.js'

import {getBackend, getThrottle} from '../../services/notion.backend.js'
import {
  getBackend as getFacturationProBackend,
  getThrottle as getFacturationProThrottle,
} from '../../services/facturation.pro.backend.js'
import OrganizationService from '../../services/organization.service.js'
import PersonService from '../../services/person.service.js'
import {updateOrganizationWithPerson} from '../../repositories/organization.repository.js'

export default class NewOrganization extends Command {
  static description = 'Create a new organization in Notion'

  async run(): Promise<void> {
    const backend = getBackend(conf.notionApiKey)
    const throttle = getThrottle()

    const organizationService = new OrganizationService(backend, throttle)
    const organization = await organizationService.findOrCreateOrganization()

    this.log('\n📋 Organization Details:')
    this.log(`   ID: ${organization.id}`)
    this.log(`   Name: ${organization.name}`)
    this.log(`   Email: ${organization.email}`)
    if (organization.address) this.log(`   Address: ${organization.address}`)
    if (organization.APE) this.log(`   APE: ${organization.APE}`)
    if (organization.SIRET) this.log(`   SIRET: ${organization.SIRET}`)
    if (organization.licenceNumber) this.log(`   Licence: ${organization.licenceNumber}`)
    if (organization.legalPersonName) this.log(`   Legal Person Name: ${organization.legalPersonName}`)
    if (organization.legalPersonPosition) this.log(`   Legal Person Position: ${organization.legalPersonPosition}`)
    if (organization.website) this.log(`   Website: ${organization.website}`)
    if (organization.type && organization.type.length > 0) this.log(`   Type: ${organization.type.join(', ')}`)

    const shouldCreatePerson = await confirm({
      message: 'Do you want to create a person for this organization?',
      default: false,
    })

    if (shouldCreatePerson) {
      const personService = new PersonService(backend, throttle)
      const person = await personService.createPerson(organization.id)

      this.log('\n👤 Person Details:')
      this.log(`   ID: ${person.id}`)
      this.log(`   Name: ${person.name}`)
      this.log(`   Email: ${person.email}`)
      if (person.phoneNumber) this.log(`   Phone: ${person.phoneNumber}`)

      if (conf.facturationProApiIdentifier && conf.facturationProApiKey && conf.facturationProFirmId) {
        const facturationProBackend = getFacturationProBackend({
          apiIdentifier: conf.facturationProApiIdentifier,
          apiKey: conf.facturationProApiKey,
          firmId: conf.facturationProFirmId,
        })
        const facturationProThrottle = getFacturationProThrottle()

        await updateOrganizationWithPerson(
          organization,
          person,
          facturationProBackend,
          facturationProThrottle,
          conf.facturationProFirmId,
        )
      }
    }
  }
}
