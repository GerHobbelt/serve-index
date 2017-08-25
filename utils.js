'use strict';

var accepts = require('accepts');
var parseUrl = require('parseurl');
var path = require('path');
var fs = require('fs');
var loashTemplate = require('lodash.template');
var Batch = require('batch');
var mime = require('mime-types');

function createRender(template) {
  var compiled = loashTemplate(template);

  return function(data) {
    return compiled(data).replace(/>\s+</g ,'><');
  };
}

function getDefaultRender() {
  var templateFile = path.join(__dirname, 'public', 'directory.html');
  var template = fs.readFileSync(templateFile, 'utf-8');
  return createRender(template);
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
  var ext = path.extname(file);
  return mime.lookup(ext) || '';
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