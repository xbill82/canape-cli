import {Mistral} from '@mistralai/mistralai'
import * as components from '@mistralai/mistralai/models/components/index.js'
import {ParsedChatCompletionRequest} from '@mistralai/mistralai/extra/structChat.js'
import {z} from 'zod'

import config from './config.js'

type AvailableMistralModels = keyof typeof MODELS_CAPACITIES

const MODELS_CAPACITIES = {
  'mistral-large-latest': {
    input: 0.002,
    output: 0.006,
    tokens: {output: 8192, total: 128_000},
  },
  'mistral-medium-latest': {
    input: 0.0027,
    output: 0.0081,
    tokens: {output: 8192, total: 32_768},
  },
  'mistral-small-latest': {
    input: 0.002,
    output: 0.006,
    tokens: {output: 8192, total: 32_768},
  },
} as const

type Model = keyof typeof MODELS_CAPACITIES

export class MistralAIService {
  public model: Model
  public temperature = 0
  private _lazyClient: Mistral | null = null

  constructor({
    model = 'mistral-large-latest',
    temperature = 0.2,
  }: {
    model?: Model
    temperature?: number
  } = {}) {
    this.model = model
    this.temperature = temperature
  }

  get client() {
    if (!this._lazyClient) {
      this._lazyClient = new Mistral({
        apiKey: config.mistralKey,
      })
    }

    return this._lazyClient
  }

  async complete(
    prompt: string,
    {
      model = this.model,
      // eslint-disable-next-line perfectionist/sort-objects
      maxTokens = MODELS_CAPACITIES[model].tokens.output - 1,
      temperature = this.temperature,
    }: {
      maxTokens?: number
      model?: string
      temperature?: number
    } & {model?: AvailableMistralModels},
  ): Promise<string> {
    const completionsParams: components.ChatCompletionRequest = {
      maxTokens,
      messages: [{content: prompt, role: 'user'}],
      model,
      responseFormat: {
        type: 'json_object',
      },
      temperature,
    }

    return this.completion(completionsParams)
  }

  async parse<T extends z.ZodTypeAny>(
    prompt: string,
    schema: T,
    {
      model = this.model,
      // eslint-disable-next-line perfectionist/sort-objects
      maxTokens = MODELS_CAPACITIES[model].tokens.output - 1,
      temperature = this.temperature,
    }: {
      maxTokens?: number
      model?: string
      temperature?: number
    } & {model?: AvailableMistralModels} = {},
  ): Promise<z.infer<T>> {
    const parsedRequest: ParsedChatCompletionRequest<T> = {
      maxTokens,
      messages: [{content: prompt, role: 'user'}],
      model,
      responseFormat: schema,
      temperature,
    }

    const completion = await this.client.chat.parse(parsedRequest)

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('Mistral AI returned no choices')
    }

    const parsed = completion.choices[0]?.message?.parsed

    if (!parsed) {
      throw new Error('Mistral AI returned an empty parsed answer')
    }

    if (!completion.usage) {
      throw new Error('Mistral AI returned an empty usage object')
    }

    return parsed
  }

  private async completion(params: components.ChatCompletionRequest) {
    const completion = await this.client.chat.complete(params)

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error('Mistral AI returned an empty answer')
    }

    const answer =
      typeof content === 'string'
        ? content
        : content
            .filter((chunk): chunk is components.TextChunk & {type: 'text'} => chunk.type === 'text')
            .map((chunk) => chunk.text)
            .join('')

    if (!answer) {
      throw new Error('Mistral AI returned an empty answer')
    }

    if (!completion.usage) {
      throw new Error('Mistral AI returned an empty usage object')
    }

    return answer
  }
}
