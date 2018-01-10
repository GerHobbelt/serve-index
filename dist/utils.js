/*!
 * serve-index
 * Copyright(c) 2011 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 */
/*!
 *
 * serve-directory
 * Copyright(c) 2017- fisker Cheung
 * MIT Licensed
 */
'use strict';Object.defineProperty(exports,'__esModule',{value:!0});var _package=require('../package.json'),_package2=_interopRequireDefault(_package),_lodash=require('lodash.template'),_lodash2=_interopRequireDefault(_lodash),_parseurl=require('parseurl'),_parseurl2=_interopRequireDefault(_parseurl),_mimeTypes=require('mime-types'),_debug=require('debug'),_debug2=_interopRequireDefault(_debug);function _interopRequireDefault(a){return a&&a.__esModule?a:{default:a}}var nativeToString=Object.prototype.toString,nativeTrim=String.prototype.trim,path=require('path'),fs=require('fs'),CHARSET='utf-8',debug=(0,_debug2.default)(_package2.default.name),_={CHARSET:CHARSET,path:path,fs:fs,noop:noop,identity:identity,type:type,directoryFirst:directoryFirst,sortBy:sortBy,notHidden:notHidden,sortFile:sortFile,trim:trim,template:template,mime:mime,parseUrl:_parseurl2.default,read:read,pkg:_package2.default,debug:debug};function noop(){}function identity(a){return a}function type(a){return nativeToString.call(a).slice(8,-1)}function directoryFirst(c,a){return a.isDirectory()-c.isDirectory()}function notHidden(a){return'.'!==a.name.slice(0,1)}function sortBy(c){return function(d,a){return a[c]===d[c]?0:a[c]<d[c]?1:-1}}function sortFile(c,a){return directoryFirst(c,a)||sortBy('name')(c,a)}function trim(a){return nativeTrim.call(a)}function read(a){try{return fs.readFileSync(path.resolve(a),CHARSET)}catch(a){return''}}function template(a,b){var c=type(a);if('Function'===c)return a;return'String'===c?(a=read(a)||a,(0,_lodash2.default)(a,b||{imports:_})):identity}function mime(a){return(0,_mimeTypes.lookup)(a)||''}exports.default=_,module.exports=exports['default'];