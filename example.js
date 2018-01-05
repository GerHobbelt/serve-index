const finalhandler = require('finalhandler')
const http = require('http')
const serveDirectory = require('.')

const directory = serveDirectory('test/fixtures')

http.createServer(function onRequest(req, res){
  const done = finalhandler(req, res)
  directory(req, res, done)
}).listen(3000)