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
'use strict';Object.defineProperty(exports,'__esModule',{value:!0}),exports.default=serveDirectory;var _serveDirectory=require('./serve-directory.js'),_serveDirectory2=_interopRequireDefault(_serveDirectory);function _interopRequireDefault(a){return a&&a.__esModule?a:{default:a}}function serveDirectory(a,b){var c=new _serveDirectory2.default(a,b);return c.middleware.bind(c)}module.exports=exports['default'];