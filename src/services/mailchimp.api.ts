import * as mailchimp from '@mailchimp/mailchimp_marketing'

import config from './config.js'

export const mailchimpClient = () => {
  // Initialize Mailchimp client
  mailchimp.setConfig({
    apiKey: config.mailchimpApiKey,
    server: config.mailchimpServerPrefix,
  })

  return mailchimp
}
