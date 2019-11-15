const token = {
  access_token: 'foo',
  refresh_token: 'bar',
  scope: 'https://mail.google.com/',
  token_type: 'Bearer',
  expiry_date: 11111111111
}

const createTempToken = () => {
  const { writeJsonToFile } = require('./utils')
  const tmpTokenFile = require('tmp').fileSync()
  writeJsonToFile(token, tmpTokenFile.name)
  return tmpTokenFile
}

const googleAuthOAuth2 = () => {
  const getTokenFn = code => {
    if (code === '123') {
      return {
        tokens: token
      }
    } else {
      throw new Error('mocked invalid_grant')
    }
  }
  const g = {
    auth: {
      OAuth2: function () {
        this.credentials = {}
        this.getToken = getTokenFn
        this.generateAuthUrl = () => 'http://localhost:1337'
        this.setCredentials = function (cred) {
          this.credentials = cred
        }
      }
    }
  }
  return { google: g }
}

const googleGmail = () => {
  const data = [
    {
      labelIds: ['CATEGORY_FORUM'],
      resultSizeEstimate: 0,
      status: 201
    },
    {
      labelIds: ['INBOX', 'SPAM'],
      resultSizeEstimate: 1,
      pageToken: 1,
      nextPageToken: 2,
      status: 200,
      messages: [
        {
          id: '1fkkasfj12',
          payload: {
            headers: [
              {
                name: 'From',
                value: 'foo'
              },
              {
                name: 'Subject',
                value: 'bar'
              },
              {
                name: 'Date',
                value: '10-10-2019'
              }
            ]
          }
        }
      ]
    },
    {
      labelIds: ['SENT'],
      resultSizeEstimate: 2,
      pageToken: 2,
      status: 200,
      nextPageToken: undefined,
      messages: [
        {
          id: '1fkkasfj12sfasf',
          payload: {
            headers: [
              {
                name: 'From',
                value: 'foo'
              },
              {
                name: 'Subject',
                value: 'bar'
              },
              {
                name: 'Date',
                value: '10-10-2019'
              }
            ]
          }
        },
        {
          id: 'klagle2t3',
          snippet:
            'Hola 😃 if this is long enough you will trigger error due to a bug in table',
          payload: {
            headers: [
              {
                name: 'From',
                value: 'foo2'
              },
              {
                name: 'Subject',
                value: 'subj'
              },
              {
                name: 'Date',
                value: '11-11-2019'
              }
            ]
          }
        }
      ]
    }
  ]

  const messageList = async q => {
    return new Promise((resolve, reject) => {
      // simulate gmail error
      if (q.q === 'simulate_error') {
        return reject(new Error('simulated Gmail error'))
      }
      for (const d of data) {
        if (d.labelIds.includes(q.labelIds[0])) {
          return resolve({
            data: d,
            status: d.status
          })
        }
      }
    })
  }

  const messageGet = async q => {
    return new Promise(resolve => {
      for (const d of data) {
        if (typeof d.messages === 'undefined') {
          continue
        }
        for (const msg of d.messages) {
          if (msg.id !== q.id) {
            continue
          }
          return resolve({
            data: msg
          })
        }
      }
    })
  }

  const labelList = async auth => {
    const authorizedData = {
      labels: [
        {
          name: 'INBOX',
          id: 'INBOX'
        },
        {
          name: 'SENT',
          id: 'SENT'
        },
        {
          name: 'SPAM',
          id: 'SPAM'
        },
        {
          name: 'CATEGORY_FORUM',
          id: 'CATEGORY_FORUM'
        }
      ]
    }
    const unauthorizedData = {
      labels: []
    }

    switch (auth) {
      case '1234':
        return {
          data: unauthorizedData
        }
      case '0000':
        throw new Error('simulated Gmail error')
      case '0001':
        return {}
      default:
        return {
          data: authorizedData
        }
    }
  }

  const g = {
    gmail: function (obj) {
      this.users = {
        messages: {
          list: messageList,
          get: messageGet,
          batchDelete: async () => null
        },
        labels: {
          list: async function () {
            return labelList(obj.auth)
          }
        }
      }
      return this
    }
  }
  return { google: g }
}

module.exports = { googleAuthOAuth2, googleGmail, createTempToken }
