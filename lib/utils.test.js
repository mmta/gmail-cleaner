const {
  setDebug,
  getDebug,
  debugPrint,
  chunk,
  writeJsonToFile
} = require('./utils')
const debug = jest.spyOn(global.console, 'debug')
const tmp = require('tmp')

describe('debug printing', () => {
  test('disabling debug', () => {
    setDebug(false)
    expect(getDebug()).toBe(false)
  })
  test('printing text when debug is disabled', () => {
    debugPrint('test')
    expect(debug).not.toHaveBeenCalled()
  })
  test('enabling debug', () => {
    setDebug(true)
    expect(getDebug()).toBe(true)
  })
  test('wrong flag for debug should keep prev state', () => {
    setDebug(null)
    expect(getDebug()).toBe(true)
  })
  test('printing text when debug is enabled', () => {
    debugPrint('test')
    expect(debug).toHaveBeenCalledWith('\x1b[36m%s\x1b[0m', 'test')
  })
})

describe('array chunking', () => {
  test.each([
    [[1, 2, 3], 1, [[1], [2], [3]]],
    [[1, 2, 3], 2, [[1, 2], [3]]],
    [[1, 2, 3], 3, [[1, 2, 3]]],
    [[1, 2, 3], 4, [[1, 2, 3]]]
  ])('array splitting %o into chunks of %d elements', (a, b, expected) => {
    expect(chunk(a, b)).toStrictEqual(expected)
  })
})

describe('writing JS object as JSON to file', () => {
  test('error writing to file - non writeable destination', () => {
    setDebug(false)
    expect(writeJsonToFile('foo', '.')).toBe(false)
  })
  test('error writing to file - undefined destination', () => {
    setDebug(false)
    expect(writeJsonToFile('foo')).toBe(false)
  })
  test('successful write to file', () => {
    expect(writeJsonToFile('foo', tmp.fileSync().name)).toBe(true)
  })
})
