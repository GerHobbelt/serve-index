
var after = require('after');
var assert = require('assert');
var http = require('http');
var fs = require('fs');
var path = require('path');
var request = require('supertest');
var serveIndex = require('..');

var fixtures = path.join(__dirname, '/fixtures');
var relative = path.relative(process.cwd(), fixtures);

var skipRelative = ~relative.indexOf('..') || path.resolve(relative) === relative;

describe('serveIndex(root)', function () {
  it('should require root', function () {
    assert.throws(serveIndex, /root path required/)
  })

  it('should serve text/html without Accept header', function (done) {
    var server = createServer()

    request(server)
    .get('/')
    .expect('Content-Type', 'text/html; charset=utf-8')
    .expect(200, done)
  })

  it('should include security header', function (done) {
    var server = createServer()

    request(server)
    .get('/')
    .expect('X-Content-Type-Options', 'nosniff')
    .expect(200, done)
  })

  it('should serve a directory index', function (done) {
    var server = createServer()

    request(server)
    .get('/')
    .expect(200, /todo\.txt/, done)
  })

  it('should work with HEAD requests', function (done) {
    var server = createServer()

    request(server)
    .head('/')
    .expect(200, '', done)
  })

  it('should work with OPTIONS requests', function (done) {
    var server = createServer()

    request(server)
    .options('/')
    .expect('Allow', 'GET, HEAD, OPTIONS')
    .expect(200, done)
  })

  it('should deny POST requests', function (done) {
    var server = createServer()

    request(server)
    .post('/')
    .expect(405, done)
  })

  it('should deny path will NULL byte', function (done) {
    var server = createServer()

    request(server)
    .get('/%00')
    .expect(400, done)
  })

  it('should deny path outside root', function (done) {
    var server = createServer()

    request(server)
    .get('/../')
    .expect(403, done)
  })

  it('should skip non-existent paths', function (done) {
    var server = createServer()

    request(server)
    .get('/bogus')
    .expect(404, 'Not Found', done)
  })

  it('should treat an ENAMETOOLONG as a 414', function (done) {
    var path = Array(11000).join('foobar')
    var server = createServer()

    request(server)
    .get('/' + path)
    .expect(414, done)
  })

  it('should skip non-directories', function (done) {
    var server = createServer()

    request(server)
    .get('/nums')
    .expect(404, 'Not Found', done)
  })

  describe('when given Accept: header', function () {
    describe('when Accept: application/json is given', function () {
      it('should respond with json', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(/g# %3 o & %2525 %37 dir/)
        .expect(/users/)
        .expect(/file #1\.txt/)
        .expect(/nums/)
        .expect(/todo\.txt/)
        .expect(/さくら\.txt/)
        .expect(200, done)
      });

      it('should include security header', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'application/json')
        .expect('X-Content-Type-Options', 'nosniff')
        .expect(200, done)
      })
    });

    describe('when Accept: text/html is given', function () {
      it('should respond with html', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(/<!DOCTYPE html>/)
        .expect(/<head>/)
        .expect(/<body>/)
        .expect(/<a href="g%23%20%253%20o%20%26%20%252525%20%2537%20dir\/"/)
        .expect(/<a href="users\/"/)
        .expect(/<a href="file%20%231.txt"/)
        .expect(/<a href="todo.txt"/)
        .expect(/<a href="%E3%81%95%E3%81%8F%E3%82%89\.txt"/)
        .end(done);
      });

      it('should include security header', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect('X-Content-Type-Options', 'nosniff')
        .expect(200, done)
      })

      it('should property escape file names', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(/<a href="foo%20%26%20bar"/)
        .expect(/foo &amp; bar/)
        .expect(bodyDoesNotContain('foo & bar'))
        .end(done);
      });

      it('should sort folders first', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .end(function (err, res) {
          if (err) done(err);
          var body = res.text.split('</h1>')[1];
          var urls = body.split(/<a href="([^"]*)"/).filter(function(s, i){ return i%2; });
          assert.deepEqual(urls, [
            '%23directory/',
            'collect/',
            'g%23%20%253%20o%20%26%20%252525%20%2537%20dir/',
            'users/',
            'file%20%231.txt',
            'foo%20%26%20bar',
            'nums',
            'todo.txt',
            '%E3%81%95%E3%81%8F%E3%82%89.txt'
          ]);
          done();
        });
      });
    });

    describe('when Accept: text/plain is given', function () {
      it('should respond with text', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'text/plain')
        .expect(200)
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect(/users/)
        .expect(/g# %3 o & %2525 %37 dir/)
        .expect(/file #1.txt/)
        .expect(/todo.txt/)
        .expect(/さくら\.txt/)
        .end(done);
      });

      it('should include security header', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'text/plain')
        .expect('X-Content-Type-Options', 'nosniff')
        .expect(200, done)
      })
    });

    describe('when Accept: application/x-bogus is given', function () {
      it('should respond with 406', function (done) {
        var server = createServer()

        request(server)
        .get('/')
        .set('Accept', 'application/x-bogus')
        .expect(406, done)
      });
    });
  });

  describe('with "template" option', function () {
    describe('when setting a custom template file', function () {
      var server;
      before(function () {
        server = createServer(fixtures, {'template': fs.readFileSync(__dirname + '/shared/template.html', 'utf-8')});
      });

      it('should respond with file list', function (done) {
        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect(/<a href="g%23%20%253%20o%20%26%20%252525%20%2537%20dir\/"/)
        .expect(/<a href="users\/"/)
        .expect(/<a href="file%20%231.txt"/)
        .expect(/<a href="todo.txt"/)
        .expect(200, done)
      });

      it('should respond with testing template sentence', function (done) {
        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect(200, /This is the test template/, done)
      });

      it('should list directory twice', function (done) {
        request(server)
        .get('/users/')
        .set('Accept', 'text/html')
        .expect(function (res) {
          var occurances = res.text.match(/directory \/users\//g)
          if (occurances && occurances.length === 2) return
          throw new Error('directory not listed twice')
        })
        .expect(200, done)
      });
    });

    describe('when setting a custom template function', function () {
      it('should invoke function to template', function (done) {
        var server = createServer(fixtures, {'template': function (data) {
          return 'This is a template.';
        }});

        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect(200, 'This is a template.', done);
      });

      // it('should handle template errors', function (done) {
      //   var server = createServer(fixtures, {'template': function (data) {
      //     new Error('boom!');
      //   }});

      //   request(server)
      //   .get('/')
      //   .set('Accept', 'text/html')
      //   .expect(500, 'boom!', done);
      // });

      it('should provide "directory" local', function (done) {
        var server = createServer(fixtures, {'template': function (data) {
          return JSON.stringify(data.directory);
        }});

        request(server)
        .get('/users/')
        .set('Accept', 'text/html')
        .expect(200, '"/users/"', done);
      });

      it('should provide "fileList" local', function (done) {
        var server = createServer(fixtures, {'template': function(data) {
          return JSON.stringify(data.files.map(function (file) {
            file.stat = file.stat instanceof fs.Stats;
            return {
              name: file.name,
              stat: file.stat
            };
          }));
        }});

        request(server)
        .get('/users/')
        .set('Accept', 'text/html')
        .expect('[{"name":"#dir","stat":true},{"name":"index.html","stat":true},{"name":"tobi.txt","stat":true}]')
        .expect(200, done);
      });

      it('should provide "path" local', function (done) {
        var server = createServer(fixtures, {'template': function (data) {
          return JSON.stringify(data.path);
        }});

        request(server)
        .get('/users/')
        .set('Accept', 'text/html')
        .expect(200, JSON.stringify(path.join(fixtures, 'users/')), done);
      });
    });
  });

  describe('when using custom responser', function () {
    describe('exports.html', function () {
      alterProperty(serveIndex.responser, 'text/html', serveIndex.responser['text/html'])

      it('should get called with Accept: text/html', function (done) {
        var server = createServer()

        serveIndex.responser['text/html'] = function (req, res, data) {
          res.setHeader('Content-Type', 'text/html');
          res.end('called');
        }

        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect(200, 'called', done)
      });

      it('should get file list', function (done) {
        var server = createServer()

        serveIndex.responser['text/html'] = function(req, res, data) {
          var text = data.files
            .filter(function (f) { return /\.txt$/.test(f) })
            .sort()
          res.setHeader('Content-Type', 'text/html')
          res.end('<b>' + text.length + ' text files</b>')
        }

        request(server)
        .get('/')
        .set('Accept', 'text/html')
        .expect(200, '<b>3 text files</b>', done)
      });

      it('should get dir name', function (done) {
        var server = createServer()

        serveIndex.responser['text/html'] = function (req, res, data, next) {
          res.setHeader('Content-Type', 'text/html')
          res.end('<b>' + data.requestDirectory + '</b>')
        }

        request(server)
        .get('/users/')
        .set('Accept', 'text/html')
        .expect(200, '<b>/users/</b>', done)
      });
    });

    describe('exports.plain', function () {
      alterProperty(serveIndex.responser, 'text/plain', serveIndex.responser['text/plain'])

      it('should get called with Accept: text/plain', function (done) {
        var server = createServer()

        serveIndex.responser['text/plain'] = function (req, res, files) {
          res.setHeader('Content-Type', 'text/plain');
          res.end('called');
        }

        request(server)
        .get('/')
        .set('Accept', 'text/plain')
        .expect(200, 'called', done)
      });
    });

    describe('exports.json', function () {
      alterProperty(serveIndex.responser, 'application/json', serveIndex.responser['application/json'])

      it('should get called with Accept: application/json', function (done) {
        var server = createServer()

        serveIndex.responser['application/json'] = function (req, res, files) {
          res.setHeader('Content-Type', 'application/json');
          res.end('"called"');
        }

        request(server)
        .get('/')
        .set('Accept', 'application/json')
        .expect(200, '"called"', done)
      });
    });
  });

  describe('when navigating to other directory', function () {
    it('should respond with correct listing', function (done) {
      var server = createServer()

      request(server)
      .get('/users/')
      .set('Accept', 'text/html')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a href="index.html"/)
      .expect(/<a href="tobi.txt"/)
      .end(done);
    });

    // it('should include link to parent directory', function (done) {
    //   var server = createServer()

    //   request(server)
    //   .get('/users')
    //   .end(function (err, res) {
    //     if (err) return done(err);
    //     var body = res.text.split('</h1>')[1];
    //     var urls = body.split(/<a href="([^"]*)"/).filter(function(s, i){ return i%2; });
    //     assert.deepEqual(urls, [
    //       '/',
    //       '/users/%23dir',
    //       '/users/index.html',
    //       '/users/tobi.txt'
    //     ]);
    //     done();
    //   });
    // });

    it('should work for directory with #', function (done) {
      var server = createServer()

      request(server)
      .get('/%23directory/')
      .set('Accept', 'text/html')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a href="index.html"/)
      .end(done);
    });

    it('should work for directory with special chars', function (done) {
      var server = createServer()

      request(server)
      .get('/g%23%20%253%20o%20%26%20%252525%20%2537%20dir/')
      .set('Accept', 'text/html')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a href="empty.txt"/)
      .end(done);
    });

    it('should property escape directory names', function (done) {
      var server = createServer()

      request(server)
      .get('/g%23%20%253%20o%20%26%20%252525%20%2537%20dir/')
      .set('Accept', 'text/html')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/g# %3 o &amp; %2525 %37 dir/)
      .expect(bodyDoesNotContain('g# %3 o & %2525 %37 dir'))
      .end(done);
    });

    it('should not work for outside root', function (done) {
      var server = createServer()

      request(server)
      .get('/../support/')
      .set('Accept', 'text/html')
      .expect(403, done);
    });
  });

  describe('when set with trailing slash', function () {
    var server;
    before(function () {
      server = createServer(fixtures + '/');
    });

    it('should respond with file list', function (done) {
      request(server)
      .get('/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(/users/)
      .expect(/file #1\.txt/)
      .expect(/nums/)
      .expect(/todo\.txt/)
      .expect(200, done)
    });
  });

  (skipRelative ? describe.skip : describe)('when set to \'.\'', function () {
    var server;
    before(function () {
      server = createServer('.');
    });

    it('should respond with file list', function (done) {
      var dest = relative.split(path.sep).join('/');
      request(server)
      .get('/' + dest + '/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(/users/)
      .expect(/file #1\.txt/)
      .expect(/nums/)
      .expect(/todo\.txt/)
      .expect(200, done)
    });

    it('should not allow serving outside root', function (done) {
      request(server)
      .get('/../')
      .set('Accept', 'text/html')
      .expect(403, done);
    });
  });
});

function alterProperty(obj, prop, val) {
  var prev

  beforeEach(function () {
    prev = obj[prop]
    obj[prop] = val
  })
  afterEach(function () {
    obj[prop] = prev
  })
}

function createServer(dir, opts) {
  dir = dir || fixtures

  var _serveIndex = serveIndex(dir, opts)

  return http.createServer(function (req, res) {
    _serveIndex(req, res, function (err) {
      res.statusCode = err ? (err.status || 500) : 404
      res.end(err ? err.message : 'Not Found')
    })
  })
}

function bodyDoesNotContain(text) {
  return function (res) {
    assert.equal(res.text.indexOf(text), -1)
  }
}
