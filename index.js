/*!
 * serve-index
 * Copyright(c) 2011 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
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

var packageInfo = require('./package.json');

/**
 * Module exports.
 * @public
 */

module.exports = serveIndex;

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
function serveIndex(root, options) {
  // root required
  if (!root) {
    throw new TypeError('serveIndex() root path required');
  }

  var opts = options || {};

  if (typeof opts.render !== 'function') {
    if (typeof opts.template === 'string') {
      opts.render = utils.createRender(opts.template);
    } else {
      opts.render = utils.getDefaultRender();
    }
  }

  // resolve root to absolute and normalize
  var rootPath = path.normalize(path.resolve(root) + path.sep);
  
  return function (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 'OPTIONS' === req.method ? 200 : 405;
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    var requestUrl = utils.parseUrl(req);
    var originalUrl = utils.parseUrl.original(req);

    var requestDirectory = decodeURIComponent(requestUrl.pathname);

    if (requestDirectory.slice(-1) !== '/') {
      requestDirectory += '/';
    }

    var originalDirectory = decodeURIComponent(originalUrl.pathname);

    // join / normalize from root dir
    var requestPath = path.normalize(path.join(rootPath, requestDirectory));

    // null byte(s), bad request
    if (~requestPath.indexOf('\0')) return next(utils.httpError(400));

    // malicious path
    if ((requestPath + path.sep).slice(0, rootPath.length) !== rootPath) {
      debug('malicious path "%s"', path);
      return next(utils.httpError(403));
    }

    var responser = getResonser(req);
    if (!responser) return next(utils.httpError(406));

    // check if we have a directory
    debug('stat "%s"', requestPath);

    var stat;
    try {
      var stat = fs.statSync(requestPath);
    } catch(err) {
      if (err.code === 'ENOENT') {
        return next();
      }

      err.status = err.code === 'ENAMETOOLONG'
        ? 414
        : 500;
      return next(err);
    }

    if (!stat.isDirectory()) {
      return next();
    }

    // fetch files
    debug('readdir "%s"', requestPath);
    var files;
    try {
      files = fs.readdirSync(requestPath);
    } catch(err) {
      return next(err);
    }

    var data = {
      files: files.sort(),
      requestDirectory: requestDirectory,
      directory: requestPath,
      options: opts
    };
    responser(req, res, data);
  };
};

function getResonser(req) {
  var acceptMediaTypes = Object.keys(serveIndex.responser);

  var resonseType = utils.getResonseType(req, acceptMediaTypes);
  return serveIndex.responser[resonseType];
}

serveIndex.responser = {
  'text/html': function(req, res, data, next) {
    utils.getFilesStats(data.directory, data.files, function(err, stats) {
      if (err) {
        return next(err);
      }

      // combine the stats into the file list
      data.files = data.files.map(function(file, index) {
        return { 
          name: file, 
          ext: path.extname(file),
          type: getFileMimeType(file),
          stat: stats[index]
        };
      });

      // sort file list
      data.files.sort(utils.fileSort);

      var renderData = {
        request: {
          headers: req.headers,
          url: req.url,
          method: req.method
        },
        files: data.files,
        directory: data.requestDirectory,
        options: data.options,
        package: packageInfo
      };

      utils.sendResponse(res, 'text/html', data.options.render(renderData));
    });
  },
  'text/plain': function(req, res, data, next) {
    utils.sendResponse(res, 'text/plain', data.files.join('\n') + '\n');
  },
  'application/json': function(req, res, data, next) {
    utils.sendResponse(res, 'application/json', JSON.stringify(data.files));
  }
};

