const babel = require('babel-core')
const _ = require('../src/utils.js')
const SOURCE_DIR = _.path.join(__dirname, '..', 'src')
const DIST_DIR = _.path.join(__dirname, '..', 'dist')

const files = [
  'index.js',
  'default-options.js',
  'serve-directory.js',
  'connection.js',
]

files.forEach(function(file) {
  let code = _.read(_.path.join(SOURCE_DIR, file))
  let result = babel.transformFile(code)
  _.fs.writeFile(_.path.join(DIST_DIR, file), result.code)
})