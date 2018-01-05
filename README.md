# serve-directory

  Serves pages that contain directory listings for a given path. forked from expressjs/serve-directory


## Install

```sh
$ npm install serve-directory
```

## ustage

```js
const serveDirectory = require('serve-directory')

const directory = serveDirectory('wwwroot', options)
```

### serveDirectory(path, options)

Returns middlware that serves an index of the directory in the given `path`.

The `path` is based off the `req.url` value, so a `req.url` of `'/some/dir`
with a `path` of `'public'` will look at `'public/some/dir'`. If you are using
something like `express`, you can change the URL "base" with `app.use` (see
the express example).

### Options

serveDirectory accepts these properties in the options object.

### example (default)
```js
{
  imports: {},
  hidden: true,
  relative: true,
  process: [
    {
      accept: 'text/html',
      render: _.path.join(__dirname, 'directory.html')
    },
    {
      accept: 'text/plain',
      render(data) {
        return data.files.map(file => file.name).join('\n') + '\n'
      }
    },
    {
      accept: 'application/json',
      render(data) {
        return JSON.stringify(data.files.map(file => file.name))
      }
    }
  ]
}
```
### imports
functions will pass to render function, see [lodash.template](https://lodash.com/docs/4.17.4#template)

by default some usful functions will import automatically

see [utils.js](https://github.com/fisker/serve-directory/tree/master/src/utils.js)

### hidden
hide hidden files(file/folder start with ".") , default `true`.

### relative
use relative url , default `true`.

### process
array list how data should be handled

#### accept
mime split with `,`, space will be trimed

### render
by default we use a compiled lodash.template function to render data

see [lodash.template](https://lodash.com/docs/4.17.4#template)

#### string

  a path to a template file
  a template string


#### function
  a custom render function

#### falsy value
  remove default render function

### data
data pass to the render function

path(String):
  physical path

pathname(String):
  decoded request pathname

url(URL):
  request URL object

method(String):
  request method

responseType(String):
  response mine-type / content-type

directory(Array<fs.Stats>):
  directory stats with additional info `path` `pathname` `url`

files(Array<fs.Stats>):
  directory files stats with additional info `name` `ext` `type` `url`


### Serve directory indexes with vanilla node.js http server
 see [example.js](https://github.com/fisker/serve-directory/tree/master/example.js)

## License

MIT © [fisker Cheung](https://github.com/fisker)