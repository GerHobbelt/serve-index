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
'use strict';Object.defineProperty(exports,'__esModule',{value:!0});var _utils=require('./utils.js'),_utils2=_interopRequireDefault(_utils);function _interopRequireDefault(a){return a&&a.__esModule?a:{default:a}}exports.default={hidden:!1,relative:!0,process:[{accept:'text/html',render:_utils2.default.path.join(__dirname,'directory.html')},{accept:'text/plain',render:function(a){return a.files.map(function(a){return a.name}).join('\n')+'\n'}},{accept:'application/json',render:function(a){return JSON.stringify(a.files.map(function(a){return a.name}))}}]},module.exports=exports['default'];