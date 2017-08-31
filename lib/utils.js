'use strict';

var ENCODING = 'utf-8';

var accepts = require('accepts');
var parseUrl = require('parseurl');
var path = require('path');
var fs = require('fs');
var loashTemplate = require('lodash.template');
var mimeLookup = require('mime-types').lookup;
var httpError = require('http-errors');

var slice = Array.prototype.slice;
var toArray = Array.from || function(obj) {
  return slice.call(obj);
};
var toString = Object.prototype.toString;

function noop() {}

function type(obj) {
  return toString.call(obj).slice(8, -1);
}

function maybeFile(file) {
  try {
    return fs.readFileSync(path.resolve(file), ENCODING);
  } catch(err) {
    return '';
  }
}

function render(template) {
  var templateType = type(template);
  if (templateType === 'Function') {
    return template;
  } else if (templateType === 'String') {
    return loashTemplate(maybeFile(template) || template, {imports: _});
  }

  return noop;
}

function responser(mime, render) {
  return function(req, res, data) {
    sendResponse(res, mime, render(data));
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
  res.setHeader('Content-Type', type + '; charset=' + ENCODING)
  res.setHeader('Content-Length', Buffer.byteLength(body, ENCODING))

  // body
  res.end(body, ENCODING)
}

function directoryFirst(a, b) {
  if (!b.stat || !a.stat) {
    return 0;
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


var _ = module.exports = {
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
}