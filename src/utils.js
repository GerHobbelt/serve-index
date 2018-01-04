const CHARSET = 'utf-8'
const path = require('path')
const fs = require('fs')
const accepts = require('accepts')
const parseUrl = require('parseurl')
const mimeLookup = require('mime-types').lookup
const httpError = require('http-errors')
const loashTemplate = require('lodash.template')

const toString = Object.prototype.toString
const noop = () => {}

function type(obj) {
  return toString.call(obj).slice(8, -1)
}

function maybeFile(file) {
  try {
    return fs.readFileSync(path.resolve(file), CHARSET)
  } catch (err) {
    return ''
  }
}

function render(template) {
  var templateType = type(template)
  if (templateType === 'Function') {
    return template
  } else if (templateType === 'String') {
    return loashTemplate(maybeFile(template) || template, {imports: _})
  }

  return noop
}

function responser(mime, render) {
  return function(req, res, data) {
    sendResponse(res, mime, render(data))
  }
}

function getResponseType(req, mediaTypes) {
  var accept = accepts(req)
  return accept.type(mediaTypes)
}

var pkgInfo
function pkg() {
  return pkgInfo || (pkgInfo = require('../package.json'))
}

/**
 * Send a response.
 * @private
 */

function sendResponse(res, type, body) {
  // security header for content sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // standard headers
  res.setHeader('Content-Type', type + '; charset=' + CHARSET)
  res.setHeader('Content-Length', Buffer.byteLength(body, CHARSET))

  // body
  res.end(body, CHARSET)
}

function directoryFirst(a, b) {
  if (!b.stat || !a.stat) {
    return 0
  }
  return b.stat.isDirectory() - a.stat.isDirectory()
}

function sortByName(a, b) {
  return a.name.localeCompare(b.name)
}

function notHidden(file) {
  return file.name.slice(0, 1) !== '.'
}

/**
 * Sort function for with directories first.
 */
function fileSort(a, b) {
  return directoryFirst(a, b) || sortByName(a, b)
}

function getFileMimeType(file) {
  return mimeLookup(file) || ''
}

var _ = (module.exports = {
  type: type,
  render: render,
  responser: responser,
  getResponseType: getResponseType,
  parseUrl: parseUrl,
  sendResponse: sendResponse,
  fileSort: fileSort,
  getFileMimeType: getFileMimeType,
  httpError: httpError,
  notHidden: notHidden,
  pkg: pkg
})
