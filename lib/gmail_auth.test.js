const tmpExistingToken = require('./test_helpers').createTempToken()
const tmpNewToken = require('tmp').fileSync()
const axios = require('axios').default

const mockConstants = {
  SCOPES: 'https://mail.google.com/',
  TOKEN_PATH: tmpExistingToken.name,
  DEFAULT_SERVER_PORT: 31338
}

afterAll(() => {
  tmpExistingToken.removeCallback()
  tmpNewToken.removeCallback()
})

describe('ensureAuth', () => {
  jest.isolateModules(() => {
    mockConstants.CREDENTIAL = ''
    jest.mock('./constants', () => mockConstants)
    const { ensureAuth } = require('./gmail_auth')

    test('failure due to bad client_id.json', async () => {
      await expect(ensureAuth()).rejects.toThrow(/'client_id'/)
    })
  })

  mockConstants.CREDENTIAL = require('./client_id.json')

  jest.isolateModules(() => {
    jest.mock('./constants', () => mockConstants)
    const { ensureAuth } = require('./gmail_auth')

    test('success loading auth from existing file', async () => {
      const authObj = await ensureAuth()
      expect(authObj.credentials.access_token).toBe('foo')
    })
  })

  mockConstants.TOKEN_PATH = tmpNewToken.name
  jest.mock('googleapis', () => {
    return require('./test_helpers').googleAuthOAuth2()
  })

  test('missing code', async () => {
    jest.resetModules()
    mockConstants.DEFAULT_SERVER_PORT = 8887
    const port = mockConstants.DEFAULT_SERVER_PORT
    jest.mock('./constants', () => mockConstants)

    const { ensureAuth } = require('./gmail_auth')
    const emptyCode = async () => {
      await Promise.all([ensureAuth(), axios.get(`http://localhost:${port}/?`)])
    }
    await expect(emptyCode()).rejects.toThrow(/Cannot obtain code from browser/)
  })

  jest.isolateModules(() => {
    test('wrong code and port already in use', async () => {
      jest.resetModules()
      mockConstants.DEFAULT_SERVER_PORT = 8888
      const port = mockConstants.DEFAULT_SERVER_PORT
      jest.mock('./constants', () => mockConstants)
      const { ensureAuth } = require('./gmail_auth')

      const authenticate = async () => {
        await Promise.all([
          ensureAuth(),
          axios.get(`http://localhost:${port}/?code=WrongCode`)
        ])
      }

      await expect(authenticate()).rejects.toThrow(/mocked invalid_grant/)
      await expect(authenticate()).rejects.toThrow(/EADDRINUSE:/)
    })

    test('successful authorisation', async () => {
      jest.resetModules()
      mockConstants.DEFAULT_SERVER_PORT = 8889
      const port = mockConstants.DEFAULT_SERVER_PORT
      jest.mock('./constants', () => mockConstants)
      const { ensureAuth } = require('./gmail_auth')

      const [authObj] = await Promise.all([
        ensureAuth(),
        axios.get(`http://localhost:${port}/?code=123`)
      ])
      expect(authObj.credentials.access_token).toBe('foo')
    })
  })
})
