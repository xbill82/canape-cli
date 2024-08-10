import { Client } from "@notionhq/client";
import { Organization } from "../domain/notionOrganization.js";

export const fetchOrganizationById = async (backend: Client, throttle: Function, id: string): Promise<Organization> => {
  console.debug(`🏗️ Fetching Organization with id ${id}...`)

  const response = await throttle(() => backend.pages.retrieve({
      page_id: id
    }))

  // console.debug(JSON.stringify(response, null, 2))

  return new Organization(response);
}