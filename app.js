const finalhandler = require('finalhandler')
const http = require('http')
const serveIndex = require('.')

const index = serveIndex('test/fixtures')

http.createServer(function onRequest(req, res){
  const done = finalhandler(req, res)
  index(req, res, done)
}).listen(5001)