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

function createRender(template) {
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

  return getDefaultRender();
}

function getDefaultRender() {
  return createRender(path.join(__dirname, 'public', 'directory.html'));
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

function getFilesStats(directory, files, callback) {
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