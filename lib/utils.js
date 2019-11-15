const fs = require('fs')
var DEBUG = false

const setDebug = dbg => {
  if (dbg === true || dbg === false) {
    DEBUG = dbg
  }
}

const getDebug = () => {
  return DEBUG
}

const debugPrint = message => {
  if (DEBUG) {
    console.debug('\x1b[36m%s\x1b[0m', message)
  }
}

const chunk = (arr, chunkSize) => {
  var R = []
  for (var i = 0, len = arr.length; i < len; i += chunkSize) {
    R.push(arr.slice(i, i + chunkSize))
  }
  return R
}

const writeJsonToFile = (object, file) => {
  try {
    if (file) {
      fs.writeFileSync(file, JSON.stringify(object))
      return true
    }
  } catch (err) {
    debugPrint(err)
  }
  return false
}

module.exports = { setDebug, getDebug, debugPrint, chunk, writeJsonToFile }
