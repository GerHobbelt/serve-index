const _ = require('./utils.js')

module.exports = {
  showHiddenFiles: false,
  useRelativeUrl: true,
  process: [
    {
      accept: 'text/html',
      template: _.path.join(__dirname, '../template/directory.html')
    },
    {
      accept: 'text/plain',
      template(data) {
        return data.files.map(file => file.name).join('\n') + '\n'
      }
    },
    {
      accept: 'application/json',
      template(data) {
        return JSON.stringify(data.files.map(file => file.name))
      }
    }
  ]
}