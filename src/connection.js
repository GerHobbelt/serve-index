
import _ from './utils.js'
import httpError from 'http-errors'
import accepts from 'accepts'

class Connection {
  constructor(sd, req, res, next) {
    this.sd = sd
    this.req = req
    this.res = res
    this.next = next
    this.url = _.parseUrl.original(this.req)
  }

  getMethod() {
    const method = this.req.method
    if (method !== 'GET' && method !== 'HEAD') {
      this.res.statusCode = method === 'OPTIONS' ? 200 : 405
      this.res.setHeader('Allow', 'GET, HEAD, OPTIONS')
      this.res.setHeader('Content-Length', '0')
      this.res.end()
      return
    }

    return (this.method = method)
  }

  getPathname() {
    const url = this.url
    const pathname = decodeURIComponent(url.pathname)

    if (this.sd.options.hidden && pathname.slice(0, 1) === '.') {
      _.debug('hidden folder "%s" deny.', pathname)
      this.next(httpError(403))
      return
    }

    // null byte(s), bad request
    if (pathname.indexOf('\0') !== -1) {
      _.debug('null byte(s) in "%s", bad request.', pathname)
      this.next(httpError(400))
      return
    }

    return (this.pathname = pathname)
  }

  getResponseType() {
    const acceptMediaTypes = Object.keys(this.sd.responser)
    const responseType = accepts(this.req).type(acceptMediaTypes)

    if (!responseType) {
      _.debug('mime not acceptable "%s".', responseType)
      this.next(httpError(406))
      return
    }

    return (this.responseType = responseType)
  }

  getResponser() {
    const responser = this.sd.responser[this.responseType]
    return (this.responser = responser)
  }

  getPath() {
    // join / normalize from root dir
    const path = _.path.normalize(_.path.join(this.sd.root, this.pathname))

    // malicious path
    if ((path + _.path.sep).slice(0, this.sd.root.length) !== this.sd.root) {
      _.debug('malicious path "%s".', this.pathname)
      this.next(httpError(403))
      return
    }

    return (this.path = path)
  }

  getDirectory() {
    _.debug('get directory "%s".', this.path)

    let stats
    try {
      stats = _.fs.statSync(this.path)
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
        this.next()
        return
      }

      err.status = err.code === 'ENAMETOOLONG' ? 414 : 500
      this.next(err)
      return
    }

    if (!stats.isDirectory()) {
      this.next()
      return
    }

    if (this.pathname.slice(-1) !== '/') {
      _.debug('add "/" to "%s".', this.pathname)
      this.res.writeHead(301, {
        Location: this.url.pathname + '/'
      })
      this.res.end()
      return
    }

    stats.path = this.path
    stats.pathname = this.pathname
    stats.url = this.sd.options.relative ? '.' : this.url.pathname

    return (this.directory = stats)
  }

  getFiles() {
    _.debug('get files "%s"', this.path)

    const path = this.path
    const urlPrefix = this.sd.options.relative ? '' : this.url.pathname
    let files

    try {
      files = _.fs
        .readdirSync(path)
        .map(function(file) {
          const stats = _.fs.statSync(_.path.join(path, file))
          stats.name = file
          stats.ext = _.path.extname(file)
          stats.type = _.mime(stats.ext)
          stats.url =
            urlPrefix +
            encodeURIComponent(file) +
            (stats.isDirectory() ? '/' : '')
          return stats
        })
        .sort(_.sortFile)
    } catch (err) {
      this.next(err)
      return
    }

    if (!this.sd.options.hidden) {
      files = files.filter(_.notHidden)
    }

    return (this.files = files)
  }

  response() {
    if (
      !this.getMethod() ||
      !this.getPathname() ||
      !this.getResponseType() ||
      !this.getResponser() ||
      !this.getPath() ||
      !this.getDirectory() ||
      !this.getFiles()
    ) {
      return
    }

    try {
      this.responser(this.req, this.res, {
        path: this.path,
        pathname: this.pathname,
        url: this.url,
        method: this.method,
        responseType: this.responseType,
        directory: this.directory,
        files: this.files
      })
    } catch (err) {
      err.status = 500
      this.next(err)
    }
  }
}

export default Connection
