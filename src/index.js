const ServeDirectory = require('./serve-directory.js')

module.exports = function serveDirectory(root, options) {
  const sd = new ServeDirectory(root, options)
  return sd.middleware.bind(sd)
}