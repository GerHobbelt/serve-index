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
'use strict';var _=require('./utils.js');module.exports={showHiddenFiles:!1,useRelativeUrl:!0,process:[{accept:'text/html',render:_.path.join(__dirname,'directory.html')},{accept:'text/plain',render:function(a){return a.files.map(function(a){return a.name}).join('\n')+'\n'}},{accept:'application/json',render:function(a){return JSON.stringify(a.files.map(function(a){return a.name}))}}]};