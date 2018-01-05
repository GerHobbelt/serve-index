const finalhandler = require('finalhandler')
const http = require('http')
const serveDirectory = require('./src')
const serveStatic = require('serve-static')

const directory = serveDirectory('test/fixtures')
const static = serveStatic('test/fixtures')

http
  .createServer(function onRequest(req, res) {
    const done = finalhandler(req, res)
    static(req, res, function onNext(err) {
      return err ? done(err) : directory(req, res, done)
    })
  })
  .listen(3000)
