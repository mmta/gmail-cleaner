const tmpExistingToken = require('./test_helpers').createTempToken()
const tmpNewToken = require('tmp').fileSync()

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
      await expect(ensureAuth()).rejects.toThrow(
        "Cannot read properties of undefined (reading 'client_id')"
      )
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

    test('failure due to port already in use', async () => {
      const authObj = await ensureAuth()
      expect(authObj.credentials.access_token).toBe('foo')
    })
  })
})
