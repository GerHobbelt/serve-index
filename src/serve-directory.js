/*!
 * serve-index
 * Copyright(c) 2011 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * Copyright(c) 2017 fisker Cheung
 * MIT Licensed
 */

'use strict'

var path = require('path')
var utils = require('./utils.js')

var defaultOptions = {
  'text/html': {
    template: path.join(__dirname, '../public/directory.html'),
    data: {
      stat: true,
      pathname: true,
      files: {
        name: true,
        ext: false,
        type: true,
        stat: true
      },
      directory: false,
      req: true,
      options: true,
      pkg: true,
      options: true
    }
  },
  'text/plain': {
    template: function(files) {
      return files.join('\n') + '\n'
    }
  },
  'application/json': {
    template: function(files) {
      return JSON.stringify(files)
    }
  }
}

function ServeDirectory(root, options) {
  // root required
  if (!root) {
    throw new TypeError('serveDirectory() root path required')
  }

  // resolve root to absolute and normalize
  this.root = path.normalize(path.resolve(root) + path.sep)

  this.setDefaultResponser()

  this.options = this.config(options)
}

ServeDirectory.prototype.config = function(options) {
  var sd = this
  options = options || {}
  var types = Object.keys(options)

  if (types.length < 1) {
    return options
  }

  if (types[0].indexOf('/') === -1) {
    return sd.config({
      'text/html': options
    })
  }

  var responsers = sd.responsers
  types.forEach(function(type) {
    if (type.indexOf('/') === -1) {
      throw new TypeError('unknow options: ', options)
    } else {
      sd.setResponser(type, options[type])
    }
  })

  return options
}

ServeDirectory.prototype.setDefaultResponser = function() {
  var sd = this
  this.responsers = {}
  Object.keys(defaultOptions).forEach(function(type) {
    sd.setResponser(type, defaultOptions[type])
  })
}

ServeDirectory.prototype.setResponser = function(mime, options) {
  if (arguments.length == 1) {
    options = type
    mime = 'text/html'
  }

  if (!options) {
    delete this.responsers[type]
    return
  }

  if (options.responser) {
    this.responsers[mime] = options.responser
    return
  }

  var type = utils.type(options)

  if (type === 'Function' || type === 'String') {
    options = {
      template: options,
      stat: true
    }
  }

  var render = utils.render(options.template || defaultOptions[mime].template)

  this.responsers[mime] = utils.responser(mime, render)
}

ServeDirectory.default = defaultOptions

module.exports = ServeDirectory
