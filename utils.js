'use strict';

var accepts = require('accepts');
var parseUrl = require('parseurl');
var path = require('path');
var fs = require('fs');
var loashTemplate = require('lodash.template');
var mimeLookup = require('mime-types').lookup;
var Promise = global.Promise || require('es6-promise').Promise;
var httpError = require('http-errors');
var promisify = require('util').promisify;

var promisifyStat = promisify ? promisify(fs.stat) : function(file) {
  return new Promise(function(resolve, reject) {
    fs.stat(file, function(err, state) {
      if (err) {
        reject(err);
      } else {
        resolve(state);
      }
    });
  });
};

function noop() {}

function getType(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

function maybeFile(file) {
  try {
    return fs.readFileSync(path.resolve(file), 'utf-8');
  } catch(err) {
    return '';
  }
}

function createRender(renderType, template) {
  if (renderType === 'text/html') {
    var type = getType(template);
    if (type === 'Function') {
      return template;
    } else if (type === 'String') {
      template = maybeFile(template) || template;
      var compiled = loashTemplate(template);

      return function(data) {
        return compiled(data).replace(/>\s+</g ,'><');
      };
    }
  }
  return getDefaultRender(renderType);
}

function getDefaultRender(type) {
  if (type === 'text/html') {
    return createRender(type, path.join(__dirname, 'public', 'directory.html'));
  } else if (type === 'text/plain') {
    return function(data) {
      return data.files.sort().join('\n') + '\n'
    };
  } else if (type === 'application/json') {
    return function(data) {
      return JSON.stringify(data.files.sort());
    };
  }

  return noop;
}


function getResonseType(req, mediaTypes) {
  var accept = accepts(req);
  var type = accept.type(mediaTypes);
  return type;
}

/**
 * Send a response.
 * @private
 */

function sendResponse(res, type, body) {
  // security header for content sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // standard headers
  res.setHeader('Content-Type', type + '; charset=utf-8')
  res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'))

  // body
  res.end(body, 'utf8')
}


/**
 * Sort function for with directories first.
 */
function fileSort(a, b) {
  return b.stat.isDirectory() - a.stat.isDirectory() || 
    a.name.localeCompare(b.name);
}

function getFileMimeType(file) {
  return mimeLookup(file) || '';
}


function getStats(data, callback) {
  var promises = data.files.map(function(file) {
    if (file.stat) {
      return file;
    }

    return promisifyStat(path.join(data.directory, file))
      .then(function(stat) {
        // combine the stats into the file list
        return {
          name: file,
          ext: path.extname(file),
          type: getFileMimeType(file),
          stat: stat
        };
      });
  });

  return Promise.all(promises).then(function(files) {
    // sort file list
    data.files = files.sort(fileSort);

    return data;
  });
}

module.exports = {
  createRender: createRender,
  getDefaultRender: getDefaultRender,
  getResonseType: getResonseType,
  parseUrl: parseUrl,
  sendResponse: sendResponse,
  getStats: getStats,
  fileSort: fileSort,
  getFileMimeType: getFileMimeType,
  httpError: httpError,
  Promise: Promise
};