/*!
 * serve-index
 * Copyright(c) 2011 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * Copyright(c) 2017 fisker Cheung
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */
var debug = require('debug')('serve-index');
var fs = require('fs');
var path = require('path');
var utils = require('./utils.js');
var Promise = utils.Promise;
var Conection = require('./lib/conection')

var pkg;

var defaultRenders = {
  'text/html': utils.render(path.join(__dirname, 'public', 'directory.html')),
  'text/plain': {
    render: function(data) {
      return data.files.sort().join('\n') + '\n'
    },
    stat: false
  },
  'application/json': {
    render: function(data) {
      return JSON.stringify(data.files.sort())
    },
    stat: false
  },
}


/**
 * Media types and the map for content negotiation.
 */

/**
 * Serve directory listings with the given `root` path.
 *
 * See Readme.md for documentation of options.
 *
 * @param {String} root
 * @param {Object} options
 * @return {Function} middleware
 * @public
 */
function serveDirectory(root, options) {
  // root required
  if (!root) {
    throw new TypeError('serveDirectory() root path required')
  }

  options = options || {}

  // resolve root to absolute and normalize
  root = path.normalize(path.resolve(root) + path.sep);
    
  if (options.template) {
    var render = utils.render(options.template);
    serveDirectory.setResponser('text/html', render);
  }

  return function(req, res, next) {
    var conection = new Conection(root, responsers, req, res, next)
    
    pkg = pkg || (pkg = require('./package.json'))
    conection.response(options, pkg)
  }
}

serveDirectory.utils = utils;


var setResponser = serveDirectory.setResponser = function(type, render) {
  render = render || defaultRenders[type];
  
  responsers[type] = utils.responser(type, render);
};


var responsers = serveDirectory.responser = {};

Object.keys(defaultRenders).forEach(function(type) {
  setResponser(type, defaultRenders[type]);
});

/**
 * Module exports.
 * @public
 */

module.exports = serveDirectory;