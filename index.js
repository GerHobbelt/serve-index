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
var utils = require('./lib/utils.js');
var Conection = require('./lib/conection.js')
var ServeDirectory = require('./lib/serve-directory.js')
var pkg




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
  var sd = new ServeDirectory(root, options);

  return function(req, res, next) {
    var conection = new Conection(sd.root, sd.responsers, req, res, next)
    
    pkg = pkg || (pkg = require('./package.json'))
    conection.response(sd.options, pkg)
  }
}

serveDirectory.utils = utils

/**
 * Module exports.
 * @public
 */

module.exports = serveDirectory