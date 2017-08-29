'use strict';

var ENCODING = 'utf-8';

var accepts = require('accepts');
var parseUrl = require('parseurl');
var path = require('path');
var fs = require('fs');
var loashTemplate = require('lodash.template');
var mimeLookup = require('mime-types').lookup;
var Promise = global.Promise || require('es6-promise').Promise;
var httpError = require('http-errors');

var slice = Array.prototype.slice;
var toArray = Array.from || function(obj) {
  return slice.call(obj);
};
var toString = Object.prototype.toString;

var promisify = require('util').promisify || function(fn) {
  return function() {
    var args = toArray(arguments);
    var oThis = this;
    return new Promise(function(resolve, reject) {
      args.push(function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
      fn.apply(oThis, args);
    });
  };
};

var stat = promisify(fs.stat);

function noop() {}

function type(obj) {
  return toString.call(obj).slice(8, -1);
}

function maybeFile(file) {
  try {
    return fs.readFileSync(path.resolve(file), ENCODING);
  } catch(err) {
    return '';
  }
}

function render(template) {
  var templateType = type(template);
  if (templateType === 'Function') {
    return template;
  } else if (templateType === 'String') {
    return loashTemplate(maybeFile(template) || template, {imports: _});
  }

  return noop;
}

function responser(responseType, render, stat) {
  return function(req, res, data) {
    return Promise.resolve(stat ? getStats(data) : data)
      .then(function(data) {
        sendResponse(res, responseType, render(data));
      });
  }
}

function getResonseType(req, mediaTypes) {
  var accept = accepts(req)
  return accept.type(mediaTypes)
}

/**
 * Send a response.
 * @private
 */

function sendResponse(res, type, body) {
  // security header for content sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // standard headers
  res.setHeader('Content-Type', type + '; charset=' + ENCODING)
  res.setHeader('Content-Length', Buffer.byteLength(body, ENCODING))

  // body
  res.end(body, ENCODING)
}

function directoryFirst(a, b) {
  return b.stat.isDirectory() - a.stat.isDirectory()
}

function sortByName(a, b) {
  return a.name.localeCompare(b.name)
}

function notHidden(file) {
  return file.name.slice(0, 1) !== '.'
}

/**
 * Sort function for with directories first.
 */
function fileSort(a, b) {
  return directoryFirst(a, b) || sortByName(a, b)
}

function getFileMimeType(file) {
  return mimeLookup(file) || ''
}


function getStats(data, callback) {
  var promises = data.files.map(function(file) {
    if (file.stat) {
      return file
    }

    return stat(path.join(data.directory, file))
      .then(function(stat) {
        // combine the stats into the file list
        return {
          name: file,
          ext: path.extname(file),
          type: getFileMimeType(file),
          stat: stat
        }
      })
  })

  return Promise.all(promises).then(function(files) {
    // sort file list
    data.files = files.sort(fileSort);

    return data;
  })
}

var _ = module.exports = {
  type: type,
  render: render,
  responser: responser,
  getResonseType: getResonseType,
  parseUrl: parseUrl,
  sendResponse: sendResponse,
  getStats: getStats,
  fileSort: fileSort,
  getFileMimeType: getFileMimeType,
  httpError: httpError,
  notHidden: notHidden,
  Promise: Promise
}