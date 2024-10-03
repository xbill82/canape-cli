import * as imaps from 'imap-simple'

import config from './config.js'

export async function openInbox(folderName: string): Promise<imaps.ImapSimple> {
  const imapConfig = {
    authTimeout: 3000,
    host: config.imapHost,
    password: config.imapPassword,
    port: Number.parseInt(config.imapPort, 10) || 993,
    tls: Boolean(config.imapTLS || true),
    user: config.imapUser,
  }

  const connection = await imaps.connect({imap: imapConfig})
  await connection.openBox(folderName)

  return connection
}
