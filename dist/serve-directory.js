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

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i]
      descriptor.enumerable = descriptor.enumerable || false
      descriptor.configurable = true
      if ('value' in descriptor) descriptor.writable = true
      Object.defineProperty(target, descriptor.key, descriptor)
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps)
    if (staticProps) defineProperties(Constructor, staticProps)
    return Constructor
  }
})()

var _utils = require('./utils.js')

var _utils2 = _interopRequireDefault(_utils)

var _connection = require('./connection.js')

var _connection2 = _interopRequireDefault(_connection)

var _defaultOptions = require('./default-options.js')

var _defaultOptions2 = _interopRequireDefault(_defaultOptions)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function')
  }
}

function responser(mime, render) {
  return function(req, res, data) {
    var body = render(data)

    // security header for content sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // standard headers
    res.setHeader('Content-Type', mime + '; charset=' + _utils2.default.CHARSET)
    res.setHeader(
      'Content-Length',
      Buffer.byteLength(body, _utils2.default.CHARSET)
    )

    // body
    res.end(body, _utils2.default.CHARSET)
  }
}

var ServeDirectory = (function() {
  function ServeDirectory(root, options) {
    _classCallCheck(this, ServeDirectory)

    // root required
    // resolve root to absolute and normalize
    try {
      root = _utils2.default.path.normalize(
        _utils2.default.path.resolve(root) + _utils2.default.path.sep
      )
      _utils2.default.fs.statSync(root)
    } catch (err) {
      throw err
    }

    this.root = root
    this.responser = {}
    this.options = {
      hidden: _defaultOptions2.default.hidden,
      relative: _defaultOptions2.default.relative
    }
    this.imports = Object.assign({}, _utils2.default)

    this.config(_defaultOptions2.default)

    if (options) {
      this.config(options)
    }
  }

  _createClass(ServeDirectory, [
    {
      key: 'config',
      value: function config(options) {
        var sd = this

        if (options.hidden === true || options.hidden === false) {
          sd.options.hidden = options.hidden
        }

        if (options.relative === true || options.relative === false) {
          sd.options.relative = options.relative
        }

        if (options.imports) {
          Object.assign(sd.imports, options.imports)
        }

        if (options.process) {
          options.process.filter(Boolean).forEach(function(processor) {
            processor.accept
              .split(',')
              .map(_utils2.default.trim)
              .filter(Boolean)
              .forEach(function(type) {
                if (processor.render) {
                  sd.responser[type] = responser(
                    type,
                    _utils2.default.template(processor.render, {
                      imports: sd.imports
                    })
                  )
                } else {
                  delete sd.responser[type]
                }
              })
          })
        }
      }
    },
    {
      key: 'middleware',
      value: function middleware(req, res, next) {
        try {
          return new _connection2.default(this, req, res, next).response()
        } catch (err) {
          next(err)
        }
      }
    }
  ])

  return ServeDirectory
})()

exports.default = ServeDirectory
module.exports = exports['default']
