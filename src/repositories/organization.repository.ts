import {Client} from '@notionhq/client'
import {PageObjectResponse} from '@notionhq/client/build/src/api-endpoints.js'
import {AxiosInstance} from 'axios'

import {Organization} from '../domain/organization.js'
import {
  createCustomer,
  FacturationProCustomer,
  ThrottleFunction as FacturationProThrottleFunction,
} from '../services/facturation.pro.backend.js'
import {ThrottleFunction} from '../services/notion.backend.js'

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
  console.debug(`🏗️ Fetching Organization with id ${id}...`)

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

export async function create(
  notionBackend: Client,
  organization: Organization,
  facturationProBackend?: AxiosInstance,
  facturationProThrottle?: FacturationProThrottleFunction,
  firmId?: string,
): Promise<string> {
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

  const notionId = response.id

  if (facturationProBackend && facturationProThrottle && firmId) {
    try {
      const customerData = mapOrganizationToFacturationProCustomer(organization)
      await createCustomer(facturationProBackend, facturationProThrottle, firmId, customerData)
    } catch (error) {
      console.error('Failed to create organization in Facturation.pro:', error)
    }
  }

  return notionId
}
