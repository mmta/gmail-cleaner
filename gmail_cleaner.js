const { setDebug } = require('./lib/utils')
const { ensureAuth } = require('./lib/gmail_auth')
const { listLabels, listEmails, deleteEmails } = require('./lib/gmail_action')
const {
  GMAIL_ACTION_ERR_LABEL,
  PROTECTED_LABEL_IDS,
  TOKEN_PATH
} = require('./lib/constants')

const SECURITY_WARNING = `
** SECURITY WARNING **

Do the following when you no longer need to use this program in the near future.
- Remove the app access to your account from https://myaccount.google.com/u/2/permissions
- Remove ${TOKEN_PATH} file. Anyone who has access to it will have full control over your Gmail account.
`
const actionOpts = {
  label: {
    describe: 'Specify label name to operate on',
    alias: 'l',
    demand: true
  },
  query: {
    alias: 'q',
    describe:
      'Operate only on messages matching this query.\n' +
      'Syntax is similar with Gmail search box. For more info:\n' +
      'https://support.google.com/mail/answer/7190?hl=en'
  }
}

const deleteOpts = Object.assign({}, actionOpts)
deleteOpts.unsafe = {
  describe:
    'Allow operating on the following label IDs: ' + PROTECTED_LABEL_IDS,
  type: 'boolean'
}
deleteOpts['dry-run'] = {
  describe: "Don't actually delete emails",
  type: 'boolean'
}
deleteOpts.max = {
  describe: 'Maximum number of email to operate on',
  alias: 'n',
  default: 1000
}
const emailOpts = Object.assign({}, actionOpts)
emailOpts.headers = {
  describe: 'Specify which email headers to show',
  type: 'array',
  default: ['Date', 'From', 'Subject']
}
emailOpts.snippet = {
  describe: 'Display snippet of the email message',
  type: 'boolean',
  default: true
}
emailOpts.max = {
  describe: 'Maximum number of email to operate on',
  alias: 'n',
  default: 5
}

const argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command('labels', 'List all available Gmail labels')
  .command('emails', 'List emails matching specific label and query', emailOpts)
  .command(
    'delete',
    'Delete emails matching specific label and query',
    deleteOpts
  )
  .version(false)
  .help()
  .option('security-warn', {
    alias: 's',
    type: 'boolean',
    description: 'Display security warning',
    default: true
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Show more verbose information'
  })
  .showHelpOnFail(true)
  .example('$0 delete -l "SPAM"', 'Delete all emails labeled "SPAM"')
  .example(
    '$0 delete -l "INBOX" -q "subject:spam" --unsafe',
    'Delete emails in "INBOX" that has \'spam\' in subject'
  )
  .help('help')
  .alias('help', 'h')
  .demandCommand()
  .recommendCommands()
  .strict()
  .number('total')
  .check(argv => {
    if (argv.total < 1) {
      throw new Error('total must be 1 or greater')
    }
    return true
  }).argv

setDebug(argv.verbose)

ensureAuth()
  .then(auth => {
    switch (argv._[0]) {
      case 'labels':
        return listLabels(auth)
      case 'emails':
        return listEmails(
          auth,
          argv.label,
          argv.max,
          argv.query,
          argv.headers,
          argv.snippet
        )
      case 'delete':
        return deleteEmails(
          auth,
          argv.label,
          argv.max,
          argv.query,
          argv['dry-run'],
          argv.unsafe
        )
      default:
        throw new Error('Unsupported command: ' + argv._[0])
    }
  })
  .catch(err => {
    console.log(err.message)
    if (err.message.includes(GMAIL_ACTION_ERR_LABEL)) {
      console.log(
        `If this is related Gmail access authorisation, remove ${TOKEN_PATH} file then try again.`
      )
    }
    return 1
  })
  .then(ret => {
    if (argv['security-warn']) {
      console.log(SECURITY_WARNING)
    }
    process.exit(ret)
  })
