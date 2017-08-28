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

var pkg;

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
    throw new TypeError('serveDirectory() root path required');
  }

  options = options || {};

  // resolve root to absolute and normalize
  root = path.normalize(path.resolve(root) + path.sep);
    
  if (options.template) {
    var render = utils.createRender('text/html', options.template);
    serveDirectory.setResponser('text/html', render, true);
  }

  return function(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 'OPTIONS' === req.method ? 200 : 405;
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    var pathname = utils.parseUrl.original(req).pathname;

    if (pathname.slice(-1) !== '/') {
 	    res.writeHead(301, { 
        Location: pathname + '/'
      });
 	    res.end();
      return;
    }

    pathname = decodeURIComponent(pathname);
    
    // null byte(s), bad request
    if (~pathname.indexOf('\0')) return next(utils.httpError(400));

    // join / normalize from root dir
    var directory = path.normalize(path.join(root, pathname));


    // malicious path
    if ((directory + path.sep).slice(0, root.length) !== root) {
      debug('malicious path "%s"', path);
      return next(utils.httpError(403));
    }

    var responseType = getResonseType(req);
    var responser = serveDirectory.responser[responseType];
    if (!responser) return next(utils.httpError(406));

    // check if we have a directory
    debug('stat "%s"', directory);

    var stat;
    try {
      var stat = fs.statSync(directory);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return next();
      }

      err.status = err.code === 'ENAMETOOLONG' ? 414 : 500;
      return next(err);
    }

    if (!stat.isDirectory()) {
      return next();
    }

    // fetch files
    debug('readdir "%s"', directory);
    var files;
    try {
      files = fs.readdirSync(directory);
    } catch (err) {
      return next(err);
    }


    var data = {
      request: req,
      files: files,
      pathname: pathname,
      directory: directory,
      options: options,
      package: pkg || (pkg = require('./package.json'))
    };

    Promise.resolve(responser(req, res, data))
      .catch(function(err) {
        err.status = 500;
        next(err);
      });
  };
}

function getResonseType(req) {
  var acceptMediaTypes = Object.keys(serveDirectory.responser);
  return utils.getResonseType(req, acceptMediaTypes);
}

serveDirectory.utils = utils;

serveDirectory.responser = {};


serveDirectory.setResponser = function(type, render, neeeState) {
  render = render || utils.getDefaultRender(type);
  
  serveDirectory.responser[type] = function(req, res, data) {
    return Promise.resolve(neeeState ? utils.getStats(data) : data)
      .then(function(data) {
        utils.sendResponse(res, type, render(data));
      });
  };
}

serveDirectory.setResponser('text/html', undefined, true);
serveDirectory.setResponser('text/plain');
serveDirectory.setResponser('application/json');


/**
 * Module exports.
 * @public
 */

module.exports = serveDirectory;