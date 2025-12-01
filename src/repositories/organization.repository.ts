import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'
import {AxiosInstance} from 'axios'

import {Organization} from '../domain/organization.js'
import {
  createCustomer,
  FacturationProCustomer,
  searchCustomers,
  ThrottleFunction as FacturationProThrottleFunction,
  updateCustomer,
} from '../services/facturation.pro.backend.js'
import {Person} from '../domain/person.js'
import {ThrottleFunction} from '../services/notion.backend.js'

import createDebug from 'debug'
const debug = createDebug('organization:repository')

export const database_id = '2b43368090ff4153bc4896d7a1abdc94'

export async function searchOrganizationsByName(
  backend: Client,
  throttle: ThrottleFunction,
  searchTerm: string,
): Promise<Organization[]> {
  if (!searchTerm.trim()) {
    return []
  }

  const response = await throttle(() =>
    backend.databases.query({
      database_id,
      filter: {
        property: 'Name',
        title: {
          contains: searchTerm,
        },
      },
    }),
  )

  return response.results.map((page) => new Organization(page as PageObjectResponse))
}

export const fetchOrganizationById = async (
  backend: Client,
  throttle: ThrottleFunction,
  id: string,
): Promise<Organization> => {
  debug(`🏗️ Fetching Organization with id ${id}...`)

  const response = await throttle(() =>
    backend.pages.retrieve({
      page_id: id,
    }),
  )

  return new Organization(response as PageObjectResponse)
}

function mapOrganizationToFacturationProCustomer(organization: Organization): FacturationProCustomer {
  const customer: FacturationProCustomer = {
    company_name: organization.name,
    individual: false,
    email: organization.email || undefined,
    website: organization.website || undefined,
    siret: organization.SIRET ? String(organization.SIRET) : undefined,
  }

  if (organization.address) {
    customer.street = organization.address
  }

  return customer
}

function splitName(name: string): {firstName: string; lastName: string} {
  const nameParts = name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
  return {firstName, lastName}
}

function mapPersonToFacturationProCustomerUpdate(person: Person): Partial<FacturationProCustomer> {
  const {firstName, lastName} = splitName(person.name)
  const update: Partial<FacturationProCustomer> = {}

  if (firstName) {
    update.first_name = firstName
  }
  if (lastName) {
    update.last_name = lastName
  }
  if (person.email) {
    update.email = person.email
  }
  if (person.phoneNumber) {
    update.phone = person.phoneNumber
  }

  return update
}

export async function updateOrganizationWithPerson(
  organization: Organization,
  person: Person,
  facturationProBackend?: AxiosInstance,
  facturationProThrottle?: FacturationProThrottleFunction,
  firmId?: string,
): Promise<void> {
  if (!facturationProBackend || !facturationProThrottle || !firmId) {
    return
  }

  try {
    let customerId: number

    if (organization.facturationProId) {
      customerId = organization.facturationProId
    } else {
      const customers = await searchCustomers(
        facturationProBackend,
        facturationProThrottle,
        firmId,
        organization.name,
        organization.SIRET ? String(organization.SIRET) : undefined,
      )

      if (customers.length === 0) {
        console.warn(`No Facturation.pro customer found for organization "${organization.name}"`)
        return
      }

      customerId = customers[0].id
    }

    const updateData = mapPersonToFacturationProCustomerUpdate(person)

    await updateCustomer(facturationProBackend, facturationProThrottle, firmId, customerId, updateData)
    console.log(`Updated Facturation.pro customer ${customerId} with person data`)
  } catch (error) {
    console.error('Failed to update organization in Facturation.pro with person data:', error)
  }
}

export async function create(
  notionBackend: Client,
  organization: Organization,
  facturationProBackend?: AxiosInstance,
  facturationProThrottle?: FacturationProThrottleFunction,
  firmId?: string,
): Promise<Organization> {
  const response = await notionBackend.pages.create({
    parent: {
      database_id,
      type: 'database_id',
    },
    properties: {
      Address: {
        rich_text: [
          {
            text: {
              content: organization.address ?? '',
            },
          },
        ],
      },
      Name: {
        title: [
          {
            text: {
              content: organization.name,
            },
          },
        ],
      },
      Email: {
        email: organization.email,
      },
      SIRET: {
        number: organization.SIRET ?? null,
      },
      APE: {
        rich_text: [
          {
            text: {
              content: organization.APE ?? '',
            },
          },
        ],
      },
      Licence: {
        number: organization.licenceNumber ?? null,
      },
      LegalPersonName: {
        rich_text: [
          {
            text: {
              content: organization.legalPersonName ?? '',
            },
          },
        ],
      },
      LegalPersonPosition: {
        rich_text: [
          {
            text: {
              content: organization.legalPersonPosition ?? '',
            },
          },
        ],
      },
      Website: {
        url: organization.website ?? null,
      },
      Type: {
        multi_select: (organization.type ?? []).map((type) => ({name: type})),
      },
    },
  })

  organization.id = response.id

  if (facturationProBackend && facturationProThrottle && firmId) {
    try {
      const customerData = mapOrganizationToFacturationProCustomer(organization)
      const customerResponse = await createCustomer(facturationProBackend, facturationProThrottle, firmId, customerData)

      await notionBackend.pages.update({
        page_id: organization.id,
        properties: {
          FacturationProId: {
            number: customerResponse.id,
          },
        },
      })

      organization.facturationProId = customerResponse.id
    } catch (error) {
      console.error('Failed to create organization in Facturation.pro:', error)
    }
  }

  return organization
}
