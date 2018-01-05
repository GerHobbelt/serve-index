const babel = require('babel-core')
const _ = require('../src/utils.js')
const SOURCE_DIR = _.path.join(__dirname, '..', 'src')
const DIST_DIR = _.path.join(__dirname, '..', 'dist')
const banner = _.read(_.path.join(SOURCE_DIR, 'banner.md'))

buildJS()
buildTemplate()

function buildTemplate() {
  let content = _.read(_.path.join(SOURCE_DIR, 'directory.html'))
  content = content.replace(/>\s*</g, '><')
  _.fs.writeFileSync(_.path.join(DIST_DIR, 'directory.html'), content)
}

function buildJS() {
  const files = [
    'index.js',
    'default-options.js',
    'serve-directory.js',
    'connection.js',
    'utils.js',
  ]

  files.forEach(function(file) {
    let code = _.read(_.path.join(SOURCE_DIR, file))
    code = babel.transform(code, {
      "presets": [
        ["env", {
          "targets": {
            "node": "0.8"
          }
        }]
      ]
    }).code
    code = babel.transform(code, {
      "presets": [
        ["minify"]
      ]
    }).code
    _.fs.writeFileSync(_.path.join(DIST_DIR, file), banner + code)
  })
}
