import {Command} from '@oclif/core'

import conf from '../../services/config.js'

import {getBackend, getThrottle} from '../../services/notion.backend.js'
import OrganizationService from '../../services/organization.service.js'

export default class NewOrganization extends Command {
  static description = 'Create a new organization in Notion'

  async run(): Promise<void> {
    const backend = getBackend(conf.notionApiKey)
    const throttle = getThrottle()

    const organizationService = new OrganizationService(backend, throttle)
    const organization = await organizationService.createOrganization()

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
  }
}
