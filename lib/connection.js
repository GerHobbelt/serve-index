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


function Connection(sd, req, res, next) {
  this.root = sd.root
  this.responsers = sd.responsers
  this.options = sd.options
  this.req = req
  this.res = res
  this.next = next

  this.requestPathname = utils.parseUrl.original(req).pathname
}

Connection.prototype.get = function() {
  if (
    !this.getMethod() || 
    !this.getPathName() || 
    !this.getDirectory() ||
    !this.getResponseType() ||
    !this.getResponser() ||
    !this.getStat() ||
    !this.getFiles()
  ) {
    return false
  }

  return this
}

Connection.prototype.getFiles = function() {
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

Connection.prototype.getStat = function() {
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

Connection.prototype.getResponser = function() {
  var responsers = this.responsers;
  var responseType = this.responseType
  var next = this.next

  var responser = responsers[responseType];
  if (!responser) {
    next(utils.httpError(406))
    return
  }

  return this.responser = responser;
}

Connection.prototype.getResponseType = function() {
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

Connection.prototype.getDirectory = function() {
  var root = this.root
  var pathname = this.pathname
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

Connection.prototype.getPathName = function() {
  var req = this.req
  var res = this.res
  var next= this.next
  var requestPathname = this.requestPathname

  var pathname = decodeURIComponent(requestPathname);

  // null byte(s), bad request
  if (~pathname.indexOf('\0')) {
    next(utils.httpError(400))
    return
  }

  return this.pathname = pathname
}

Connection.prototype.getMethod = function() {
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

Connection.prototype.response = function() {
  if(!this.get()) {
    return
  }

  var next = this.next

  var directory = this.directory
  var responseType = this.responseType

  var opts = (this.options && this.options[responseType]) || {}
  
  var dataOptions = opts.data || defaultOptions[responseType].data;

  var data;
  if (utils.type(dataOptions) !== 'Object' || utils.type(dataOptions.files) !== 'Object') {
    data = this.files.sort();
  } else {
    data = {};

    if (dataOptions.files === true) {
        data.files = this.files;
      } else {
        try {
          data.files = this.files.map(function(file) {
            var fileObject = {}
            fileObject.name = file
            if (dataOptions.files.stat) {
              fileObject.stat = fs.statSync(path.join(directory, file))
            }
            if (dataOptions.files.ext) {
              fileObject.ext = path.extname(file.name)
            }
            if (dataOptions.files.type) {
              fileObject.type = utils.getFileMimeType(file.type)
            }
            return fileObject
          }).sort(utils.fileSort)
        } catch (err) {
          next(err)
          return
        }
      }

      if (dataOptions.stat) {
        data.stat = this.stat
      }

      if (dataOptions.request) {
        data.request = this.req
      }

      if (dataOptions.pathname) {
        data.pathname = this.pathname
      }

      if (dataOptions.directory) {
        data.directory = this.directory
      }

      if (dataOptions.pkg) {
        data.pkg = utils.pkg()
      }

      if (dataOptions.options) {
        data.options = opts
      }
  }


  try {
    this.responser(this.req, this.res, data)
  } catch (err) {
    err.status = 500;
    next(err);
  }
}

module.exports = Connection