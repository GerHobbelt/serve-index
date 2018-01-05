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
"use strict";var _createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var _=require("./utils.js"),Connection=require("./connection.js"),defaultOptions=require("./default-options.js");function responser(a,b){return function(c,d,e){var f=b(e);d.setHeader("X-Content-Type-Options","nosniff"),d.setHeader("Content-Type",a+"; charset="+_.CHARSET),d.setHeader("Content-Length",Buffer.byteLength(f,_.CHARSET)),d.end(f,_.CHARSET)}}var ServeDirectory=function(){function a(b,c){_classCallCheck(this,a);try{b=_.path.normalize(_.path.resolve(b)+_.path.sep),_.fs.statSync(b)}catch(a){throw a}this.root=b,this.responser={},this.options={useRelativeUrl:defaultOptions.useRelativeUrl},this.imports=Object.assign({},_),this.config(defaultOptions),c&&this.config(c)}return _createClass(a,[{key:"config",value:function(a){var b=this;a.showHiddenFiles&&(b.options.showHiddenFiles=!0),!1===a.useRelativeUrl&&(b.options.useRelativeUrl=!1),a.imports&&Object.assign(b.imports,a.imports),a.process&&a.process.filter(Boolean).forEach(function(a){a.accept.split(",").map(_.trim).filter(Boolean).forEach(function(c){a.render?b.responser[c]=responser(c,_.template(a.render,{imports:b.imports})):delete b.responser[c]})})}},{key:"middleware",value:function(a,b,c){try{return new Connection(this,a,b,c).response()}catch(a){c(a)}}}]),a}();module.exports=ServeDirectory;