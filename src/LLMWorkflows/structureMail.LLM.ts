import {Email} from '../repositories/email.repository.js'
import {CreateDealInput, CreateDealInputSchema} from '../services/deal.service.js'
import {MistralAIService} from '../services/mistralAI.service.js'

export async function structureMail(mail: Email): Promise<CreateDealInput> {
  const instructions = `Tu es un excellent assistant commercial. Ton travail est d'extraire de l'information commerciale des mails que l'on te soumet. Ces informations permettront le remplissage de fiches clients dans un CRM.`

  const prompt = `${instructions}

Tu as reçu ce mail

# BEGIN EMAIL
${mail.serialize()}
# END EMAIL

Extrais les informations demandées dans le format JSON structuré selon le schéma fourni.`

  const LLM = new MistralAIService()

  const parsed = await LLM.parse(prompt, CreateDealInputSchema, {maxTokens: 2048})

  return {
    dealTitle: parsed.dealTitle,
    organizer: parsed.organizer,
    decisionMaker: parsed.decisionMaker,
    gig: parsed.gig
      ? {
          show: {title: parsed.gig.show.title},
          timestamp: parsed.gig.timestamp,
          city: parsed.gig.city,
          gigTitle: parsed.gig.gigTitle,
        }
      : undefined,
  }
}
