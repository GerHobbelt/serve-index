# serve-directory

  Serves pages that contain directory listings for a given path. forked from expressjs/serve-directory


## Install

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install serve-directory
```

## API
** NOTICE: the api is not stable yet **

```js
var serveDirectory = require('serve-directory')
```

### serveDirectory(path, options)

Returns middlware that serves an index of the directory in the given `path`.

The `path` is based off the `req.url` value, so a `req.url` of `'/some/dir`
with a `path` of `'public'` will look at `'public/some/dir'`. If you are using
something like `express`, you can change the URL "base" with `app.use` (see
the express example).

#### Options

serveDirectory accepts these properties in the options object.

options should be a object with key(accecpt mime-type), and options for current mime-type.

like this

```js
var options = {
  'text/html': {
    responser: [Function],
    template: [String, Function],
    stat: [Boolean],
    ...
  },
  'application/json': {
    responser: [Function],
    template: [String, Function],
    stat: [Boolean],
    ...
  },
  ...
};


responser<Function>
  how to response
  responser(req, res, data), 3 arguments

template<Function>
  parse data to response body
  responser(data), 1 argument

template<String> 
  will make a compiled function with `loash.template` 
  with serveDirectory.utils.render(template<String>) you can get your own template parser

if `responser` is a function, `template` will be ignored.

stat<Boolean> 
  should data.files with stat
```

---

if only options for `text/html`, you can also set options like this

```js
var options = {
  responser: [Function],
  template: [String, Function],
  stat: [Boolean],
  ...
}
```

---
set to `false` if you want delete the default responser

```js
var option = {
  'text/plain': false
}
``

the server not not accept `text/plain`

## the default options

```js
var defaultOptions = {
  'text/html': {
    template: './public/directory.html',
    stat: true
  },
  'text/plain': {
    template: function(data) {
      return data.files.sort().join('\n') + '\n'
    },
    stat: false
  },
  'application/json': {
    template: function(data) {
      return JSON.stringify(data.files.sort())
    },
    stat: false
  }
};
```

## data
the data for rendering

```js 
{
  files: [Array],
  pathname: [String],
  options: [Object]
}
```

if options `stat` is true
  `files` will be Array with each item like 
```js
{
  name: [String],
  stat: [fs.Stats],  // see https://nodejs.org/api/fs.html#fs_class_fs_stats
}
```

otherwise
  `files` will be simple Array with filenames 


## Examples

### Serve directory indexes with vanilla node.js http server

```js
var finalhandler = require('finalhandler')
var http = require('http')
var serveDirectory = require('serve-directory')
var serveStatic = require('serve-static')

var index = serveDirectory('public/ftp')

// Serve up public/ftp folder files
var serve = serveStatic('public/ftp')

// Create server
var server = http.createServer(function onRequest(req, res){
  var done = finalhandler(req, res)
  serve(req, res, function onNext(err) {
    if (err) return done(err)
    index(req, res, done)
  })
})

// Listen
server.listen(3000)
```

### Serve directory indexes with express

```js
var express    = require('express')
var serveDirectory = require('serve-directory')

var app = express()

// Serve URLs like /ftp/thing as public/ftp/thing
app.use('/ftp', serveDirectory('public/ftp'))
app.listen()
```

## License

[MIT](LICENSE). The [Silk](http://www.famfamfam.com/lab/icons/silk/) icons
are created by/copyright of [FAMFAMFAM](http://www.famfamfam.com/).

[npm-image]: https://img.shields.io/npm/v/serve-directory.svg
[npm-url]: https://npmjs.org/package/serve-directory
[travis-image]: https://img.shields.io/travis/expressjs/serve-directory/master.svg?label=linux
[travis-url]: https://travis-ci.org/expressjs/serve-directory
[appveyor-image]: https://img.shields.io/appveyor/ci/dougwilson/serve-directory/master.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/dougwilson/serve-directory
[coveralls-image]: https://img.shields.io/coveralls/expressjs/serve-directory/master.svg
[coveralls-url]: https://coveralls.io/r/expressjs/serve-directory?branch=master
[downloads-image]: https://img.shields.io/npm/dm/serve-directory.svg
[downloads-url]: https://npmjs.org/package/serve-directory
[gratipay-image]: https://img.shields.io/gratipay/dougwilson.svg
[gratipay-url]: https://www.gratipay.com/dougwilson/
