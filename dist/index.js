/*
 * serve-index
 * Copyright(c) 2011 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 *
 * serve-directory
 * Copyright(c) 2017- fisker Cheung
 * MIT Licensed
 */
'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = serveDirectory

var _serveDirectory = require('./serve-directory.js')

var _serveDirectory2 = _interopRequireDefault(_serveDirectory)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

function serveDirectory(root, options) {
  var sd = new _serveDirectory2.default(root, options)
  return sd.middleware.bind(sd)
}
module.exports = exports['default']
