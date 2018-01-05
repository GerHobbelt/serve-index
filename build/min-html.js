var fs = require('fs')
var path = require('path')

var content = fs.readFileSync(path.join(__dirname, './directory.html'), 'utf-8')
content = content.replace(/>\s*</g, '><')
var public = path.join(__dirname, '../public')
try {
  fs.mkdirSync(public)
} catch(_) {}

fs.writeFileSync(path.join(__dirname, '../public/directory.html'), content, 'utf-8')