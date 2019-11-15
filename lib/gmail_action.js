const { google } = require('googleapis')
const { table, createStream, getBorderCharacters } = require('table')
const { debugPrint, chunk } = require('./utils')
const {
  GMAIL_ACTION_ERR_LABEL,
  PROTECTED_LABEL_IDS,
  GMAIL_API_MAX_DELETE,
  PROTECTED_LABEL_NOTICE
} = require('./constants')

const getMessages = async (auth, labelId, limit, query, pageToken = '') => {
  const result = await getPageOfMessages(auth, labelId, limit, query, pageToken)
  if (result.total === 0) {
    return []
  }
  const nextLimit = limit - result.messages.length
  if (result.nextPageToken && nextLimit > 0) {
    const msgs = await getMessages(
      auth,
      labelId,
      nextLimit,
      query,
      result.nextPageToken
    )
    return result.messages.concat(msgs)
  } else {
    return result.messages
  }
}

const getPageOfMessages = async (auth, labelId, limit, query, pageToken) => {
  const gmail = google.gmail({ version: 'v1', auth })
  const gmailQuery = {
    userId: 'me',
    labelIds: [labelId],
    maxResults: limit,
    q: query
  }
  if (pageToken !== '') {
    gmailQuery.pageToken = pageToken
  }
  const res = await gmail.users.messages.list(gmailQuery)
  if (res.status !== 200) {
    debugPrint(res)
  }
  return {
    total: res.data.resultSizeEstimate,
    messages: res.data.messages,
    nextPageToken: res.data.nextPageToken
  }
}

const listEmails = async (
  auth,
  labelName,
  limit = 5,
  query,
  headers = ['Date', 'From', 'Subject'],
  snippet = true
) => {
  const labelId = await getLabelID(auth, labelName)
  let messages
  const failedMsg = []
  try {
    messages = await getMessages(auth, labelId, limit, query)
    if (messages.length === 0) {
      console.log('No emails found.')
      return 1
    }
    if (snippet) {
      headers.push('Snippet')
    }
    const config = {
      border: getBorderCharacters('void'),
      columnCount: headers.length,
      columnDefault: {
        width: Math.round(
          ((process.stdout.columns || 120) - 5) / headers.length
        ),
        paddingLeft: 0,
        paddingRight: 1
      }
    }
    const stream = createStream(config)
    console.log('retrieving data for ' + messages.length + ' emails ..\n')
    stream.write(headers)

    const gmail = google.gmail({ version: 'v1', auth })
    for (const msg of messages) {
      const res = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: headers
      })
      const email = { id: msg.id }
      const row = []
      res.data.payload.headers.forEach(h => {
        email[h.name] = h.value
      })
      email.Snippet = res.data.snippet
      headers.forEach(h => {
        row.push(email[h])
      })

      try {
        stream.write(row)
      } catch (err) {
        // skip any formatting error due to funky strings in message like 😃
        debugPrint(
          `\nskipping message ID ${msg.id} due to stream write error: ${
            err.message
          }, the snippet was: ${email.Snippet}`
        )
        failedMsg.push(msg.id)
      }
    }
    if (failedMsg.length !== 0) {
      console.log(
        `\n${failedMsg.length} message(s) wasn't shown due to formatting error.`
      )
    }
  } catch (err) {
    handleGmailError(err)
  }
  return 0
}

const handleGmailError = err => {
  debugPrint(err)
  throw new Error(`${GMAIL_ACTION_ERR_LABEL}: ${err.message}`)
}

const deleteEmails = async (auth, labelName, limit, query, dryrun, unsafe) => {
  const labelId = await getLabelID(auth, labelName)

  if (!unsafe && PROTECTED_LABEL_IDS.includes(labelId)) {
    throw new Error(PROTECTED_LABEL_NOTICE)
  }

  const gmail = google.gmail({ version: 'v1', auth })
  let messages
  try {
    messages = await getMessages(auth, labelId, limit, query)
    if (messages.length === 0) {
      console.log('No message found.')
      return 1
    }
    const cnt = messages.length
    const msgIds = []
    messages.forEach(message => {
      msgIds.push(message.id)
      debugPrint(`Message ID to be deleted: ${message.id}`)
    })
    console.log(
      `Found ${cnt} matching emails in ${labelName}. Deleting them ...`
    )
    if (dryrun) {
      console.log('dry-run is active, skip deleting emails.')
      return 0
    }
    const msgIdsColl = chunk(msgIds, GMAIL_API_MAX_DELETE)
    for (const msgIds of msgIdsColl) {
      const count = msgIds.length
      await gmail.users.messages.batchDelete({
        userId: 'me',
        resource: {
          ids: msgIds
        }
      })
      console.log(count + ' messages deleted.')
    }
    return 0
  } catch (err) {
    handleGmailError(err)
  }
}

const getLabels = async auth => {
  const gmail = google.gmail({ version: 'v1', auth })
  const res = await gmail.users.labels.list({
    userId: 'me'
  })
  return res.data.labels
}

const getLabelID = async (auth, name) => {
  try {
    const labels = await getLabels(auth)
    if (labels.length !== 0) {
      for (const label of labels) {
        if (label.name === name) {
          return label.id
        }
      }
    }
    throw new Error('cannot get the label ID for ' + name)
  } catch (err) {
    handleGmailError(err)
  }
}

const listLabels = async auth => {
  try {
    const labels = await getLabels(auth)
    if (labels.length === 0) {
      console.log('No labels found.')
      return 1
    }
    console.log('\nAvailable Gmail labels:\n')
    const data = []
    data.push(['ID', 'Name'])
    labels.forEach(label => {
      data.push([label.id, label.name])
    })
    console.log(
      table(data, {
        singleLine: true
      })
    )
    console.log(
      'Note: for better UX, delete command expect label name as its -l option, and NOT label ID'
    )
    return 0
  } catch (err) {
    handleGmailError(err)
  }
}

module.exports = {
  listEmails,
  deleteEmails,
  listLabels
}
