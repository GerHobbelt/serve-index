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

var _utils = require('./utils.js')

var _utils2 = _interopRequireDefault(_utils)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

exports.default = {
  hidden: false,
  relative: true,
  process: [
    {
      accept: 'text/html',
      render: _utils2.default.path.join(__dirname, 'directory.ejs')
    },
    {
      accept: 'text/plain',
      render: function render(data) {
        return (
          data.files
            .map(function(file) {
              return file.name
            })
            .join('\n') + '\n'
        )
      }
    },
    {
      accept: 'application/json',
      render: function render(data) {
        return JSON.stringify(
          data.files.map(function(file) {
            return file.name
          })
        )
      }
    }
  ]
}
module.exports = exports['default']
