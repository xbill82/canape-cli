import {Client} from '@notionhq/client'

import {Person} from '../domain/person.js'
import {
  createMailchimpContact,
  findPersonsWithEmptyMailchimpProfiles,
  searchContactsByMail,
  updatePerson,
} from '../repositories/person.repository.js'
import {ThrottleFunction} from '../services/notion.backend.js'

const baseMailchimpContactUrl = 'https://us19.admin.mailchimp.com/audience/contact-profile?contact_id='

export async function syncMailchimpProfiles(
  backend: Client,
  throttle: ThrottleFunction,
): Promise<{created: Person[]; updated: Person[]}> {
  const peopleWithEmptyProfiles = await findPersonsWithEmptyMailchimpProfiles(backend, throttle)
  console.log(
    'People with empty profiles:',
    peopleWithEmptyProfiles.map((person) => person.name),
  )
  const peopleWithMissingContact: Person[] = []

  for (const person of peopleWithEmptyProfiles) {
    const mailchimpContact = await searchContactsByMail(person.email)

    if (mailchimpContact) {
      console.log(`Found Mailchimp contact for ${person.name} with ID ${mailchimpContact.contact_id}`)
      person.mailchimpProfile = `${baseMailchimpContactUrl}${mailchimpContact.contact_id}`
    } else {
      console.log(`No Mailchimp contact found for ${person.name}. Creating...`)

      peopleWithMissingContact.push(person)
      const id = await createMailchimpContact(person)

      if (id) {
        person.mailchimpProfile = `${baseMailchimpContactUrl}${id}`
        await updatePerson(backend, throttle, person)
      }
    }

    try {
      await updatePerson(backend, throttle, person)
      console.log(`Updated Mailchimp profile for ${person.name}`)
    } catch (error) {
      console.error(`Failed to update Mailchimp profile for ${person.name}:`, error)
    }
  }

  return {created: peopleWithMissingContact, updated: peopleWithEmptyProfiles}
}
