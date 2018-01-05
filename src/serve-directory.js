
const _ = require('./utils.js')
const Connection = require('./connection.js')

const defaultOptions = require('./default-options.js')

function responser(mime, render) {
  return function(req, res, data) {
    const body = render(data)

    // security header for content sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // standard headers
    res.setHeader('Content-Type', mime + '; charset=' + _.CHARSET)
    res.setHeader('Content-Length', Buffer.byteLength(body, _.CHARSET))

    // body
    res.end(body, _.CHARSET)
  }
}

class ServeDirectory {
  constructor(root, options) {
    // root required
    // resolve root to absolute and normalize
    try {
      root = _.path.normalize(_.path.resolve(root) + _.path.sep)
      _.fs.statSync(root)
    } catch (err) {
      throw err
    }


    this.root = root
    this.responser = {}
    this.options = {
      useRelativeUrl: defaultOptions.useRelativeUrl
    }
    this.imports = Object.assign({}, _)

    this.config(defaultOptions)

    if (options) {
      this.config(options)
    }
  }

  config(options) {
    const sd = this

    if (options.showHiddenFiles) {
      sd.options.showHiddenFiles = true
    }

    if (options.useRelativeUrl === false) {
      sd.options.useRelativeUrl = false
    }

    if (options.imports) {
      Object.assign(sd.imports, options.imports)
    }

    if (options.process) {
      options.process.filter(Boolean).forEach(function(processor) {
        processor.accept
          .split(',')
          .map(_.trim)
          .filter(Boolean)
          .forEach(function(type) {
            if (processor.template) {
              sd.responser[type] = responser(
                type,
                _.template(processor.template, {imports: sd.imports})
              )
            } else {
              delete sd.responser[type]
            }
          })
      })
    }
  }

  middleware(req, res, next) {
    try {
      return new Connection(this, req, res, next).response()
    } catch (err) {
      next(err)
    }
  }
}

module.exports = ServeDirectory
