const fs = require('fs')
const { google } = require('googleapis')
const http = require('http')
const { createHttpTerminator } = require('http-terminator')
const url = require('url')
const { debugPrint, writeJsonToFile } = require('./utils')
const {
  TOKEN_PATH,
  SCOPES,
  CREDENTIAL,
  DEFAULT_SERVER_PORT
} = require('./constants')

const port =
  process.env.GMAIL_CLEANER_PORT !== undefined
    ? process.env.GMAIL_CLEANER_PORT
    : DEFAULT_SERVER_PORT

const ensureAuth = async () => {
  const auth = new google.auth.OAuth2(
    CREDENTIAL.installed.client_id,
    CREDENTIAL.installed.client_secret,
    `http://localhost:${port}`
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
  return new Promise((resolve, reject) => {
    const authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    })
    console.log(
      `Please authorise this program to access your Gmail by visiting this url:\n\n${authUrl}\n`
    )

    const handler = async (req, resp) => {
      const url = new URL(req.url, `http://${req.headers.host}/`)
      const urlParams = new URLSearchParams(url.search)
      const code = urlParams.get('code')
      if (code) {
        resp.end('You can close this now!')
        resolve(code)
      } else {
        reject(`Cannot obtain code from browser`)
      }
      await httpTerminator.terminate()
    }

    const server = http.createServer(handler)
    const httpTerminator = createHttpTerminator({
      server
    })
    server.on('error', e => {
      reject(e)
    })
    console.log(`server will be listening on port ${port}`)
    server.listen(port, '127.0.0.1', () => {
      console.log(
        `\nTemporary server is listening on port ${port}. This will auto-close once you've completed the authentication flow.`
      )
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
