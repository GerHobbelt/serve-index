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
var Connection = require('./lib/connection.js')
var ServeDirectory = require('./lib/serve-directory.js')

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
    var connection = new Connection(sd, req, res, next)
    try {
      connection.response()
    } catch (err) {
      next(err)
      return
    }
  }
}

serveDirectory.utils = utils

/**
 * Module exports.
 * @public
 */

module.exports = serveDirectory