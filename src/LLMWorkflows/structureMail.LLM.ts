import {Email} from '../repositories/email.repository.js'
import {OpenAIService} from '../services/openAI.service.js'

export async function structureMail(mail: Email): Promise<Record<string, string>> {
  const dealSchema = {
    gigs: [
      {
        city: 'La ville dans laquelle se passera la representation demandee',
        date: 'la date du spectacle demandé',
        show: "le nom du spectacle demandé, choisis entre La Danse des Sorcières, L'Art de Rater le Train, La Risotto Experience, Le Voyage en Europe",
      },
    ],
    organization: {
      address: "L'addresse de l'organisation",
      facebook: "La page Facebook de l'organisation",
      name: "Le nom de l'entite pour laquelle travaille l'expediteur",
      type: "Le type d'organisation. Choisis entre Médiathèque, Boite de prod, Ecole, Théâtre, Office du Tourisme, Mairie, Association, Communauté de Communes, MJC, Université",
      website: "Le site web de l'organisation",
    },
    person: {
      email: "L'email de l'expediteur",
      name: "Le nom de l'expediteur",
      phone: "Le numero de telephone de l'expediteur",
    },
  }

  const instructions = `Tu es un excellent assistant commercial . Ton travail est d'extraire de l'information commerciale des mails que l'on te soumet. Ces informations permettront le remplissage de fiches clients dans un CRM`

  const prompt = `${instructions}
Tu as reçu ce mail

# BEGIN EMAIL
${mail.serialize()}
# END EMAIL

Extrais les informations suivantes dans le format JSON, comme ceci

# BEGIN JSON
${JSON.stringify(dealSchema, null, 2)}
# END JSON
  `

  const LLM = new OpenAIService()

  const completion = await LLM.complete(prompt, {maxTokens: 2048})

  try {
    return JSON.parse(completion)
  } catch {
    throw new Error(`Unable to JSON parse the LLM completion: ${completion}`)
  }
}
