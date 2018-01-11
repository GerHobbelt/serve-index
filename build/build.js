const babel = require('babel-core')
const prettier = require('prettier')
const fs = require('fs')
const path = require('path')
const SOURCE_DIR = path.join(__dirname, '..', 'src')
const DIST_DIR = path.join(__dirname, '..', 'dist')
const MINIFY_JS = false
const CHARSET = 'utf-8'
const banner = fs.readFileSync(path.join(SOURCE_DIR, 'banner.txt'), CHARSET)
const babelConfig = JSON.parse(fs.readFileSync('../.babelrc', CHARSET))

buildJS()
buildTemplate()

function buildTemplate() {
  let content = fs.readFileSync(
    path.join(SOURCE_DIR, 'directory.html'),
    CHARSET
  )
  content = content.replace(/>\s*</g, '><')
  fs.writeFileSync(path.join(DIST_DIR, 'directory.html'), content)
}

function buildJS() {
  const files = [
    'index.js',
    'default-options.js',
    'serve-directory.js',
    'connection.js',
    'utils.js'
  ]

  files.forEach(function(file) {
    let code = fs.readFileSync(path.join(SOURCE_DIR, file), CHARSET)
    code = babel.transform(code, babelConfig).code
    if (MINIFY_JS) {
      code = babel.transform(code, {
        presets: [['minify']]
      }).code
    } else {
      code = prettier.format(
        code,
        prettier.resolveConfig.sync('prettier.config.js')
      )
    }
    fs.writeFileSync(path.join(DIST_DIR, file), banner + code)
  })
}
