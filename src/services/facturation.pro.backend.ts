import axios, {AxiosInstance, AxiosError} from 'axios'
// eslint-disable-next-line import/no-named-as-default
import throttledQueue from 'throttled-queue'

export type FacturationProConfig = {
  apiIdentifier: string
  apiKey: string
  firmId: string
  userAgent?: string
}

export type PaginationInfo = {
  current_page: number
  total_pages: number
  per_page: number
  total_entries: number
}

export type FacturationProResponse<T> = {
  data: T
  pagination?: PaginationInfo
}

export type ThrottleFunction = <T>(fn: () => Promise<T>) => Promise<T>

export const getThrottle = (): ThrottleFunction => throttledQueue(600, 300_000)

export const getBackend = (config: FacturationProConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: 'https://www.facturation.pro/',
    auth: {
      username: config.apiIdentifier,
      password: config.apiKey,
    },
    headers: {
      'X-User-Agent': config.userAgent || 'Canape-CLI (contact@lecanapedanslarbre.fr)',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status
        const data = error.response.data as {errors?: string[]; error?: string}

        if (status === 429) {
          throw new Error('Rate limit exceeded. Please retry later.')
        }

        if (status === 400 || status === 422) {
          const errorMessage = data.errors?.join(', ') || data.error || 'Invalid request data'
          throw new Error(`Validation error: ${errorMessage}`)
        }

        if (status === 404) {
          throw new Error('The record could not be found')
        }

        if (status === 501) {
          throw new Error('Invalid Content-Type. Ensure you are sending JSON with proper headers.')
        }

        const errorMessage = data.error || error.message || 'An error occurred'
        throw new Error(`API error (${status}): ${errorMessage}`)
      }

      throw error
    },
  )

  return instance
}

export const getPaginationFromHeaders = (headers: Record<string, string>): PaginationInfo | undefined => {
  const paginationHeader = headers['x-pagination']
  if (!paginationHeader) {
    return undefined
  }

  try {
    return JSON.parse(paginationHeader) as PaginationInfo
  } catch {
    return undefined
  }
}

export const getRateLimitInfo = (headers: Record<string, string>): {limit: number; remaining: number} | undefined => {
  const limit = headers['x-ratelimit-limit']
  const remaining = headers['x-ratelimit-remaining']

  if (!limit || !remaining) {
    return undefined
  }

  return {
    limit: Number.parseInt(limit, 10),
    remaining: Number.parseInt(remaining, 10),
  }
}

export const buildUrl = (
  firmId: string,
  resource: string,
  id?: string | number,
  params?: Record<string, string | number>,
): string => {
  let url = `firms/${firmId}/${resource}`
  if (id !== undefined) {
    url += `/${id}`
  }
  url += '.json'

  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, String(value))
    }
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  return url
}

export type FacturationProCustomer = {
  company_name: string
  individual?: boolean
  first_name?: string
  last_name?: string
  email?: string
  street?: string
  city?: string
  zip_code?: string
  country?: string
  phone?: string
  mobile?: string
  fax?: string
  website?: string
  siret?: string
  vat_number?: string
  [key: string]: unknown
}

export type FacturationProCustomerResponse = {
  id: number
  account_code: string
  company_name: string
  individual: boolean
  email: string | null
  street: string | null
  city: string | null
  zip_code: string | null
  country: string | null
  phone: string | null
  mobile: string | null
  fax: string | null
  website: string | null
  siret: string | null
  vat_number: string | null
  [key: string]: unknown
}

export async function createCustomer(
  backend: AxiosInstance,
  throttle: ThrottleFunction,
  firmId: string,
  customer: FacturationProCustomer,
): Promise<FacturationProCustomerResponse> {
  const url = buildUrl(firmId, 'customers')

  const response = await throttle(async () => {
    const result = await backend.post<FacturationProCustomerResponse>(url, customer)
    return result
  })

  return response.data
}
