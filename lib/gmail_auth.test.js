const tmpExistingToken = require('./test_helpers').createTempToken()
const tmpNewToken = require('tmp').fileSync()
const bddStdin = require('bdd-stdin')

const mockConstants = {
  SCOPES: 'https://mail.google.com/',
  TOKEN_PATH: tmpExistingToken.name
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
        "Cannot read property 'client_id' of undefined"
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
  })

  jest.isolateModules(() => {
    mockConstants.TOKEN_PATH = '.'
    jest.mock('./constants', () => mockConstants)
    const { ensureAuth } = require('./gmail_auth')
    test('error due to invalid supplied code', async () => {
      bddStdin('wrong code\n')
      await expect(ensureAuth()).rejects.toThrow(
        'Cannot get new access token: invalid_grant'
      )
    })
  })

  jest.isolateModules(() => {
    mockConstants.TOKEN_PATH = tmpNewToken.name
    jest.mock('./constants', () => mockConstants)
    jest.mock('googleapis', () => {
      return require('./test_helpers').googleAuthOAuth2()
    })
    const { ensureAuth } = require('./gmail_auth')
    test('error due to invalid supplied code, mocked version', async () => {
      bddStdin('0123\n')
      await expect(ensureAuth()).rejects.toThrow(
        'Cannot get new access token: mocked invalid_grant'
      )
    })

    test('successful authorisation', async () => {
      bddStdin('123\n')
      const authObj = await ensureAuth()
      expect(authObj.credentials.access_token).toBe('foo')
    })
  })
})
