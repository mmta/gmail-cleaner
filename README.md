# Gmail Cleaner

[![](https://github.com/mmta/gmail-cleaner/workflows/CI/badge.svg)](https://github.com/mmta/gmail-cleaner/workflows/CI/badge.svg) [![codecov](https://codecov.io/gh/mmta/gmail-cleaner/branch/master/graph/badge.svg?token=Ht6kHM61R9)](https://codecov.io/gh/mmta/gmail-cleaner) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![](https://david-dm.org/mmta/gmail-cleaner.svg)](https://david-dm.org/mmta/gmail-cleaner.svg) [![GitHub license](https://img.shields.io/github/license/mmta/gmail-cleaner.svg)](https://github.com/mmta/gmail-cleaner/blob/master/LICENSE)

Quickly peek, and permanently delete emails in Gmail that match specific label and search query.

This was created to delete over 120k messages that GMail web interface and IMAP weren't able to handle (they just timed out). In addition, I also needed a project to test a bunch of CI tools.

## Install

Download the zipped-binary for your OS from the [release page](https://github.com/mmta/gmail-cleaner/releases) and extract it.

Alternatively, if you have node installed, then just clone this repository using `git`, then do `npm install`. After that you can follow the examples below, replacing all reference to `gmail_cleaner-linux` with `node gmail_cleaner.js`.

## Examples

- Delete up to 15k emails in `Categories/Updates`label:

  ```shell
  $ ./gmail_cleaner-linux delete -l "CATEGORY_UPDATES" -n 15000
  Found 10381 matching emails in CATEGORY_UPDATES. Deleting them ...
  1000 messages deleted.
  1000 messages deleted.
  1000 messages deleted.
  1000 messages deleted.
  1000 messages deleted.
  1000 messages deleted.
  1000 messages deleted.
  1000 messages deleted.
  1000 messages deleted.
  1000 messages deleted.
  381 messages deleted.
  ```

- Verify the result using `emails` command:

  ```shell
  $ ./gmail_cleaner-linux emails -l "CATEGORY_UPDATES"
  No emails found.
  ```

- Using [Gmail query](https://support.google.com/mail/answer/7190?hl=en) to target specific emails, and reviewing samples before deleting them:

  ```shell
  $ ./gmail_cleaner-linux delete -s -l "Corp" -q "subject:Birthday" --dry-run
  Found 47 matching emails in Corp. Deleting them ...
  dry-run is active, skip deleting emails.

  $ ./gmail_cleaner-linux emails -s -l "Corp" -q "subject:Birthday" -n 3 --no-snippet
  retrieving headers for 3 emails ..

  Matching email messages:

  Date                            From                             Subject
  Thu, 7 Nov 2019 22:00:14 +0000  Corp App <corp.app@company.com>  [Employee] Happy Birthday To Foo
  Wed, 6 Nov 2019 22:06:52 +0000  Corp App <corp.app@company.com>  [Employee] Happy Birthday To Bar
  Tue, 5 Nov 2019 22:00:13 +0000  Corp App <corp.app@company.com>  [Employee] Happy Birthday To 42

  $ ./gmail_cleaner-linux delete -l "Corp" -q "subject:Birthday"
  Found 47 matching emails in Corp. Deleting them ...
  47 messages deleted.

  $ ./gmail_cleaner-linux emails -s -l "Corp" -q "subject:Birthday"
  no emails found.
  ```

## More on How to Use

Use `--help` or `-h` to see usage information.

```shell
$ ./gmail_cleaner-linux -h
Usage: gmail_cleaner-linux <command> [options]

Commands:
  gmail_cleaner-linux labels  List all available Gmail labels
  gmail_cleaner-linux emails  List emails matching specific label and query
  gmail_cleaner-linux delete  Delete emails matching specific label and query

Options:
  --version              Show version number                           [boolean]
  --sec-warning-off, -s  Don't display security warning                [boolean]
  --verbose, -v          Show more verbose information                 [boolean]
  --help, -h             Show help                                     [boolean]

Examples:
  gmail_cleaner-linux delete -l "SPAM"      Delete all emails labeled "SPAM"
  gmail_cleaner-linux delete -l "INBOX" -q  Delete emails in "INBOX" that has
  "subject:spam" --unsafe                   'spam' in subject
```

You can also see more info on a specific command like so:

```shell
$ ./gmail_cleaner-linux delete -h
$ ./gmail_cleaner-linux emails -h
```

As part of the authentication process, this program by default will temporarily open port 31338/tcp on localhost. You can use other port by specifying environment variable `GMAIL_CLEANER_PORT`, for example:

```shell
$ GMAIL_CLEANER_PORT=1337 ./gmail_cleaner.js labels
```

## Authorisation and Security

This program uses [Gmail API](https://developers.google.com/gmail/api) so you must authorise it first before it can access your Gmail account.

On the first time access to Gmail, this program will fail to locate `gmail_token.json` file, and will fall back to display an authorisation URL. Open it in a browser, and follow the steps to authorise the program to access your account.

After that first run, you should handle `gmail_token.json` file with care: anyone who has access to it will also have access to your Gmail account. Unless it is turned off with the `-s` switch, Gmail Cleaner will display the following security warning on every run.

```
** SECURITY WARNING **

Do the following when you no longer need to use this program in the near future.
- Remove the app access to your account from https://myaccount.google.com/u/2/permissions
- Remove gmail_token.json file. Anyone who has access to it will have full control over your Gmail account.
```

Note that removing the app access from https://myaccount.google.com/u/2/permissions merely invalidates `gmail_token.json` so it can no longer be used to access your Gmail account. Gmail Cleaner "app" doesn't really have or need a server/cloud-side component that stores content of `gmail_token.json` or any information at all about your account. If that's not good enough, then you can always create your own "app" using the following instruction.

### Using your own "App"

- Create a project in [Google Developer Console and enable Gmail API on it](https://console.developers.google.com/apis/library/gmail.googleapis.com).
- Setup an [oAuth consent screen](https://console.developers.google.com/apis/credentials/consent) on that project. Add `https://mail.google.com/` to the list of scopes to authorise (that scope is needed by [batchDelete API](https://developers.google.com/gmail/api/v1/reference/users/messages/batchDelete) used by `gmail_cleaner`).
- Create an OAuth 2.0 client ID from the project's [Credentials](https://console.developers.google.com/apis/credentials) page, and download it to replace `./lib/client_id.json` file.
- Remove existing `gmail_token.json` file.

After that, the next time you run the program, it will prompt to authorise your own app instead of the default one.
