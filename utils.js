'use strict';

var accepts = require('accepts');
var parseUrl = require('parseurl');
var path = require('path');
var fs = require('fs');
var loashTemplate = require('lodash.template');
var Batch = require('batch');
var mimeLookup = require('mime-types').lookup;

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
 * Stat all files and return array of stat
 * in same order.
 */

function getFilesStatsBatch(directory, files, callback) {
  var batch = new Batch();

  batch.concurrency(10);

  files.forEach(function(file){
    batch.push(function(done){
      fs.stat(path.join(directory, file), function(err, stat){
        if (err && err.code !== 'ENOENT') return done(err);

        // pass ENOENT as null stat, not error
        done(null, stat || null);
      });
    });
  });

  batch.end(callback);
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

function getFilesStats(data, callback) {
  getFilesStatsBatch(data.directory, data.files, function(err, stats) {
    if (err) {
      return callback(err);
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
    data.files.sort(fileSort);

    delete data.directory;

    callback(null, data);

  });
}

module.exports = {
  createRender: createRender,
  getDefaultRender: getDefaultRender,
  getResonseType: getResonseType,
  parseUrl: parseUrl,
  sendResponse: sendResponse,
  getFilesStats: getFilesStats,
  fileSort: fileSort,
  getFileMimeType: getFileMimeType,
  httpError: require('http-errors')
};