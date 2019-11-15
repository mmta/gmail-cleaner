const readline = require('readline')
const fs = require('fs')
const { google } = require('googleapis')
const { debugPrint, writeJsonToFile } = require('./utils')
const { TOKEN_PATH, SCOPES, CREDENTIAL } = require('./constants')

const ensureAuth = async () => {
  const auth = new google.auth.OAuth2(
    CREDENTIAL.installed.client_id,
    CREDENTIAL.installed.client_secret,
    CREDENTIAL.installed.redirect_uris[0]
  )
  try {
    const token = fs.readFileSync(TOKEN_PATH)
    oAuthSetCredentials(auth, JSON.parse(token))
    return auth
  } catch (err) {
    debugPrint(err)
  }
  try {
    const code = await askCode(auth)
    const token = await getAccessToken(auth, code)
    oAuthSetCredentials(auth, token)
    writeJsonToFile(token, TOKEN_PATH)
  } catch (err) {
    debugPrint(err)
    throw new Error('Cannot get new access token: ' + err.message)
  }
  return auth
}

const oAuthSetCredentials = (auth, token) => {
  auth.setCredentials(token)
}

const askCode = async auth => {
  return new Promise(resolve => {
    const authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    })
    console.log(
      'Please authorise this program to access your Gmail by visiting this url:\n',
      authUrl
    )
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question('Enter the code from that page here: ', code => {
      rl.close()
      resolve(code)
    })
  })
}

const getAccessToken = async (auth, code) => {
  try {
    const res = await auth.getToken(code)
    return res.tokens
  } catch (err) {
    debugPrint(err)
    throw err
  }
}

module.exports = { ensureAuth, TOKEN_PATH }
