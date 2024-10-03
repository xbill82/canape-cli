// eslint-disable-next-line import/no-named-as-default
import OpenAI from 'openai'

import config from './config.js'

type AvailableOpenAIModels = keyof typeof MODELS_CAPACITIES

const MODELS_CAPACITIES = {
  // Structured Output only works with at least gpt-4o-2024-08-06
  'gpt-4o-2024-08-06': {
    input: 0.005,
    output: 0.015,
    tokens: {output: 4096, total: 128_000},
  },
} as const

type Model = keyof typeof MODELS_CAPACITIES

type OpenAICompletionParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming

export class OpenAIService {
  public model: Model
  public temperature = 0
  private _lazyClient: OpenAI | null = null

  constructor({
    model = 'gpt-4o-2024-08-06',
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
      this._lazyClient = new OpenAI({
        apiKey: config.openAIKey,
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
    } & {model?: AvailableOpenAIModels},
  ): Promise<string> {
    const completionsParams: OpenAICompletionParams = {
      max_tokens: maxTokens,
      messages: [{content: prompt, role: 'user'}],
      model,
      response_format: {
        type: 'json_object',
      },
      temperature,
    }

    return this.completion(completionsParams)
  }

  private async completion(params: OpenAICompletionParams) {
    const completion = await this.client.chat.completions.create(params)

    if (completion.choices[0].message.refusal) {
      throw new Error('OpenAI refused to generate content')
    }

    const answer = completion.choices[0].message.content

    if (!answer) {
      throw new Error('OpenAI returned an empty answer')
    }

    if (!completion.usage) {
      throw new Error('OpenAI returned an empty usage object')
    }

    return answer
  }
}
