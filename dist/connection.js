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

var _httpErrors = require('http-errors')

var _httpErrors2 = _interopRequireDefault(_httpErrors)

var _accepts = require('accepts')

var _accepts2 = _interopRequireDefault(_accepts)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj}
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function')
  }
}

var Connection = (function() {
  function Connection(sd, req, res, next) {
    _classCallCheck(this, Connection)

    this.sd = sd
    this.req = req
    this.res = res
    this.next = next
    this.url = _utils2.default.parseUrl.original(this.req)
  }

  _createClass(Connection, [
    {
      key: 'getMethod',
      value: function getMethod() {
        var method = this.req.method
        if (method !== 'GET' && method !== 'HEAD') {
          this.res.statusCode = method === 'OPTIONS' ? 200 : 405
          this.res.setHeader('Allow', 'GET, HEAD, OPTIONS')
          this.res.setHeader('Content-Length', '0')
          this.res.end()
          return
        }

        return (this.method = method)
      }
    },
    {
      key: 'getPathname',
      value: function getPathname() {
        var url = this.url
        var pathname = decodeURIComponent(url.pathname)

        if (this.sd.options.hidden && pathname.slice(0, 1) === '.') {
          _utils2.default.debug('hidden folder "%s" deny.', pathname)
          this.next((0, _httpErrors2.default)(403))
          return
        }

        // null byte(s), bad request
        if (pathname.indexOf('\0') !== -1) {
          _utils2.default.debug('null byte(s) in "%s", bad request.', pathname)
          this.next((0, _httpErrors2.default)(400))
          return
        }

        return (this.pathname = pathname)
      }
    },
    {
      key: 'getResponseType',
      value: function getResponseType() {
        var acceptMediaTypes = Object.keys(this.sd.responser)
        var responseType = (0, _accepts2.default)(this.req).type(
          acceptMediaTypes
        )

        if (!responseType) {
          _utils2.default.debug('mime not acceptable "%s".', responseType)
          this.next((0, _httpErrors2.default)(406))
          return
        }

        return (this.responseType = responseType)
      }
    },
    {
      key: 'getResponser',
      value: function getResponser() {
        var responser = this.sd.responser[this.responseType]
        return (this.responser = responser)
      }
    },
    {
      key: 'getPath',
      value: function getPath() {
        // join / normalize from root dir
        var path = _utils2.default.path.normalize(
          _utils2.default.path.join(this.sd.root, this.pathname)
        )

        // malicious path
        if (
          (path + _utils2.default.path.sep).slice(0, this.sd.root.length) !==
          this.sd.root
        ) {
          _utils2.default.debug('malicious path "%s".', this.pathname)
          this.next((0, _httpErrors2.default)(403))
          return
        }

        return (this.path = path)
      }
    },
    {
      key: 'getDirectory',
      value: function getDirectory() {
        _utils2.default.debug('get directory "%s".', this.path)

        var stats = void 0
        try {
          stats = _utils2.default.fs.statSync(this.path)
        } catch (err) {
          if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
            this.next()
            return
          }

          err.status = err.code === 'ENAMETOOLONG' ? 414 : 500
          this.next(err)
          return
        }

        if (!stats.isDirectory()) {
          this.next()
          return
        }

        if (this.pathname.slice(-1) !== '/') {
          _utils2.default.debug('add "/" to "%s".', this.pathname)
          this.res.writeHead(301, {
            Location: this.url.pathname + '/'
          })
          this.res.end()
          return
        }

        stats.path = this.path
        stats.pathname = this.pathname
        stats.url = this.sd.options.relative ? '.' : this.url.pathname

        return (this.directory = stats)
      }
    },
    {
      key: 'getFiles',
      value: function getFiles() {
        _utils2.default.debug('get files "%s"', this.path)

        var path = this.path
        var urlPrefix = this.sd.options.relative ? '' : this.url.pathname
        var files = void 0

        try {
          files = _utils2.default.fs
            .readdirSync(path)
            .map(function(file) {
              var stats = _utils2.default.fs.statSync(
                _utils2.default.path.join(path, file)
              )
              stats.name = file
              stats.ext = _utils2.default.path.extname(file)
              stats.type = _utils2.default.mime(stats.ext)
              stats.url =
                urlPrefix +
                encodeURIComponent(file) +
                (stats.isDirectory() ? '/' : '')
              return stats
            })
            .sort(_utils2.default.sortFile)
        } catch (err) {
          this.next(err)
          return
        }

        if (!this.sd.options.hidden) {
          files = files.filter(_utils2.default.notHidden)
        }

        return (this.files = files)
      }
    },
    {
      key: 'response',
      value: function response() {
        if (
          !this.getMethod() ||
          !this.getPathname() ||
          !this.getResponseType() ||
          !this.getResponser() ||
          !this.getPath() ||
          !this.getDirectory() ||
          !this.getFiles()
        ) {
          return
        }

        try {
          this.responser(this.req, this.res, {
            path: this.path,
            pathname: this.pathname,
            url: this.url,
            method: this.method,
            responseType: this.responseType,
            directory: this.directory,
            files: this.files
          })
        } catch (err) {
          err.status = 500
          this.next(err)
        }
      }
    }
  ])

  return Connection
})()

exports.default = Connection
module.exports = exports['default']
