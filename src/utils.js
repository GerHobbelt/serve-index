import pkg from '../package.json'
import loashTemplate from 'lodash.template'
import parseUrl from 'parseurl'
import {lookup as mimeLookup} from 'mime-types'
import debugPackage from 'debug'

const nativeToString = Object.prototype.toString
const nativeTrim = String.prototype.trim
const path = require('path')
const fs = require('fs')
const CHARSET = 'utf-8'
const debug = debugPackage(pkg.name)

const _ = {
  CHARSET: CHARSET,
  path: path,
  fs: fs,
  noop: noop,
  identity: identity,
  type: type,
  directoryFirst: directoryFirst,
  sortBy: sortBy,
  notHidden: notHidden,
  sortFile: sortFile,
  trim: trim,
  template: template,
  mime: mime,
  parseUrl: parseUrl,
  read: read,
  pkg: pkg,
  debug: debug
}

function noop() {}

function identity(x) {
  return x
}

function type(x) {
  return nativeToString.call(x).slice(8, -1)
}

function directoryFirst(a, b) {
  return b.isDirectory() - a.isDirectory()
}

function notHidden(file) {
  return file.name.slice(0, 1) !== '.'
}

function sortBy(key) {
  return function(a, b) {
    return b[key] === a[key] ? 0 : b[key] < a[key] ? 1 : -1
  }
}

function sortFile(a, b) {
  return directoryFirst(a, b) || sortBy('name')(a, b)
}

function trim(s) {
  return nativeTrim.call(s)
}

function read(file) {
  try {
    return fs.readFileSync(path.resolve(file), CHARSET)
  } catch (err) {
    return ''
  }
}

function template(template, options) {
  const templateType = type(template)
  if (templateType === 'Function') {
    return template
  } else if (templateType === 'String') {
    template = read(template) || template
    return loashTemplate(template, options || {imports: _})
  }

  return identity
}

function mime(ext) {
  return mimeLookup(ext) || ''
}

export default _
