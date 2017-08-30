/*!
 * serve-index
 * Copyright(c) 2011 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * Copyright(c) 2017 fisker Cheung
 * MIT Licensed
 */

'use strict';

var path = require('path')
var utils = require('./utils.js')
var fs = require('fs')
var debug = require('debug')('serve-index');
var defaultOptions = require('./serve-directory').default


function Conection(root, responsers, req, res, next) {
  this.root = root
  this.responsers = responsers
  this.req = req
  this.res = res
  this.next = next
}

Conection.prototype.response = function(options, pkg) {
  var method = this.getMethod()
  if (!method) {
    return
  }

  var pathname = this.getPathName()
  if (!pathname) {
    return
  }

  var directory = this.getDirectory()
  if (!directory) {
    return
  }

  var responseType = this.getResponseType()
  if (!responseType) {
    return
  }

  var responser = this.getResonser()
  if (!responser) {
    return
  }

  var stat = this.getStat()
  if (!stat) {
    return
  }

  var files = this.getFiles()
  if (!files) {
    return
  }

  var next = this.next

  var opts = (options && options[responseType]) || {}
    
  var needStat = utils.type(opts.stat) === 'Undefined' ? defaultOptions[responseType].stat : opts.stat

  if (needStat) {
    try {
      files = utils.getStats(directory, files)
    } catch (err) {
      next(err)
      return
    }
    files.forEach(function(file) {
      file.ext = path.extname(file.name)
      file.type = utils.getFileMimeType(file.name)
    })
  }


  var data = {
    stat: stat,
    files: files,
    pathname: pathname,
    directory: directory
  }

  data.request = this.req
  data.package = pkg
  data.options = opts

  try {
    responser(this.req, this.res, data)
  } catch (err) {
    err.status = 500;
    next(err);
  }

}

Conection.prototype.getMethod = function() {
  var req = this.req
  var res = this.res
  var method = req.method

  if (method === 'GET' || method === 'HEAD') {
    return this.method = method
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
  } else {
    res.statusCode = 405
  }

  res.setHeader('Allow', 'GET, HEAD, OPTIONS')
  res.setHeader('Content-Length', '0')
  res.end()
}

Conection.prototype.getPathName = function() {
  var req = this.req
  var res = this.res
  var next= this.next
  var pathname = utils.parseUrl.original(req).pathname

  pathname = decodeURIComponent(pathname);

  // null byte(s), bad request
  if (~pathname.indexOf('\0')) {
    next(utils.httpError(400))
    return
  }

  return this.pathname = pathname
}

Conection.prototype.getDirectory = function() {
  var root = this.root
  var pathname = this.pathname || this.getPathName()
  var next = this.next

  // join / normalize from root dir
  var directory = path.normalize(path.join(root, pathname))

  // malicious path
  if ((directory + path.sep).slice(0, root.length) !== root) {
    debug('malicious path "%s"', pathname)
    next(utils.httpError(403))
    return
  }

  return this.directory = directory
}

Conection.prototype.getResponseType = function() {
  var responsers = this.responsers;
  var next = this.next

  var acceptMediaTypes = Object.keys(responsers)
  var responseType = utils.getResponseType(this.req, acceptMediaTypes)

  if (!responseType) {
    next(utils.httpError(406))
    return
  }

  return this.responseType = responseType
}

Conection.prototype.getResonser = function() {
  var responsers = this.responsers;
  var responseType = this.responseType || this.getResponseType()
  var next = this.next

  var responser = responsers[responseType];
  if (!responser) {
    next(utils.httpError(406))
    return
  }

  return this.responser = responser;
}

Conection.prototype.getStat = function() {
  // check if we have a directory
  debug('stat "%s"', directory);

  var req = this.req
  var res = this.res
  var next = this.next
  var directory = this.directory || this.getDirectory

  var stat;
  try {
    stat = fs.statSync(directory);
  } catch (err) {
    if (err.code === 'ENOENT') {
      next()
      return
    }

    err.status = err.code === 'ENAMETOOLONG' ? 414 : 500
    next(err)
    return
  }

  if (!stat.isDirectory()) {
   next() 
   return 
  }

  var pathname = utils.parseUrl.original(req).pathname
  if (pathname.slice(-1) !== '/') {
    res.writeHead(301, { 
      Location: pathname + '/'
    });
    res.end()
    return
  }
  
  return this.stat = stat
}

Conection.prototype.getFiles = function() {
  var directory = this.directory || this.getDirectory
  var next = this.next
  
  // fetch files
  debug('readdir "%s"', directory);
  var files;
  try {
    files = fs.readdirSync(directory)
  } catch (err) {
    next(err)
    return
  }

  return this.files = files
}

module.exports = Conection