const GMAIL_ACTION_ERR_LABEL = 'Error occurred while accessing gmail'
const GMAIL_API_MAX_DELETE = 1000
const DEFAULT_SERVER_PORT = 31338
const SCOPES = ['https://mail.google.com/']
const TOKEN_PATH = 'gmail_token.json'
const CREDENTIAL = require('./client_id.json')
const PROTECTED_LABEL_IDS = ['INBOX', 'SENT', 'IMPORTANT', 'STARRED']
const PROTECTED_LABEL_NOTICE =
  'labelId must be defined and cannot be ' +
  PROTECTED_LABEL_IDS +
  '. Use unsafe flag to override this restriction.'

module.exports = {
  GMAIL_ACTION_ERR_LABEL,
  PROTECTED_LABEL_IDS,
  PROTECTED_LABEL_NOTICE,
  GMAIL_API_MAX_DELETE,
  DEFAULT_SERVER_PORT,
  SCOPES,
  TOKEN_PATH,
  CREDENTIAL
}
