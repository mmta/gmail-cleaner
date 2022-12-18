const mockConstants = {
  GMAIL_API_MAX_DELETE: 1,
  SCOPES: 'https://mail.google.com/',
  PROTECTED_LABEL_IDS: ['INBOX', 'SENT', 'IMPORTANT', 'STARRED'],
  GMAIL_ACTION_ERR_LABEL: 'Error occurred while accessing gmail'
}

mockConstants.PROTECTED_LABEL_NOTICE =
  'labelId must be defined and cannot be ' +
  mockConstants.PROTECTED_LABEL_IDS +
  '. Use unsafe flag to override this restriction.'

describe('gmailActions', () => {
  jest.isolateModules(() => {
    jest.mock('./constants', () => mockConstants)
    const {
      GMAIL_ACTION_ERR_LABEL,
      PROTECTED_LABEL_NOTICE
    } = require('./constants')

    jest.mock('googleapis', () => {
      return require('./test_helpers').googleGmail()
    })
    const { listEmails, listLabels, deleteEmails } = require('./gmail_action')
    test('list labels, unauthorised', async () => {
      expect(await listLabels('1234')).toBe(1)
    })
    test('list labels, simulated error from gmail 1', async () => {
      await expect(listLabels('0000')).rejects.toThrowError(
        `${GMAIL_ACTION_ERR_LABEL}: simulated Gmail error`
      )
    })
    test('list labels, simulated error from gmail 2', async () => {
      await expect(listLabels('0001')).rejects.toThrowError(
        `${GMAIL_ACTION_ERR_LABEL}: Cannot read properties of undefined (reading 'labels')`
      )
    })
    test('list labels, authorized', async () => {
      expect(await listLabels('ignored')).toBe(0)
    })
    test('list emails, unauthorised', async () => {
      await expect(listEmails('1234', 'INBOX')).rejects.toThrowError(
        `${GMAIL_ACTION_ERR_LABEL}: cannot get the label ID for INBOX`
      )
    })
    test('list emails, simulate error from gmail', async () => {
      await expect(
        listEmails(null, 'INBOX', 3, 'simulate_error')
      ).rejects.toThrowError(`${GMAIL_ACTION_ERR_LABEL}: simulated Gmail error`)
    })
    test('list emails, non-existent label', async () => {
      await expect(listEmails(null, 'WORK', 3)).rejects.toThrowError(
        `${GMAIL_ACTION_ERR_LABEL}: cannot get the label ID for WORK`
      )
    })
    test('list emails, none found', async () => {
      expect(await listEmails(null, 'CATEGORY_FORUM', 3)).toBe(1)
    })
    test('list emails, successful with snippet', async () => {
      expect(
        await listEmails(null, 'SENT', 3, undefined, undefined, true)
      ).toBe(0)
    })
    test('list emails, successful without snippet', async () => {
      expect(
        await listEmails(null, 'SENT', 3, undefined, undefined, false)
      ).toBe(0)
    })
    test('delete emails, simulate error from gmail', async () => {
      await expect(
        deleteEmails(null, 'SPAM', 3, 'simulate_error')
      ).rejects.toThrowError(`${GMAIL_ACTION_ERR_LABEL}: simulated Gmail error`)
    })
    test('delete emails, dry-run', async () => {
      expect(await deleteEmails(null, 'SPAM', 3, null, true)).toBe(0)
    })
    test('delete emails, none found', async () => {
      expect(await deleteEmails(null, 'CATEGORY_FORUM', 3)).toBe(1)
    })
    test('delete emails, protected label', async () => {
      await expect(deleteEmails(null, 'INBOX', 3)).rejects.toThrowError(
        PROTECTED_LABEL_NOTICE
      )
    })
    test('delete emails, successful', async () => {
      expect(await deleteEmails(null, 'SPAM', 3)).toBe(0)
    })
  })
})
