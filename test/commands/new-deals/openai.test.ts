import {expect} from 'chai'

import {OpenAIService} from '../../../src/services/openAI.service.js'

describe('OpenAIService', () => {
  const openAIService: OpenAIService = new OpenAIService()

  it('should complete a prompt successfully', async () => {
    const prompt = 'What is the capital of France? Answer in one word.'
    const response = await openAIService.complete(prompt, {maxTokens: 50}) // Add the second argument as needed

    expect(response).to.equal('Paris')
  })
})
