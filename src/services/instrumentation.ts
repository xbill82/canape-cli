import {NodeSDK} from '@opentelemetry/sdk-node'
import {LangfuseSpanProcessor} from '@langfuse/otel'

import config from './config.js'

const sdk = new NodeSDK({
  spanProcessors: [
    new LangfuseSpanProcessor({
      publicKey: config.langfusePublicKey,
      secretKey: config.langfuseSecretKey,
      baseUrl: config.langfuseBaseUrl || 'https://cloud.langfuse.com',
    }),
  ],
})

sdk.start()
