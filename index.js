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

var package = require('./package.json');

/**
 * Module exports.
 * @public
 */

module.exports = serveDirectory;

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
  var rootPath = path.normalize(path.resolve(root) + path.sep);

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

    // join / normalize from root dir
    var directory = path.normalize(path.join(rootPath, pathname));

    // null byte(s), bad request
    if (~directory.indexOf('\0')) return next(utils.httpError(400));

    // malicious path
    if ((directory + path.sep).slice(0, rootPath.length) !== rootPath) {
      debug('malicious path "%s"', path);
      return next(utils.httpError(403));
    }

    var responser = getResonser(req);
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
      files: files.sort(),
      pathname: pathname,
      directory: directory,
      options: options,
      render: utils.createRender(options.template)
    };
    responser(req, res, data, next);
  };
}

function getResonser(req) {
  var acceptMediaTypes = Object.keys(serveDirectory.responser);

  var resonseType = utils.getResonseType(req, acceptMediaTypes);
  return serveDirectory.responser[resonseType];
}

serveDirectory.utils = utils;

serveDirectory.responser = {
  'text/html': function(req, res, data, next) {
    var render = data.render;
    utils.getFilesStats(data.directory, data.files, function(err, stats) {
      if (err) {
        return next(err);
      }

      // combine the stats into the file list
      data.files = data.files.map(function(file, index) {
        return {
          name: file,
          ext: path.extname(file),
          type: utils.getFileMimeType(file),
          stat: stats[index]
        };
      });

      // sort file list
      data.files.sort(utils.fileSort);

      var renderData = {
        req: req,
        files: data.files,
        pathname: data.pathname,
        options: data.options,
        package: package
      };

      var body;
      try {
        body = render(renderData);
      } catch(err) {
        err.status = 500;
        return next(err);
      }

      utils.sendResponse(res, 'text/html', body);
    });
  },
  'text/plain': function(req, res, data, next) {
    utils.sendResponse(res, 'text/plain', data.files.join('\n') + '\n');
  },
  'application/json': function(req, res, data, next) {
    utils.sendResponse(res, 'application/json', JSON.stringify(data.files));
  }
};
