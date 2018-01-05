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
'use strict';var ServeDirectory=require('./serve-directory.js');module.exports=function(a,b){var c=new ServeDirectory(a,b);return c.middleware.bind(c)};