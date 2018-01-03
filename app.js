var finalhandler = require('finalhandler')
var http = require('http')
var serveIndex = require('.')
var serveStatic = require('serve-static')

// Serve directory indexes for public/ftp folder (with icons)
var index = serveIndex('test/fixtures', {'icons': true})

// Serve up public/ftp folder files
var serve = serveStatic('test/fixtures')

// Create server
var server = http.createServer(function onRequest(req, res){
  var done = finalhandler(req, res)
  serve(req, res, function onNext(err) {
    if (err) return done(err)
    index(req, res, done)
  })
})

// Listen
server.listen(5001)