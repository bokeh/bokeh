/*! jQuery v1.7.2 jquery.com | jquery.org/license */
(function(a,b){function cy(a){return f.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}function cu(a){if(!cj[a]){var b=c.body,d=f("<"+a+">").appendTo(b),e=d.css("display");d.remove();if(e==="none"||e===""){ck||(ck=c.createElement("iframe"),ck.frameBorder=ck.width=ck.height=0),b.appendChild(ck);if(!cl||!ck.createElement)cl=(ck.contentWindow||ck.contentDocument).document,cl.write((f.support.boxModel?"<!doctype html>":"")+"<html><body>"),cl.close();d=cl.createElement(a),cl.body.appendChild(d),e=f.css(d,"display"),b.removeChild(ck)}cj[a]=e}return cj[a]}function ct(a,b){var c={};f.each(cp.concat.apply([],cp.slice(0,b)),function(){c[this]=a});return c}function cs(){cq=b}function cr(){setTimeout(cs,0);return cq=f.now()}function ci(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function ch(){try{return new a.XMLHttpRequest}catch(b){}}function cb(a,c){a.dataFilter&&(c=a.dataFilter(c,a.dataType));var d=a.dataTypes,e={},g,h,i=d.length,j,k=d[0],l,m,n,o,p;for(g=1;g<i;g++){if(g===1)for(h in a.converters)typeof h=="string"&&(e[h.toLowerCase()]=a.converters[h]);l=k,k=d[g];if(k==="*")k=l;else if(l!=="*"&&l!==k){m=l+" "+k,n=e[m]||e["* "+k];if(!n){p=b;for(o in e){j=o.split(" ");if(j[0]===l||j[0]==="*"){p=e[j[1]+" "+k];if(p){o=e[o],o===!0?n=p:p===!0&&(n=o);break}}}}!n&&!p&&f.error("No conversion from "+m.replace(" "," to ")),n!==!0&&(c=n?n(c):p(o(c)))}}return c}function ca(a,c,d){var e=a.contents,f=a.dataTypes,g=a.responseFields,h,i,j,k;for(i in g)i in d&&(c[g[i]]=d[i]);while(f[0]==="*")f.shift(),h===b&&(h=a.mimeType||c.getResponseHeader("content-type"));if(h)for(i in e)if(e[i]&&e[i].test(h)){f.unshift(i);break}if(f[0]in d)j=f[0];else{for(i in d){if(!f[0]||a.converters[i+" "+f[0]]){j=i;break}k||(k=i)}j=j||k}if(j){j!==f[0]&&f.unshift(j);return d[j]}}function b_(a,b,c,d){if(f.isArray(b))f.each(b,function(b,e){c||bD.test(a)?d(a,e):b_(a+"["+(typeof e=="object"?b:"")+"]",e,c,d)});else if(!c&&f.type(b)==="object")for(var e in b)b_(a+"["+e+"]",b[e],c,d);else d(a,b)}function b$(a,c){var d,e,g=f.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((g[d]?a:e||(e={}))[d]=c[d]);e&&f.extend(!0,a,e)}function bZ(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h=a[f],i=0,j=h?h.length:0,k=a===bS,l;for(;i<j&&(k||!l);i++)l=h[i](c,d,e),typeof l=="string"&&(!k||g[l]?l=b:(c.dataTypes.unshift(l),l=bZ(a,c,d,e,l,g)));(k||!l)&&!g["*"]&&(l=bZ(a,c,d,e,"*",g));return l}function bY(a){return function(b,c){typeof b!="string"&&(c=b,b="*");if(f.isFunction(c)){var d=b.toLowerCase().split(bO),e=0,g=d.length,h,i,j;for(;e<g;e++)h=d[e],j=/^\+/.test(h),j&&(h=h.substr(1)||"*"),i=a[h]=a[h]||[],i[j?"unshift":"push"](c)}}}function bB(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=b==="width"?1:0,g=4;if(d>0){if(c!=="border")for(;e<g;e+=2)c||(d-=parseFloat(f.css(a,"padding"+bx[e]))||0),c==="margin"?d+=parseFloat(f.css(a,c+bx[e]))||0:d-=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0;return d+"px"}d=by(a,b);if(d<0||d==null)d=a.style[b];if(bt.test(d))return d;d=parseFloat(d)||0;if(c)for(;e<g;e+=2)d+=parseFloat(f.css(a,"padding"+bx[e]))||0,c!=="padding"&&(d+=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0),c==="margin"&&(d+=parseFloat(f.css(a,c+bx[e]))||0);return d+"px"}function bo(a){var b=c.createElement("div");bh.appendChild(b),b.innerHTML=a.outerHTML;return b.firstChild}function bn(a){var b=(a.nodeName||"").toLowerCase();b==="input"?bm(a):b!=="script"&&typeof a.getElementsByTagName!="undefined"&&f.grep(a.getElementsByTagName("input"),bm)}function bm(a){if(a.type==="checkbox"||a.type==="radio")a.defaultChecked=a.checked}function bl(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]}function bk(a,b){var c;b.nodeType===1&&(b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase(),c==="object"?b.outerHTML=a.outerHTML:c!=="input"||a.type!=="checkbox"&&a.type!=="radio"?c==="option"?b.selected=a.defaultSelected:c==="input"||c==="textarea"?b.defaultValue=a.defaultValue:c==="script"&&b.text!==a.text&&(b.text=a.text):(a.checked&&(b.defaultChecked=b.checked=a.checked),b.value!==a.value&&(b.value=a.value)),b.removeAttribute(f.expando),b.removeAttribute("_submit_attached"),b.removeAttribute("_change_attached"))}function bj(a,b){if(b.nodeType===1&&!!f.hasData(a)){var c,d,e,g=f._data(a),h=f._data(b,g),i=g.events;if(i){delete h.handle,h.events={};for(c in i)for(d=0,e=i[c].length;d<e;d++)f.event.add(b,c,i[c][d])}h.data&&(h.data=f.extend({},h.data))}}function bi(a,b){return f.nodeName(a,"table")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function U(a){var b=V.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}function T(a,b,c){b=b||0;if(f.isFunction(b))return f.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return f.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){var d=f.grep(a,function(a){return a.nodeType===1});if(O.test(b))return f.filter(b,d,!c);b=f.filter(b,d)}return f.grep(a,function(a,d){return f.inArray(a,b)>=0===c})}function S(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function K(){return!0}function J(){return!1}function n(a,b,c){var d=b+"defer",e=b+"queue",g=b+"mark",h=f._data(a,d);h&&(c==="queue"||!f._data(a,e))&&(c==="mark"||!f._data(a,g))&&setTimeout(function(){!f._data(a,e)&&!f._data(a,g)&&(f.removeData(a,d,!0),h.fire())},0)}function m(a){for(var b in a){if(b==="data"&&f.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1}return!0}function l(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(k,"-$1").toLowerCase();d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:f.isNumeric(d)?+d:j.test(d)?f.parseJSON(d):d}catch(g){}f.data(a,c,d)}else d=b}return d}function h(a){var b=g[a]={},c,d;a=a.split(/\s+/);for(c=0,d=a.length;c<d;c++)b[a[c]]=!0;return b}var c=a.document,d=a.navigator,e=a.location,f=function(){function J(){if(!e.isReady){try{c.documentElement.doScroll("left")}catch(a){setTimeout(J,1);return}e.ready()}}var e=function(a,b){return new e.fn.init(a,b,h)},f=a.jQuery,g=a.$,h,i=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,j=/\S/,k=/^\s+/,l=/\s+$/,m=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,n=/^[\],:{}\s]*$/,o=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,p=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,q=/(?:^|:|,)(?:\s*\[)+/g,r=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,t=/(msie) ([\w.]+)/,u=/(mozilla)(?:.*? rv:([\w.]+))?/,v=/-([a-z]|[0-9])/ig,w=/^-ms-/,x=function(a,b){return(b+"").toUpperCase()},y=d.userAgent,z,A,B,C=Object.prototype.toString,D=Object.prototype.hasOwnProperty,E=Array.prototype.push,F=Array.prototype.slice,G=String.prototype.trim,H=Array.prototype.indexOf,I={};e.fn=e.prototype={constructor:e,init:function(a,d,f){var g,h,j,k;if(!a)return this;if(a.nodeType){this.context=this[0]=a,this.length=1;return this}if(a==="body"&&!d&&c.body){this.context=c,this[0]=c.body,this.selector=a,this.length=1;return this}if(typeof a=="string"){a.charAt(0)!=="<"||a.charAt(a.length-1)!==">"||a.length<3?g=i.exec(a):g=[null,a,null];if(g&&(g[1]||!d)){if(g[1]){d=d instanceof e?d[0]:d,k=d?d.ownerDocument||d:c,j=m.exec(a),j?e.isPlainObject(d)?(a=[c.createElement(j[1])],e.fn.attr.call(a,d,!0)):a=[k.createElement(j[1])]:(j=e.buildFragment([g[1]],[k]),a=(j.cacheable?e.clone(j.fragment):j.fragment).childNodes);return e.merge(this,a)}h=c.getElementById(g[2]);if(h&&h.parentNode){if(h.id!==g[2])return f.find(a);this.length=1,this[0]=h}this.context=c,this.selector=a;return this}return!d||d.jquery?(d||f).find(a):this.constructor(d).find(a)}if(e.isFunction(a))return f.ready(a);a.selector!==b&&(this.selector=a.selector,this.context=a.context);return e.makeArray(a,this)},selector:"",jquery:"1.7.2",length:0,size:function(){return this.length},toArray:function(){return F.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=this.constructor();e.isArray(a)?E.apply(d,a):e.merge(d,a),d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")");return d},each:function(a,b){return e.each(this,a,b)},ready:function(a){e.bindReady(),A.add(a);return this},eq:function(a){a=+a;return a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(F.apply(this,arguments),"slice",F.call(arguments).join(","))},map:function(a){return this.pushStack(e.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:E,sort:[].sort,splice:[].splice},e.fn.init.prototype=e.fn,e.extend=e.fn.extend=function(){var a,c,d,f,g,h,i=arguments[0]||{},j=1,k=arguments.length,l=!1;typeof i=="boolean"&&(l=i,i=arguments[1]||{},j=2),typeof i!="object"&&!e.isFunction(i)&&(i={}),k===j&&(i=this,--j);for(;j<k;j++)if((a=arguments[j])!=null)for(c in a){d=i[c],f=a[c];if(i===f)continue;l&&f&&(e.isPlainObject(f)||(g=e.isArray(f)))?(g?(g=!1,h=d&&e.isArray(d)?d:[]):h=d&&e.isPlainObject(d)?d:{},i[c]=e.extend(l,h,f)):f!==b&&(i[c]=f)}return i},e.extend({noConflict:function(b){a.$===e&&(a.$=g),b&&a.jQuery===e&&(a.jQuery=f);return e},isReady:!1,readyWait:1,holdReady:function(a){a?e.readyWait++:e.ready(!0)},ready:function(a){if(a===!0&&!--e.readyWait||a!==!0&&!e.isReady){if(!c.body)return setTimeout(e.ready,1);e.isReady=!0;if(a!==!0&&--e.readyWait>0)return;A.fireWith(c,[e]),e.fn.trigger&&e(c).trigger("ready").off("ready")}},bindReady:function(){if(!A){A=e.Callbacks("once memory");if(c.readyState==="complete")return setTimeout(e.ready,1);if(c.addEventListener)c.addEventListener("DOMContentLoaded",B,!1),a.addEventListener("load",e.ready,!1);else if(c.attachEvent){c.attachEvent("onreadystatechange",B),a.attachEvent("onload",e.ready);var b=!1;try{b=a.frameElement==null}catch(d){}c.documentElement.doScroll&&b&&J()}}},isFunction:function(a){return e.type(a)==="function"},isArray:Array.isArray||function(a){return e.type(a)==="array"},isWindow:function(a){return a!=null&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):I[C.call(a)]||"object"},isPlainObject:function(a){if(!a||e.type(a)!=="object"||a.nodeType||e.isWindow(a))return!1;try{if(a.constructor&&!D.call(a,"constructor")&&!D.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||D.call(a,d)},isEmptyObject:function(a){for(var b in a)return!1;return!0},error:function(a){throw new Error(a)},parseJSON:function(b){if(typeof b!="string"||!b)return null;b=e.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(n.test(b.replace(o,"@").replace(p,"]").replace(q,"")))return(new Function("return "+b))();e.error("Invalid JSON: "+b)},parseXML:function(c){if(typeof c!="string"||!c)return null;var d,f;try{a.DOMParser?(f=new DOMParser,d=f.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(g){d=b}(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&e.error("Invalid XML: "+c);return d},noop:function(){},globalEval:function(b){b&&j.test(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(w,"ms-").replace(v,x)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,c,d){var f,g=0,h=a.length,i=h===b||e.isFunction(a);if(d){if(i){for(f in a)if(c.apply(a[f],d)===!1)break}else for(;g<h;)if(c.apply(a[g++],d)===!1)break}else if(i){for(f in a)if(c.call(a[f],f,a[f])===!1)break}else for(;g<h;)if(c.call(a[g],g,a[g++])===!1)break;return a},trim:G?function(a){return a==null?"":G.call(a)}:function(a){return a==null?"":(a+"").replace(k,"").replace(l,"")},makeArray:function(a,b){var c=b||[];if(a!=null){var d=e.type(a);a.length==null||d==="string"||d==="function"||d==="regexp"||e.isWindow(a)?E.call(c,a):e.merge(c,a)}return c},inArray:function(a,b,c){var d;if(b){if(H)return H.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=a.length,e=0;if(typeof c.length=="number")for(var f=c.length;e<f;e++)a[d++]=c[e];else while(c[e]!==b)a[d++]=c[e++];a.length=d;return a},grep:function(a,b,c){var d=[],e;c=!!c;for(var f=0,g=a.length;f<g;f++)e=!!b(a[f],f),c!==e&&d.push(a[f]);return d},map:function(a,c,d){var f,g,h=[],i=0,j=a.length,k=a instanceof e||j!==b&&typeof j=="number"&&(j>0&&a[0]&&a[j-1]||j===0||e.isArray(a));if(k)for(;i<j;i++)f=c(a[i],i,d),f!=null&&(h[h.length]=f);else for(g in a)f=c(a[g],g,d),f!=null&&(h[h.length]=f);return h.concat.apply([],h)},guid:1,proxy:function(a,c){if(typeof c=="string"){var d=a[c];c=a,a=d}if(!e.isFunction(a))return b;var f=F.call(arguments,2),g=function(){return a.apply(c,f.concat(F.call(arguments)))};g.guid=a.guid=a.guid||g.guid||e.guid++;return g},access:function(a,c,d,f,g,h,i){var j,k=d==null,l=0,m=a.length;if(d&&typeof d=="object"){for(l in d)e.access(a,c,l,d[l],1,h,f);g=1}else if(f!==b){j=i===b&&e.isFunction(f),k&&(j?(j=c,c=function(a,b,c){return j.call(e(a),c)}):(c.call(a,f),c=null));if(c)for(;l<m;l++)c(a[l],d,j?f.call(a[l],l,c(a[l],d)):f,i);g=1}return g?a:k?c.call(a):m?c(a[0],d):h},now:function(){return(new Date).getTime()},uaMatch:function(a){a=a.toLowerCase();var b=r.exec(a)||s.exec(a)||t.exec(a)||a.indexOf("compatible")<0&&u.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},sub:function(){function a(b,c){return new a.fn.init(b,c)}e.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function(d,f){f&&f instanceof e&&!(f instanceof a)&&(f=a(f));return e.fn.init.call(this,d,f,b)},a.fn.init.prototype=a.fn;var b=a(c);return a},browser:{}}),e.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){I["[object "+b+"]"]=b.toLowerCase()}),z=e.uaMatch(y),z.browser&&(e.browser[z.browser]=!0,e.browser.version=z.version),e.browser.webkit&&(e.browser.safari=!0),j.test(" ")&&(k=/^[\s\xA0]+/,l=/[\s\xA0]+$/),h=e(c),c.addEventListener?B=function(){c.removeEventListener("DOMContentLoaded",B,!1),e.ready()}:c.attachEvent&&(B=function(){c.readyState==="complete"&&(c.detachEvent("onreadystatechange",B),e.ready())});return e}(),g={};f.Callbacks=function(a){a=a?g[a]||h(a):{};var c=[],d=[],e,i,j,k,l,m,n=function(b){var d,e,g,h,i;for(d=0,e=b.length;d<e;d++)g=b[d],h=f.type(g),h==="array"?n(g):h==="function"&&(!a.unique||!p.has(g))&&c.push(g)},o=function(b,f){f=f||[],e=!a.memory||[b,f],i=!0,j=!0,m=k||0,k=0,l=c.length;for(;c&&m<l;m++)if(c[m].apply(b,f)===!1&&a.stopOnFalse){e=!0;break}j=!1,c&&(a.once?e===!0?p.disable():c=[]:d&&d.length&&(e=d.shift(),p.fireWith(e[0],e[1])))},p={add:function(){if(c){var a=c.length;n(arguments),j?l=c.length:e&&e!==!0&&(k=a,o(e[0],e[1]))}return this},remove:function(){if(c){var b=arguments,d=0,e=b.length;for(;d<e;d++)for(var f=0;f<c.length;f++)if(b[d]===c[f]){j&&f<=l&&(l--,f<=m&&m--),c.splice(f--,1);if(a.unique)break}}return this},has:function(a){if(c){var b=0,d=c.length;for(;b<d;b++)if(a===c[b])return!0}return!1},empty:function(){c=[];return this},disable:function(){c=d=e=b;return this},disabled:function(){return!c},lock:function(){d=b,(!e||e===!0)&&p.disable();return this},locked:function(){return!d},fireWith:function(b,c){d&&(j?a.once||d.push([b,c]):(!a.once||!e)&&o(b,c));return this},fire:function(){p.fireWith(this,arguments);return this},fired:function(){return!!i}};return p};var i=[].slice;f.extend({Deferred:function(a){var b=f.Callbacks("once memory"),c=f.Callbacks("once memory"),d=f.Callbacks("memory"),e="pending",g={resolve:b,reject:c,notify:d},h={done:b.add,fail:c.add,progress:d.add,state:function(){return e},isResolved:b.fired,isRejected:c.fired,then:function(a,b,c){i.done(a).fail(b).progress(c);return this},always:function(){i.done.apply(i,arguments).fail.apply(i,arguments);return this},pipe:function(a,b,c){return f.Deferred(function(d){f.each({done:[a,"resolve"],fail:[b,"reject"],progress:[c,"notify"]},function(a,b){var c=b[0],e=b[1],g;f.isFunction(c)?i[a](function(){g=c.apply(this,arguments),g&&f.isFunction(g.promise)?g.promise().then(d.resolve,d.reject,d.notify):d[e+"With"](this===i?d:this,[g])}):i[a](d[e])})}).promise()},promise:function(a){if(a==null)a=h;else for(var b in h)a[b]=h[b];return a}},i=h.promise({}),j;for(j in g)i[j]=g[j].fire,i[j+"With"]=g[j].fireWith;i.done(function(){e="resolved"},c.disable,d.lock).fail(function(){e="rejected"},b.disable,d.lock),a&&a.call(i,i);return i},when:function(a){function m(a){return function(b){e[a]=arguments.length>1?i.call(arguments,0):b,j.notifyWith(k,e)}}function l(a){return function(c){b[a]=arguments.length>1?i.call(arguments,0):c,--g||j.resolveWith(j,b)}}var b=i.call(arguments,0),c=0,d=b.length,e=Array(d),g=d,h=d,j=d<=1&&a&&f.isFunction(a.promise)?a:f.Deferred(),k=j.promise();if(d>1){for(;c<d;c++)b[c]&&b[c].promise&&f.isFunction(b[c].promise)?b[c].promise().then(l(c),j.reject,m(c)):--g;g||j.resolveWith(j,b)}else j!==a&&j.resolveWith(j,d?[a]:[]);return k}}),f.support=function(){var b,d,e,g,h,i,j,k,l,m,n,o,p=c.createElement("div"),q=c.documentElement;p.setAttribute("className","t"),p.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>",d=p.getElementsByTagName("*"),e=p.getElementsByTagName("a")[0];if(!d||!d.length||!e)return{};g=c.createElement("select"),h=g.appendChild(c.createElement("option")),i=p.getElementsByTagName("input")[0],b={leadingWhitespace:p.firstChild.nodeType===3,tbody:!p.getElementsByTagName("tbody").length,htmlSerialize:!!p.getElementsByTagName("link").length,style:/top/.test(e.getAttribute("style")),hrefNormalized:e.getAttribute("href")==="/a",opacity:/^0.55/.test(e.style.opacity),cssFloat:!!e.style.cssFloat,checkOn:i.value==="on",optSelected:h.selected,getSetAttribute:p.className!=="t",enctype:!!c.createElement("form").enctype,html5Clone:c.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,pixelMargin:!0},f.boxModel=b.boxModel=c.compatMode==="CSS1Compat",i.checked=!0,b.noCloneChecked=i.cloneNode(!0).checked,g.disabled=!0,b.optDisabled=!h.disabled;try{delete p.test}catch(r){b.deleteExpando=!1}!p.addEventListener&&p.attachEvent&&p.fireEvent&&(p.attachEvent("onclick",function(){b.noCloneEvent=!1}),p.cloneNode(!0).fireEvent("onclick")),i=c.createElement("input"),i.value="t",i.setAttribute("type","radio"),b.radioValue=i.value==="t",i.setAttribute("checked","checked"),i.setAttribute("name","t"),p.appendChild(i),j=c.createDocumentFragment(),j.appendChild(p.lastChild),b.checkClone=j.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=i.checked,j.removeChild(i),j.appendChild(p);if(p.attachEvent)for(n in{submit:1,change:1,focusin:1})m="on"+n,o=m in p,o||(p.setAttribute(m,"return;"),o=typeof p[m]=="function"),b[n+"Bubbles"]=o;j.removeChild(p),j=g=h=p=i=null,f(function(){var d,e,g,h,i,j,l,m,n,q,r,s,t,u=c.getElementsByTagName("body")[0];!u||(m=1,t="padding:0;margin:0;border:",r="position:absolute;top:0;left:0;width:1px;height:1px;",s=t+"0;visibility:hidden;",n="style='"+r+t+"5px solid #000;",q="<div "+n+"display:block;'><div style='"+t+"0;display:block;overflow:hidden;'></div></div>"+"<table "+n+"' cellpadding='0' cellspacing='0'>"+"<tr><td></td></tr></table>",d=c.createElement("div"),d.style.cssText=s+"width:0;height:0;position:static;top:0;margin-top:"+m+"px",u.insertBefore(d,u.firstChild),p=c.createElement("div"),d.appendChild(p),p.innerHTML="<table><tr><td style='"+t+"0;display:none'></td><td>t</td></tr></table>",k=p.getElementsByTagName("td"),o=k[0].offsetHeight===0,k[0].style.display="",k[1].style.display="none",b.reliableHiddenOffsets=o&&k[0].offsetHeight===0,a.getComputedStyle&&(p.innerHTML="",l=c.createElement("div"),l.style.width="0",l.style.marginRight="0",p.style.width="2px",p.appendChild(l),b.reliableMarginRight=(parseInt((a.getComputedStyle(l,null)||{marginRight:0}).marginRight,10)||0)===0),typeof p.style.zoom!="undefined"&&(p.innerHTML="",p.style.width=p.style.padding="1px",p.style.border=0,p.style.overflow="hidden",p.style.display="inline",p.style.zoom=1,b.inlineBlockNeedsLayout=p.offsetWidth===3,p.style.display="block",p.style.overflow="visible",p.innerHTML="<div style='width:5px;'></div>",b.shrinkWrapBlocks=p.offsetWidth!==3),p.style.cssText=r+s,p.innerHTML=q,e=p.firstChild,g=e.firstChild,i=e.nextSibling.firstChild.firstChild,j={doesNotAddBorder:g.offsetTop!==5,doesAddBorderForTableAndCells:i.offsetTop===5},g.style.position="fixed",g.style.top="20px",j.fixedPosition=g.offsetTop===20||g.offsetTop===15,g.style.position=g.style.top="",e.style.overflow="hidden",e.style.position="relative",j.subtractsBorderForOverflowNotVisible=g.offsetTop===-5,j.doesNotIncludeMarginInBodyOffset=u.offsetTop!==m,a.getComputedStyle&&(p.style.marginTop="1%",b.pixelMargin=(a.getComputedStyle(p,null)||{marginTop:0}).marginTop!=="1%"),typeof d.style.zoom!="undefined"&&(d.style.zoom=1),u.removeChild(d),l=p=d=null,f.extend(b,j))});return b}();var j=/^(?:\{.*\}|\[.*\])$/,k=/([A-Z])/g;f.extend({cache:{},uuid:0,expando:"jQuery"+(f.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){a=a.nodeType?f.cache[a[f.expando]]:a[f.expando];return!!a&&!m(a)},data:function(a,c,d,e){if(!!f.acceptData(a)){var g,h,i,j=f.expando,k=typeof c=="string",l=a.nodeType,m=l?f.cache:a,n=l?a[j]:a[j]&&j,o=c==="events";if((!n||!m[n]||!o&&!e&&!m[n].data)&&k&&d===b)return;n||(l?a[j]=n=++f.uuid:n=j),m[n]||(m[n]={},l||(m[n].toJSON=f.noop));if(typeof c=="object"||typeof c=="function")e?m[n]=f.extend(m[n],c):m[n].data=f.extend(m[n].data,c);g=h=m[n],e||(h.data||(h.data={}),h=h.data),d!==b&&(h[f.camelCase(c)]=d);if(o&&!h[c])return g.events;k?(i=h[c],i==null&&(i=h[f.camelCase(c)])):i=h;return i}},removeData:function(a,b,c){if(!!f.acceptData(a)){var d,e,g,h=f.expando,i=a.nodeType,j=i?f.cache:a,k=i?a[h]:h;if(!j[k])return;if(b){d=c?j[k]:j[k].data;if(d){f.isArray(b)||(b in d?b=[b]:(b=f.camelCase(b),b in d?b=[b]:b=b.split(" ")));for(e=0,g=b.length;e<g;e++)delete d[b[e]];if(!(c?m:f.isEmptyObject)(d))return}}if(!c){delete j[k].data;if(!m(j[k]))return}f.support.deleteExpando||!j.setInterval?delete j[k]:j[k]=null,i&&(f.support.deleteExpando?delete a[h]:a.removeAttribute?a.removeAttribute(h):a[h]=null)}},_data:function(a,b,c){return f.data(a,b,c,!0)},acceptData:function(a){if(a.nodeName){var b=f.noData[a.nodeName.toLowerCase()];if(b)return b!==!0&&a.getAttribute("classid")===b}return!0}}),f.fn.extend({data:function(a,c){var d,e,g,h,i,j=this[0],k=0,m=null;if(a===b){if(this.length){m=f.data(j);if(j.nodeType===1&&!f._data(j,"parsedAttrs")){g=j.attributes;for(i=g.length;k<i;k++)h=g[k].name,h.indexOf("data-")===0&&(h=f.camelCase(h.substring(5)),l(j,h,m[h]));f._data(j,"parsedAttrs",!0)}}return m}if(typeof a=="object")return this.each(function(){f.data(this,a)});d=a.split(".",2),d[1]=d[1]?"."+d[1]:"",e=d[1]+"!";return f.access(this,function(c){if(c===b){m=this.triggerHandler("getData"+e,[d[0]]),m===b&&j&&(m=f.data(j,a),m=l(j,a,m));return m===b&&d[1]?this.data(d[0]):m}d[1]=c,this.each(function(){var b=f(this);b.triggerHandler("setData"+e,d),f.data(this,a,c),b.triggerHandler("changeData"+e,d)})},null,c,arguments.length>1,null,!1)},removeData:function(a){return this.each(function(){f.removeData(this,a)})}}),f.extend({_mark:function(a,b){a&&(b=(b||"fx")+"mark",f._data(a,b,(f._data(a,b)||0)+1))},_unmark:function(a,b,c){a!==!0&&(c=b,b=a,a=!1);if(b){c=c||"fx";var d=c+"mark",e=a?0:(f._data(b,d)||1)-1;e?f._data(b,d,e):(f.removeData(b,d,!0),n(b,c,"mark"))}},queue:function(a,b,c){var d;if(a){b=(b||"fx")+"queue",d=f._data(a,b),c&&(!d||f.isArray(c)?d=f._data(a,b,f.makeArray(c)):d.push(c));return d||[]}},dequeue:function(a,b){b=b||"fx";var c=f.queue(a,b),d=c.shift(),e={};d==="inprogress"&&(d=c.shift()),d&&(b==="fx"&&c.unshift("inprogress"),f._data(a,b+".run",e),d.call(a,function(){f.dequeue(a,b)},e)),c.length||(f.removeData(a,b+"queue "+b+".run",!0),n(a,b,"queue"))}}),f.fn.extend({queue:function(a,c){var d=2;typeof a!="string"&&(c=a,a="fx",d--);if(arguments.length<d)return f.queue(this[0],a);return c===b?this:this.each(function(){var b=f.queue(this,a,c);a==="fx"&&b[0]!=="inprogress"&&f.dequeue(this,a)})},dequeue:function(a){return this.each(function(){f.dequeue(this,a)})},delay:function(a,b){a=f.fx?f.fx.speeds[a]||a:a,b=b||"fx";return this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){function m(){--h||d.resolveWith(e,[e])}typeof a!="string"&&(c=a,a=b),a=a||"fx";var d=f.Deferred(),e=this,g=e.length,h=1,i=a+"defer",j=a+"queue",k=a+"mark",l;while(g--)if(l=f.data(e[g],i,b,!0)||(f.data(e[g],j,b,!0)||f.data(e[g],k,b,!0))&&f.data(e[g],i,f.Callbacks("once memory"),!0))h++,l.add(m);m();return d.promise(c)}});var o=/[\n\t\r]/g,p=/\s+/,q=/\r/g,r=/^(?:button|input)$/i,s=/^(?:button|input|object|select|textarea)$/i,t=/^a(?:rea)?$/i,u=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,v=f.support.getSetAttribute,w,x,y;f.fn.extend({attr:function(a,b){return f.access(this,f.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){f.removeAttr(this,a)})},prop:function(a,b){return f.access(this,f.prop,a,b,arguments.length>1)},removeProp:function(a){a=f.propFix[a]||a;return this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,g,h,i;if(f.isFunction(a))return this.each(function(b){f(this).addClass(a.call(this,b,this.className))});if(a&&typeof a=="string"){b=a.split(p);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{g=" "+e.className+" ";for(h=0,i=b.length;h<i;h++)~g.indexOf(" "+b[h]+" ")||(g+=b[h]+" ");e.className=f.trim(g)}}}return this},removeClass:function(a){var c,d,e,g,h,i,j;if(f.isFunction(a))return this.each(function(b){f(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(p);for(d=0,e=this.length;d<e;d++){g=this[d];if(g.nodeType===1&&g.className)if(a){h=(" "+g.className+" ").replace(o," ");for(i=0,j=c.length;i<j;i++)h=h.replace(" "+c[i]+" "," ");g.className=f.trim(h)}else g.className=""}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";if(f.isFunction(a))return this.each(function(c){f(this).toggleClass(a.call(this,c,this.className,b),b)});return this.each(function(){if(c==="string"){var e,g=0,h=f(this),i=b,j=a.split(p);while(e=j[g++])i=d?i:!h.hasClass(e),h[i?"addClass":"removeClass"](e)}else if(c==="undefined"||c==="boolean")this.className&&f._data(this,"__className__",this.className),this.className=this.className||a===!1?"":f._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(o," ").indexOf(b)>-1)return!0;return!1},val:function(a){var c,d,e,g=this[0];{if(!!arguments.length){e=f.isFunction(a);return this.each(function(d){var g=f(this),h;if(this.nodeType===1){e?h=a.call(this,d,g.val()):h=a,h==null?h="":typeof h=="number"?h+="":f.isArray(h)&&(h=f.map(h,function(a){return a==null?"":a+""})),c=f.valHooks[this.type]||f.valHooks[this.nodeName.toLowerCase()];if(!c||!("set"in c)||c.set(this,h,"value")===b)this.value=h}})}if(g){c=f.valHooks[g.type]||f.valHooks[g.nodeName.toLowerCase()];if(c&&"get"in c&&(d=c.get(g,"value"))!==b)return d;d=g.value;return typeof d=="string"?d.replace(q,""):d==null?"":d}}}}),f.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,g=a.selectedIndex,h=[],i=a.options,j=a.type==="select-one";if(g<0)return null;c=j?g:0,d=j?g+1:i.length;for(;c<d;c++){e=i[c];if(e.selected&&(f.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!f.nodeName(e.parentNode,"optgroup"))){b=f(e).val();if(j)return b;h.push(b)}}if(j&&!h.length&&i.length)return f(i[g]).val();return h},set:function(a,b){var c=f.makeArray(b);f(a).find("option").each(function(){this.selected=f.inArray(f(this).val(),c)>=0}),c.length||(a.selectedIndex=-1);return c}}},attrFn:{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,offset:!0},attr:function(a,c,d,e){var g,h,i,j=a.nodeType;if(!!a&&j!==3&&j!==8&&j!==2){if(e&&c in f.attrFn)return f(a)[c](d);if(typeof a.getAttribute=="undefined")return f.prop(a,c,d);i=j!==1||!f.isXMLDoc(a),i&&(c=c.toLowerCase(),h=f.attrHooks[c]||(u.test(c)?x:w));if(d!==b){if(d===null){f.removeAttr(a,c);return}if(h&&"set"in h&&i&&(g=h.set(a,d,c))!==b)return g;a.setAttribute(c,""+d);return d}if(h&&"get"in h&&i&&(g=h.get(a,c))!==null)return g;g=a.getAttribute(c);return g===null?b:g}},removeAttr:function(a,b){var c,d,e,g,h,i=0;if(b&&a.nodeType===1){d=b.toLowerCase().split(p),g=d.length;for(;i<g;i++)e=d[i],e&&(c=f.propFix[e]||e,h=u.test(e),h||f.attr(a,e,""),a.removeAttribute(v?e:c),h&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(r.test(a.nodeName)&&a.parentNode)f.error("type property can't be changed");else if(!f.support.radioValue&&b==="radio"&&f.nodeName(a,"input")){var c=a.value;a.setAttribute("type",b),c&&(a.value=c);return b}}},value:{get:function(a,b){if(w&&f.nodeName(a,"button"))return w.get(a,b);return b in a?a.value:null},set:function(a,b,c){if(w&&f.nodeName(a,"button"))return w.set(a,b,c);a.value=b}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,g,h,i=a.nodeType;if(!!a&&i!==3&&i!==8&&i!==2){h=i!==1||!f.isXMLDoc(a),h&&(c=f.propFix[c]||c,g=f.propHooks[c]);return d!==b?g&&"set"in g&&(e=g.set(a,d,c))!==b?e:a[c]=d:g&&"get"in g&&(e=g.get(a,c))!==null?e:a[c]}},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):s.test(a.nodeName)||t.test(a.nodeName)&&a.href?0:b}}}}),f.attrHooks.tabindex=f.propHooks.tabIndex,x={get:function(a,c){var d,e=f.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b},set:function(a,b,c){var d;b===!1?f.removeAttr(a,c):(d=f.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase()));return c}},v||(y={name:!0,id:!0,coords:!0},w=f.valHooks.button={get:function(a,c){var d;d=a.getAttributeNode(c);return d&&(y[c]?d.nodeValue!=="":d.specified)?d.nodeValue:b},set:function(a,b,d){var e=a.getAttributeNode(d);e||(e=c.createAttribute(d),a.setAttributeNode(e));return e.nodeValue=b+""}},f.attrHooks.tabindex.set=w.set,f.each(["width","height"],function(a,b){f.attrHooks[b]=f.extend(f.attrHooks[b],{set:function(a,c){if(c===""){a.setAttribute(b,"auto");return c}}})}),f.attrHooks.contenteditable={get:w.get,set:function(a,b,c){b===""&&(b="false"),w.set(a,b,c)}}),f.support.hrefNormalized||f.each(["href","src","width","height"],function(a,c){f.attrHooks[c]=f.extend(f.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),f.support.style||(f.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=""+b}}),f.support.optSelected||(f.propHooks.selected=f.extend(f.propHooks.selected,{get:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex);return null}})),f.support.enctype||(f.propFix.enctype="encoding"),f.support.checkOn||f.each(["radio","checkbox"],function(){f.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}}),f.each(["radio","checkbox"],function(){f.valHooks[this]=f.extend(f.valHooks[this],{set:function(a,b){if(f.isArray(b))return a.checked=f.inArray(f(a).val(),b)>=0}})});var z=/^(?:textarea|input|select)$/i,A=/^([^\.]*)?(?:\.(.+))?$/,B=/(?:^|\s)hover(\.\S+)?\b/,C=/^key/,D=/^(?:mouse|contextmenu)|click/,E=/^(?:focusinfocus|focusoutblur)$/,F=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,G=function(
a){var b=F.exec(a);b&&(b[1]=(b[1]||"").toLowerCase(),b[3]=b[3]&&new RegExp("(?:^|\\s)"+b[3]+"(?:\\s|$)"));return b},H=function(a,b){var c=a.attributes||{};return(!b[1]||a.nodeName.toLowerCase()===b[1])&&(!b[2]||(c.id||{}).value===b[2])&&(!b[3]||b[3].test((c["class"]||{}).value))},I=function(a){return f.event.special.hover?a:a.replace(B,"mouseenter$1 mouseleave$1")};f.event={add:function(a,c,d,e,g){var h,i,j,k,l,m,n,o,p,q,r,s;if(!(a.nodeType===3||a.nodeType===8||!c||!d||!(h=f._data(a)))){d.handler&&(p=d,d=p.handler,g=p.selector),d.guid||(d.guid=f.guid++),j=h.events,j||(h.events=j={}),i=h.handle,i||(h.handle=i=function(a){return typeof f!="undefined"&&(!a||f.event.triggered!==a.type)?f.event.dispatch.apply(i.elem,arguments):b},i.elem=a),c=f.trim(I(c)).split(" ");for(k=0;k<c.length;k++){l=A.exec(c[k])||[],m=l[1],n=(l[2]||"").split(".").sort(),s=f.event.special[m]||{},m=(g?s.delegateType:s.bindType)||m,s=f.event.special[m]||{},o=f.extend({type:m,origType:l[1],data:e,handler:d,guid:d.guid,selector:g,quick:g&&G(g),namespace:n.join(".")},p),r=j[m];if(!r){r=j[m]=[],r.delegateCount=0;if(!s.setup||s.setup.call(a,e,n,i)===!1)a.addEventListener?a.addEventListener(m,i,!1):a.attachEvent&&a.attachEvent("on"+m,i)}s.add&&(s.add.call(a,o),o.handler.guid||(o.handler.guid=d.guid)),g?r.splice(r.delegateCount++,0,o):r.push(o),f.event.global[m]=!0}a=null}},global:{},remove:function(a,b,c,d,e){var g=f.hasData(a)&&f._data(a),h,i,j,k,l,m,n,o,p,q,r,s;if(!!g&&!!(o=g.events)){b=f.trim(I(b||"")).split(" ");for(h=0;h<b.length;h++){i=A.exec(b[h])||[],j=k=i[1],l=i[2];if(!j){for(j in o)f.event.remove(a,j+b[h],c,d,!0);continue}p=f.event.special[j]||{},j=(d?p.delegateType:p.bindType)||j,r=o[j]||[],m=r.length,l=l?new RegExp("(^|\\.)"+l.split(".").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;for(n=0;n<r.length;n++)s=r[n],(e||k===s.origType)&&(!c||c.guid===s.guid)&&(!l||l.test(s.namespace))&&(!d||d===s.selector||d==="**"&&s.selector)&&(r.splice(n--,1),s.selector&&r.delegateCount--,p.remove&&p.remove.call(a,s));r.length===0&&m!==r.length&&((!p.teardown||p.teardown.call(a,l)===!1)&&f.removeEvent(a,j,g.handle),delete o[j])}f.isEmptyObject(o)&&(q=g.handle,q&&(q.elem=null),f.removeData(a,["events","handle"],!0))}},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,e,g){if(!e||e.nodeType!==3&&e.nodeType!==8){var h=c.type||c,i=[],j,k,l,m,n,o,p,q,r,s;if(E.test(h+f.event.triggered))return;h.indexOf("!")>=0&&(h=h.slice(0,-1),k=!0),h.indexOf(".")>=0&&(i=h.split("."),h=i.shift(),i.sort());if((!e||f.event.customEvent[h])&&!f.event.global[h])return;c=typeof c=="object"?c[f.expando]?c:new f.Event(h,c):new f.Event(h),c.type=h,c.isTrigger=!0,c.exclusive=k,c.namespace=i.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+i.join("\\.(?:.*\\.)?")+"(\\.|$)"):null,o=h.indexOf(":")<0?"on"+h:"";if(!e){j=f.cache;for(l in j)j[l].events&&j[l].events[h]&&f.event.trigger(c,d,j[l].handle.elem,!0);return}c.result=b,c.target||(c.target=e),d=d!=null?f.makeArray(d):[],d.unshift(c),p=f.event.special[h]||{};if(p.trigger&&p.trigger.apply(e,d)===!1)return;r=[[e,p.bindType||h]];if(!g&&!p.noBubble&&!f.isWindow(e)){s=p.delegateType||h,m=E.test(s+h)?e:e.parentNode,n=null;for(;m;m=m.parentNode)r.push([m,s]),n=m;n&&n===e.ownerDocument&&r.push([n.defaultView||n.parentWindow||a,s])}for(l=0;l<r.length&&!c.isPropagationStopped();l++)m=r[l][0],c.type=r[l][1],q=(f._data(m,"events")||{})[c.type]&&f._data(m,"handle"),q&&q.apply(m,d),q=o&&m[o],q&&f.acceptData(m)&&q.apply(m,d)===!1&&c.preventDefault();c.type=h,!g&&!c.isDefaultPrevented()&&(!p._default||p._default.apply(e.ownerDocument,d)===!1)&&(h!=="click"||!f.nodeName(e,"a"))&&f.acceptData(e)&&o&&e[h]&&(h!=="focus"&&h!=="blur"||c.target.offsetWidth!==0)&&!f.isWindow(e)&&(n=e[o],n&&(e[o]=null),f.event.triggered=h,e[h](),f.event.triggered=b,n&&(e[o]=n));return c.result}},dispatch:function(c){c=f.event.fix(c||a.event);var d=(f._data(this,"events")||{})[c.type]||[],e=d.delegateCount,g=[].slice.call(arguments,0),h=!c.exclusive&&!c.namespace,i=f.event.special[c.type]||{},j=[],k,l,m,n,o,p,q,r,s,t,u;g[0]=c,c.delegateTarget=this;if(!i.preDispatch||i.preDispatch.call(this,c)!==!1){if(e&&(!c.button||c.type!=="click")){n=f(this),n.context=this.ownerDocument||this;for(m=c.target;m!=this;m=m.parentNode||this)if(m.disabled!==!0){p={},r=[],n[0]=m;for(k=0;k<e;k++)s=d[k],t=s.selector,p[t]===b&&(p[t]=s.quick?H(m,s.quick):n.is(t)),p[t]&&r.push(s);r.length&&j.push({elem:m,matches:r})}}d.length>e&&j.push({elem:this,matches:d.slice(e)});for(k=0;k<j.length&&!c.isPropagationStopped();k++){q=j[k],c.currentTarget=q.elem;for(l=0;l<q.matches.length&&!c.isImmediatePropagationStopped();l++){s=q.matches[l];if(h||!c.namespace&&!s.namespace||c.namespace_re&&c.namespace_re.test(s.namespace))c.data=s.data,c.handleObj=s,o=((f.event.special[s.origType]||{}).handle||s.handler).apply(q.elem,g),o!==b&&(c.result=o,o===!1&&(c.preventDefault(),c.stopPropagation()))}}i.postDispatch&&i.postDispatch.call(this,c);return c.result}},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode);return a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,d){var e,f,g,h=d.button,i=d.fromElement;a.pageX==null&&d.clientX!=null&&(e=a.target.ownerDocument||c,f=e.documentElement,g=e.body,a.pageX=d.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=d.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?d.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0);return a}},fix:function(a){if(a[f.expando])return a;var d,e,g=a,h=f.event.fixHooks[a.type]||{},i=h.props?this.props.concat(h.props):this.props;a=f.Event(g);for(d=i.length;d;)e=i[--d],a[e]=g[e];a.target||(a.target=g.srcElement||c),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey===b&&(a.metaKey=a.ctrlKey);return h.filter?h.filter(a,g):a},special:{ready:{setup:f.bindReady},load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){f.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=f.extend(new f.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?f.event.trigger(e,null,b):f.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},f.event.handle=f.event.dispatch,f.removeEvent=c.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){a.detachEvent&&a.detachEvent("on"+b,c)},f.Event=function(a,b){if(!(this instanceof f.Event))return new f.Event(a,b);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?K:J):this.type=a,b&&f.extend(this,b),this.timeStamp=a&&a.timeStamp||f.now(),this[f.expando]=!0},f.Event.prototype={preventDefault:function(){this.isDefaultPrevented=K;var a=this.originalEvent;!a||(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){this.isPropagationStopped=K;var a=this.originalEvent;!a||(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=K,this.stopPropagation()},isDefaultPrevented:J,isPropagationStopped:J,isImmediatePropagationStopped:J},f.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){f.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c=this,d=a.relatedTarget,e=a.handleObj,g=e.selector,h;if(!d||d!==c&&!f.contains(c,d))a.type=e.origType,h=e.handler.apply(this,arguments),a.type=b;return h}}}),f.support.submitBubbles||(f.event.special.submit={setup:function(){if(f.nodeName(this,"form"))return!1;f.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=f.nodeName(c,"input")||f.nodeName(c,"button")?c.form:b;d&&!d._submit_attached&&(f.event.add(d,"submit._submit",function(a){a._submit_bubble=!0}),d._submit_attached=!0)})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&f.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){if(f.nodeName(this,"form"))return!1;f.event.remove(this,"._submit")}}),f.support.changeBubbles||(f.event.special.change={setup:function(){if(z.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")f.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),f.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1,f.event.simulate("change",this,a,!0))});return!1}f.event.add(this,"beforeactivate._change",function(a){var b=a.target;z.test(b.nodeName)&&!b._change_attached&&(f.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&f.event.simulate("change",this.parentNode,a,!0)}),b._change_attached=!0)})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){f.event.remove(this,"._change");return z.test(this.nodeName)}}),f.support.focusinBubbles||f.each({focus:"focusin",blur:"focusout"},function(a,b){var d=0,e=function(a){f.event.simulate(b,a.target,f.event.fix(a),!0)};f.event.special[b]={setup:function(){d++===0&&c.addEventListener(a,e,!0)},teardown:function(){--d===0&&c.removeEventListener(a,e,!0)}}}),f.fn.extend({on:function(a,c,d,e,g){var h,i;if(typeof a=="object"){typeof c!="string"&&(d=d||c,c=b);for(i in a)this.on(i,c,d,a[i],g);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));if(e===!1)e=J;else if(!e)return this;g===1&&(h=e,e=function(a){f().off(a);return h.apply(this,arguments)},e.guid=h.guid||(h.guid=f.guid++));return this.each(function(){f.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,c,d){if(a&&a.preventDefault&&a.handleObj){var e=a.handleObj;f(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler);return this}if(typeof a=="object"){for(var g in a)this.off(g,c,a[g]);return this}if(c===!1||typeof c=="function")d=c,c=b;d===!1&&(d=J);return this.each(function(){f.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){f(this.context).on(a,this.selector,b,c);return this},die:function(a,b){f(this.context).off(a,this.selector||"**",b);return this},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length==1?this.off(a,"**"):this.off(b,a,c)},trigger:function(a,b){return this.each(function(){f.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0])return f.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||f.guid++,d=0,e=function(c){var e=(f._data(this,"lastToggle"+a.guid)||0)%d;f._data(this,"lastToggle"+a.guid,e+1),c.preventDefault();return b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){f.fn[b]=function(a,c){c==null&&(c=a,a=null);return arguments.length>0?this.on(b,null,a,c):this.trigger(b)},f.attrFn&&(f.attrFn[b]=!0),C.test(b)&&(f.event.fixHooks[b]=f.event.keyHooks),D.test(b)&&(f.event.fixHooks[b]=f.event.mouseHooks)}),function(){function x(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}if(j.nodeType===1){g||(j[d]=c,j.sizset=h);if(typeof b!="string"){if(j===b){k=!0;break}}else if(m.filter(b,[j]).length>0){k=j;break}}j=j[a]}e[h]=k}}}function w(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}j.nodeType===1&&!g&&(j[d]=c,j.sizset=h);if(j.nodeName.toLowerCase()===b){k=j;break}j=j[a]}e[h]=k}}}var a=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,d="sizcache"+(Math.random()+"").replace(".",""),e=0,g=Object.prototype.toString,h=!1,i=!0,j=/\\/g,k=/\r\n/g,l=/\W/;[0,0].sort(function(){i=!1;return 0});var m=function(b,d,e,f){e=e||[],d=d||c;var h=d;if(d.nodeType!==1&&d.nodeType!==9)return[];if(!b||typeof b!="string")return e;var i,j,k,l,n,q,r,t,u=!0,v=m.isXML(d),w=[],x=b;do{a.exec(""),i=a.exec(x);if(i){x=i[3],w.push(i[1]);if(i[2]){l=i[3];break}}}while(i);if(w.length>1&&p.exec(b))if(w.length===2&&o.relative[w[0]])j=y(w[0]+w[1],d,f);else{j=o.relative[w[0]]?[d]:m(w.shift(),d);while(w.length)b=w.shift(),o.relative[b]&&(b+=w.shift()),j=y(b,j,f)}else{!f&&w.length>1&&d.nodeType===9&&!v&&o.match.ID.test(w[0])&&!o.match.ID.test(w[w.length-1])&&(n=m.find(w.shift(),d,v),d=n.expr?m.filter(n.expr,n.set)[0]:n.set[0]);if(d){n=f?{expr:w.pop(),set:s(f)}:m.find(w.pop(),w.length===1&&(w[0]==="~"||w[0]==="+")&&d.parentNode?d.parentNode:d,v),j=n.expr?m.filter(n.expr,n.set):n.set,w.length>0?k=s(j):u=!1;while(w.length)q=w.pop(),r=q,o.relative[q]?r=w.pop():q="",r==null&&(r=d),o.relative[q](k,r,v)}else k=w=[]}k||(k=j),k||m.error(q||b);if(g.call(k)==="[object Array]")if(!u)e.push.apply(e,k);else if(d&&d.nodeType===1)for(t=0;k[t]!=null;t++)k[t]&&(k[t]===!0||k[t].nodeType===1&&m.contains(d,k[t]))&&e.push(j[t]);else for(t=0;k[t]!=null;t++)k[t]&&k[t].nodeType===1&&e.push(j[t]);else s(k,e);l&&(m(l,h,e,f),m.uniqueSort(e));return e};m.uniqueSort=function(a){if(u){h=i,a.sort(u);if(h)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1)}return a},m.matches=function(a,b){return m(a,null,null,b)},m.matchesSelector=function(a,b){return m(b,null,null,[a]).length>0},m.find=function(a,b,c){var d,e,f,g,h,i;if(!a)return[];for(e=0,f=o.order.length;e<f;e++){h=o.order[e];if(g=o.leftMatch[h].exec(a)){i=g[1],g.splice(1,1);if(i.substr(i.length-1)!=="\\"){g[1]=(g[1]||"").replace(j,""),d=o.find[h](g,b,c);if(d!=null){a=a.replace(o.match[h],"");break}}}}d||(d=typeof b.getElementsByTagName!="undefined"?b.getElementsByTagName("*"):[]);return{set:d,expr:a}},m.filter=function(a,c,d,e){var f,g,h,i,j,k,l,n,p,q=a,r=[],s=c,t=c&&c[0]&&m.isXML(c[0]);while(a&&c.length){for(h in o.filter)if((f=o.leftMatch[h].exec(a))!=null&&f[2]){k=o.filter[h],l=f[1],g=!1,f.splice(1,1);if(l.substr(l.length-1)==="\\")continue;s===r&&(r=[]);if(o.preFilter[h]){f=o.preFilter[h](f,s,d,r,e,t);if(!f)g=i=!0;else if(f===!0)continue}if(f)for(n=0;(j=s[n])!=null;n++)j&&(i=k(j,f,n,s),p=e^i,d&&i!=null?p?g=!0:s[n]=!1:p&&(r.push(j),g=!0));if(i!==b){d||(s=r),a=a.replace(o.match[h],"");if(!g)return[];break}}if(a===q)if(g==null)m.error(a);else break;q=a}return s},m.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)};var n=m.getText=function(a){var b,c,d=a.nodeType,e="";if(d){if(d===1||d===9||d===11){if(typeof a.textContent=="string")return a.textContent;if(typeof a.innerText=="string")return a.innerText.replace(k,"");for(a=a.firstChild;a;a=a.nextSibling)e+=n(a)}else if(d===3||d===4)return a.nodeValue}else for(b=0;c=a[b];b++)c.nodeType!==8&&(e+=n(c));return e},o=m.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href")},type:function(a){return a.getAttribute("type")}},relative:{"+":function(a,b){var c=typeof b=="string",d=c&&!l.test(b),e=c&&!d;d&&(b=b.toLowerCase());for(var f=0,g=a.length,h;f<g;f++)if(h=a[f]){while((h=h.previousSibling)&&h.nodeType!==1);a[f]=e||h&&h.nodeName.toLowerCase()===b?h||!1:h===b}e&&m.filter(b,a,!0)},">":function(a,b){var c,d=typeof b=="string",e=0,f=a.length;if(d&&!l.test(b)){b=b.toLowerCase();for(;e<f;e++){c=a[e];if(c){var g=c.parentNode;a[e]=g.nodeName.toLowerCase()===b?g:!1}}}else{for(;e<f;e++)c=a[e],c&&(a[e]=d?c.parentNode:c.parentNode===b);d&&m.filter(b,a,!0)}},"":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("parentNode",b,f,a,d,c)},"~":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("previousSibling",b,f,a,d,c)}},find:{ID:function(a,b,c){if(typeof b.getElementById!="undefined"&&!c){var d=b.getElementById(a[1]);return d&&d.parentNode?[d]:[]}},NAME:function(a,b){if(typeof b.getElementsByName!="undefined"){var c=[],d=b.getElementsByName(a[1]);for(var e=0,f=d.length;e<f;e++)d[e].getAttribute("name")===a[1]&&c.push(d[e]);return c.length===0?null:c}},TAG:function(a,b){if(typeof b.getElementsByTagName!="undefined")return b.getElementsByTagName(a[1])}},preFilter:{CLASS:function(a,b,c,d,e,f){a=" "+a[1].replace(j,"")+" ";if(f)return a;for(var g=0,h;(h=b[g])!=null;g++)h&&(e^(h.className&&(" "+h.className+" ").replace(/[\t\n\r]/g," ").indexOf(a)>=0)?c||d.push(h):c&&(b[g]=!1));return!1},ID:function(a){return a[1].replace(j,"")},TAG:function(a,b){return a[1].replace(j,"").toLowerCase()},CHILD:function(a){if(a[1]==="nth"){a[2]||m.error(a[0]),a[2]=a[2].replace(/^\+|\s*/g,"");var b=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2]==="even"&&"2n"||a[2]==="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);a[2]=b[1]+(b[2]||1)-0,a[3]=b[3]-0}else a[2]&&m.error(a[0]);a[0]=e++;return a},ATTR:function(a,b,c,d,e,f){var g=a[1]=a[1].replace(j,"");!f&&o.attrMap[g]&&(a[1]=o.attrMap[g]),a[4]=(a[4]||a[5]||"").replace(j,""),a[2]==="~="&&(a[4]=" "+a[4]+" ");return a},PSEUDO:function(b,c,d,e,f){if(b[1]==="not")if((a.exec(b[3])||"").length>1||/^\w/.test(b[3]))b[3]=m(b[3],null,null,c);else{var g=m.filter(b[3],c,d,!0^f);d||e.push.apply(e,g);return!1}else if(o.match.POS.test(b[0])||o.match.CHILD.test(b[0]))return!0;return b},POS:function(a){a.unshift(!0);return a}},filters:{enabled:function(a){return a.disabled===!1&&a.type!=="hidden"},disabled:function(a){return a.disabled===!0},checked:function(a){return a.checked===!0},selected:function(a){a.parentNode&&a.parentNode.selectedIndex;return a.selected===!0},parent:function(a){return!!a.firstChild},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!m(c[3],a).length},header:function(a){return/h\d/i.test(a.nodeName)},text:function(a){var b=a.getAttribute("type"),c=a.type;return a.nodeName.toLowerCase()==="input"&&"text"===c&&(b===c||b===null)},radio:function(a){return a.nodeName.toLowerCase()==="input"&&"radio"===a.type},checkbox:function(a){return a.nodeName.toLowerCase()==="input"&&"checkbox"===a.type},file:function(a){return a.nodeName.toLowerCase()==="input"&&"file"===a.type},password:function(a){return a.nodeName.toLowerCase()==="input"&&"password"===a.type},submit:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"submit"===a.type},image:function(a){return a.nodeName.toLowerCase()==="input"&&"image"===a.type},reset:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"reset"===a.type},button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&"button"===a.type||b==="button"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName)},focus:function(a){return a===a.ownerDocument.activeElement}},setFilters:{first:function(a,b){return b===0},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){return c[3]-0===b},eq:function(a,b,c){return c[3]-0===b}},filter:{PSEUDO:function(a,b,c,d){var e=b[1],f=o.filters[e];if(f)return f(a,c,b,d);if(e==="contains")return(a.textContent||a.innerText||n([a])||"").indexOf(b[3])>=0;if(e==="not"){var g=b[3];for(var h=0,i=g.length;h<i;h++)if(g[h]===a)return!1;return!0}m.error(e)},CHILD:function(a,b){var c,e,f,g,h,i,j,k=b[1],l=a;switch(k){case"only":case"first":while(l=l.previousSibling)if(l.nodeType===1)return!1;if(k==="first")return!0;l=a;case"last":while(l=l.nextSibling)if(l.nodeType===1)return!1;return!0;case"nth":c=b[2],e=b[3];if(c===1&&e===0)return!0;f=b[0],g=a.parentNode;if(g&&(g[d]!==f||!a.nodeIndex)){i=0;for(l=g.firstChild;l;l=l.nextSibling)l.nodeType===1&&(l.nodeIndex=++i);g[d]=f}j=a.nodeIndex-e;return c===0?j===0:j%c===0&&j/c>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b},TAG:function(a,b){return b==="*"&&a.nodeType===1||!!a.nodeName&&a.nodeName.toLowerCase()===b},CLASS:function(a,b){return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>-1},ATTR:function(a,b){var c=b[1],d=m.attr?m.attr(a,c):o.attrHandle[c]?o.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c),e=d+"",f=b[2],g=b[4];return d==null?f==="!=":!f&&m.attr?d!=null:f==="="?e===g:f==="*="?e.indexOf(g)>=0:f==="~="?(" "+e+" ").indexOf(g)>=0:g?f==="!="?e!==g:f==="^="?e.indexOf(g)===0:f==="$="?e.substr(e.length-g.length)===g:f==="|="?e===g||e.substr(0,g.length+1)===g+"-":!1:e&&d!==!1},POS:function(a,b,c,d){var e=b[2],f=o.setFilters[e];if(f)return f(a,c,b,d)}}},p=o.match.POS,q=function(a,b){return"\\"+(b-0+1)};for(var r in o.match)o.match[r]=new RegExp(o.match[r].source+/(?![^\[]*\])(?![^\(]*\))/.source),o.leftMatch[r]=new RegExp(/(^(?:.|\r|\n)*?)/.source+o.match[r].source.replace(/\\(\d+)/g,q));o.match.globalPOS=p;var s=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{Array.prototype.slice.call(c.documentElement.childNodes,0)[0].nodeType}catch(t){s=function(a,b){var c=0,d=b||[];if(g.call(a)==="[object Array]")Array.prototype.push.apply(d,a);else if(typeof a.length=="number")for(var e=a.length;c<e;c++)d.push(a[c]);else for(;a[c];c++)d.push(a[c]);return d}}var u,v;c.documentElement.compareDocumentPosition?u=function(a,b){if(a===b){h=!0;return 0}if(!a.compareDocumentPosition||!b.compareDocumentPosition)return a.compareDocumentPosition?-1:1;return a.compareDocumentPosition(b)&4?-1:1}:(u=function(a,b){if(a===b){h=!0;return 0}if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;var c,d,e=[],f=[],g=a.parentNode,i=b.parentNode,j=g;if(g===i)return v(a,b);if(!g)return-1;if(!i)return 1;while(j)e.unshift(j),j=j.parentNode;j=i;while(j)f.unshift(j),j=j.parentNode;c=e.length,d=f.length;for(var k=0;k<c&&k<d;k++)if(e[k]!==f[k])return v(e[k],f[k]);return k===c?v(a,f[k],-1):v(e[k],b,1)},v=function(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}),function(){var a=c.createElement("div"),d="script"+(new Date).getTime(),e=c.documentElement;a.innerHTML="<a name='"+d+"'/>",e.insertBefore(a,e.firstChild),c.getElementById(d)&&(o.find.ID=function(a,c,d){if(typeof c.getElementById!="undefined"&&!d){var e=c.getElementById(a[1]);return e?e.id===a[1]||typeof e.getAttributeNode!="undefined"&&e.getAttributeNode("id").nodeValue===a[1]?[e]:b:[]}},o.filter.ID=function(a,b){var c=typeof a.getAttributeNode!="undefined"&&a.getAttributeNode("id");return a.nodeType===1&&c&&c.nodeValue===b}),e.removeChild(a),e=a=null}(),function(){var a=c.createElement("div");a.appendChild(c.createComment("")),a.getElementsByTagName("*").length>0&&(o.find.TAG=function(a,b){var c=b.getElementsByTagName(a[1]);if(a[1]==="*"){var d=[];for(var e=0;c[e];e++)c[e].nodeType===1&&d.push(c[e]);c=d}return c}),a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!="undefined"&&a.firstChild.getAttribute("href")!=="#"&&(o.attrHandle.href=function(a){return a.getAttribute("href",2)}),a=null}(),c.querySelectorAll&&function(){var a=m,b=c.createElement("div"),d="__sizzle__";b.innerHTML="<p class='TEST'></p>";if(!b.querySelectorAll||b.querySelectorAll(".TEST").length!==0){m=function(b,e,f,g){e=e||c;if(!g&&!m.isXML(e)){var h=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);if(h&&(e.nodeType===1||e.nodeType===9)){if(h[1])return s(e.getElementsByTagName(b),f);if(h[2]&&o.find.CLASS&&e.getElementsByClassName)return s(e.getElementsByClassName(h[2]),f)}if(e.nodeType===9){if(b==="body"&&e.body)return s([e.body],f);if(h&&h[3]){var i=e.getElementById(h[3]);if(!i||!i.parentNode)return s([],f);if(i.id===h[3])return s([i],f)}try{return s(e.querySelectorAll(b),f)}catch(j){}}else if(e.nodeType===1&&e.nodeName.toLowerCase()!=="object"){var k=e,l=e.getAttribute("id"),n=l||d,p=e.parentNode,q=/^\s*[+~]/.test(b);l?n=n.replace(/'/g,"\\$&"):e.setAttribute("id",n),q&&p&&(e=e.parentNode);try{if(!q||p)return s(e.querySelectorAll("[id='"+n+"'] "+b),f)}catch(r){}finally{l||k.removeAttribute("id")}}}return a(b,e,f,g)};for(var e in a)m[e]=a[e];b=null}}(),function(){var a=c.documentElement,b=a.matchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||a.msMatchesSelector;if(b){var d=!b.call(c.createElement("div"),"div"),e=!1;try{b.call(c.documentElement,"[test!='']:sizzle")}catch(f){e=!0}m.matchesSelector=function(a,c){c=c.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!m.isXML(a))try{if(e||!o.match.PSEUDO.test(c)&&!/!=/.test(c)){var f=b.call(a,c);if(f||!d||a.document&&a.document.nodeType!==11)return f}}catch(g){}return m(c,null,null,[a]).length>0}}}(),function(){var a=c.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";if(!!a.getElementsByClassName&&a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length===1)return;o.order.splice(1,0,"CLASS"),o.find.CLASS=function(a,b,c){if(typeof b.getElementsByClassName!="undefined"&&!c)return b.getElementsByClassName(a[1])},a=null}}(),c.documentElement.contains?m.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):!0)}:c.documentElement.compareDocumentPosition?m.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16)}:m.contains=function(){return!1},m.isXML=function(a){var b=(a?a.ownerDocument||a:0).documentElement;return b?b.nodeName!=="HTML":!1};var y=function(a,b,c){var d,e=[],f="",g=b.nodeType?[b]:b;while(d=o.match.PSEUDO.exec(a))f+=d[0],a=a.replace(o.match.PSEUDO,"");a=o.relative[a]?a+"*":a;for(var h=0,i=g.length;h<i;h++)m(a,g[h],e,c);return m.filter(f,e)};m.attr=f.attr,m.selectors.attrMap={},f.find=m,f.expr=m.selectors,f.expr[":"]=f.expr.filters,f.unique=m.uniqueSort,f.text=m.getText,f.isXMLDoc=m.isXML,f.contains=m.contains}();var L=/Until$/,M=/^(?:parents|prevUntil|prevAll)/,N=/,/,O=/^.[^:#\[\.,]*$/,P=Array.prototype.slice,Q=f.expr.match.globalPOS,R={children:!0,contents:!0,next:!0,prev:!0};f.fn.extend({find:function(a){var b=this,c,d;if(typeof a!="string")return f(a).filter(function(){for(c=0,d=b.length;c<d;c++)if(f.contains(b[c],this))return!0});var e=this.pushStack("","find",a),g,h,i;for(c=0,d=this.length;c<d;c++){g=e.length,f.find(a,this[c],e);if(c>0)for(h=g;h<e.length;h++)for(i=0;i<g;i++)if(e[i]===e[h]){e.splice(h--,1);break}}return e},has:function(a){var b=f(a);return this.filter(function(){for(var a=0,c=b.length;a<c;a++)if(f.contains(this,b[a]))return!0})},not:function(a){return this.pushStack(T(this,a,!1),"not",a)},filter:function(a){return this.pushStack(T(this,a,!0),"filter",a)},is:function(a){return!!a&&(typeof a=="string"?Q.test(a)?f(a,this.context).index(this[0])>=0:f.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var c=[],d,e,g=this[0];if(f.isArray(a)){var h=1;while(g&&g.ownerDocument&&g!==b){for(d=0;d<a.length;d++)f(g).is(a[d])&&c.push({selector:a[d],elem:g,level:h});g=g.parentNode,h++}return c}var i=Q.test(a)||typeof a!="string"?f(a,b||this.context):0;for(d=0,e=this.length;d<e;d++){g=this[d];while(g){if(i?i.index(g)>-1:f.find.matchesSelector(g,a)){c.push(g);break}g=g.parentNode;if(!g||!g.ownerDocument||g===b||g.nodeType===11)break}}c=c.length>1?f.unique(c):c;return this.pushStack(c,"closest",a)},index:function(a){if(!a)return this[0]&&this[0].parentNode?this.prevAll().length:-1;if(typeof a=="string")return f.inArray(this[0],f(a));return f.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var c=typeof a=="string"?f(a,b):f.makeArray(a&&a.nodeType?[a]:a),d=f.merge(this.get(),c);return this.pushStack(S(c[0])||S(d[0])?d:f.unique(d))},andSelf:function(){return this.add(this.prevObject)}}),f.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return f.dir(a,"parentNode")},parentsUntil:function(a,b,c){return f.dir(a,"parentNode",c)},next:function(a){return f.nth(a,2,"nextSibling")},prev:function(a){return f.nth(a,2,"previousSibling")},nextAll:function(a){return f.dir(a,"nextSibling")},prevAll:function(a){return f.dir(a,"previousSibling")},nextUntil:function(a,b,c){return f.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return f.dir(a,"previousSibling",c)},siblings:function(a){return f.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return f.sibling(a.firstChild)},contents:function(a){return f.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:f.makeArray(a.childNodes)}},function(a,b){f.fn[a]=function(c,d){var e=f.map(this,b,c);L.test(a)||(d=c),d&&typeof d=="string"&&(e=f.filter(d,e)),e=this.length>1&&!R[a]?f.unique(e):e,(this.length>1||N.test(d))&&M.test(a)&&(e=e.reverse());return this.pushStack(e,a,P.call(arguments).join(","))}}),f.extend({filter:function(a,b,c){c&&(a=":not("+a+")");return b.length===1?f.find.matchesSelector(b[0],a)?[b[0]]:[]:f.find.matches(a,b)},dir:function(a,c,d){var e=[],g=a[c];while(g&&g.nodeType!==9&&(d===b||g.nodeType!==1||!f(g).is(d)))g.nodeType===1&&e.push(g),g=g[c];return e},nth:function(a,b,c,d){b=b||1;var e=0;for(;a;a=a[c])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var V="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",W=/ jQuery\d+="(?:\d+|null)"/g,X=/^\s+/,Y=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,Z=/<([\w:]+)/,$=/<tbody/i,_=/<|&#?\w+;/,ba=/<(?:script|style)/i,bb=/<(?:script|object|embed|option|style)/i,bc=new RegExp("<(?:"+V+")[\\s/>]","i"),bd=/checked\s*(?:[^=]|=\s*.checked.)/i,be=/\/(java|ecma)script/i,bf=/^\s*<!(?:\[CDATA\[|\-\-)/,bg={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bh=U(c);bg.optgroup=bg.option,bg.tbody=bg.tfoot=bg.colgroup=bg.caption=bg.thead,bg.th=bg.td,f.support.htmlSerialize||(bg._default=[1,"div<div>","</div>"]),f.fn.extend({text:function(a){return f.access(this,function(a){return a===b?f.text(this):this.empty().append((this[0]&&this[0].ownerDocument||c).createTextNode(a))},null,a,arguments.length)},wrapAll:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapAll(a.call(this,b))});if(this[0]){var b=f(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapInner(a.call(this,b))});return this.each(function(){var b=f(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=f.isFunction(a);return this.each(function(c){f(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){f.nodeName(this,"body")||f(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=f
.clean(arguments);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,f.clean(arguments));return a}},remove:function(a,b){for(var c=0,d;(d=this[c])!=null;c++)if(!a||f.filter(a,[d]).length)!b&&d.nodeType===1&&(f.cleanData(d.getElementsByTagName("*")),f.cleanData([d])),d.parentNode&&d.parentNode.removeChild(d);return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++){b.nodeType===1&&f.cleanData(b.getElementsByTagName("*"));while(b.firstChild)b.removeChild(b.firstChild)}return this},clone:function(a,b){a=a==null?!1:a,b=b==null?a:b;return this.map(function(){return f.clone(this,a,b)})},html:function(a){return f.access(this,function(a){var c=this[0]||{},d=0,e=this.length;if(a===b)return c.nodeType===1?c.innerHTML.replace(W,""):null;if(typeof a=="string"&&!ba.test(a)&&(f.support.leadingWhitespace||!X.test(a))&&!bg[(Z.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Y,"<$1></$2>");try{for(;d<e;d++)c=this[d]||{},c.nodeType===1&&(f.cleanData(c.getElementsByTagName("*")),c.innerHTML=a);c=0}catch(g){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(f.isFunction(a))return this.each(function(b){var c=f(this),d=c.html();c.replaceWith(a.call(this,b,d))});typeof a!="string"&&(a=f(a).detach());return this.each(function(){var b=this.nextSibling,c=this.parentNode;f(this).remove(),b?f(b).before(a):f(c).append(a)})}return this.length?this.pushStack(f(f.isFunction(a)?a():a),"replaceWith",a):this},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){var e,g,h,i,j=a[0],k=[];if(!f.support.checkClone&&arguments.length===3&&typeof j=="string"&&bd.test(j))return this.each(function(){f(this).domManip(a,c,d,!0)});if(f.isFunction(j))return this.each(function(e){var g=f(this);a[0]=j.call(this,e,c?g.html():b),g.domManip(a,c,d)});if(this[0]){i=j&&j.parentNode,f.support.parentNode&&i&&i.nodeType===11&&i.childNodes.length===this.length?e={fragment:i}:e=f.buildFragment(a,this,k),h=e.fragment,h.childNodes.length===1?g=h=h.firstChild:g=h.firstChild;if(g){c=c&&f.nodeName(g,"tr");for(var l=0,m=this.length,n=m-1;l<m;l++)d.call(c?bi(this[l],g):this[l],e.cacheable||m>1&&l<n?f.clone(h,!0,!0):h)}k.length&&f.each(k,function(a,b){b.src?f.ajax({type:"GET",global:!1,url:b.src,async:!1,dataType:"script"}):f.globalEval((b.text||b.textContent||b.innerHTML||"").replace(bf,"$0")),b.parentNode&&b.parentNode.removeChild(b)})}return this}}),f.buildFragment=function(a,b,d){var e,g,h,i,j=a[0];b&&b[0]&&(i=b[0].ownerDocument||b[0]),i.createDocumentFragment||(i=c),a.length===1&&typeof j=="string"&&j.length<512&&i===c&&j.charAt(0)==="<"&&!bb.test(j)&&(f.support.checkClone||!bd.test(j))&&(f.support.html5Clone||!bc.test(j))&&(g=!0,h=f.fragments[j],h&&h!==1&&(e=h)),e||(e=i.createDocumentFragment(),f.clean(a,i,e,d)),g&&(f.fragments[j]=h?e:1);return{fragment:e,cacheable:g}},f.fragments={},f.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){f.fn[a]=function(c){var d=[],e=f(c),g=this.length===1&&this[0].parentNode;if(g&&g.nodeType===11&&g.childNodes.length===1&&e.length===1){e[b](this[0]);return this}for(var h=0,i=e.length;h<i;h++){var j=(h>0?this.clone(!0):this).get();f(e[h])[b](j),d=d.concat(j)}return this.pushStack(d,a,e.selector)}}),f.extend({clone:function(a,b,c){var d,e,g,h=f.support.html5Clone||f.isXMLDoc(a)||!bc.test("<"+a.nodeName+">")?a.cloneNode(!0):bo(a);if((!f.support.noCloneEvent||!f.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!f.isXMLDoc(a)){bk(a,h),d=bl(a),e=bl(h);for(g=0;d[g];++g)e[g]&&bk(d[g],e[g])}if(b){bj(a,h);if(c){d=bl(a),e=bl(h);for(g=0;d[g];++g)bj(d[g],e[g])}}d=e=null;return h},clean:function(a,b,d,e){var g,h,i,j=[];b=b||c,typeof b.createElement=="undefined"&&(b=b.ownerDocument||b[0]&&b[0].ownerDocument||c);for(var k=0,l;(l=a[k])!=null;k++){typeof l=="number"&&(l+="");if(!l)continue;if(typeof l=="string")if(!_.test(l))l=b.createTextNode(l);else{l=l.replace(Y,"<$1></$2>");var m=(Z.exec(l)||["",""])[1].toLowerCase(),n=bg[m]||bg._default,o=n[0],p=b.createElement("div"),q=bh.childNodes,r;b===c?bh.appendChild(p):U(b).appendChild(p),p.innerHTML=n[1]+l+n[2];while(o--)p=p.lastChild;if(!f.support.tbody){var s=$.test(l),t=m==="table"&&!s?p.firstChild&&p.firstChild.childNodes:n[1]==="<table>"&&!s?p.childNodes:[];for(i=t.length-1;i>=0;--i)f.nodeName(t[i],"tbody")&&!t[i].childNodes.length&&t[i].parentNode.removeChild(t[i])}!f.support.leadingWhitespace&&X.test(l)&&p.insertBefore(b.createTextNode(X.exec(l)[0]),p.firstChild),l=p.childNodes,p&&(p.parentNode.removeChild(p),q.length>0&&(r=q[q.length-1],r&&r.parentNode&&r.parentNode.removeChild(r)))}var u;if(!f.support.appendChecked)if(l[0]&&typeof (u=l.length)=="number")for(i=0;i<u;i++)bn(l[i]);else bn(l);l.nodeType?j.push(l):j=f.merge(j,l)}if(d){g=function(a){return!a.type||be.test(a.type)};for(k=0;j[k];k++){h=j[k];if(e&&f.nodeName(h,"script")&&(!h.type||be.test(h.type)))e.push(h.parentNode?h.parentNode.removeChild(h):h);else{if(h.nodeType===1){var v=f.grep(h.getElementsByTagName("script"),g);j.splice.apply(j,[k+1,0].concat(v))}d.appendChild(h)}}}return j},cleanData:function(a){var b,c,d=f.cache,e=f.event.special,g=f.support.deleteExpando;for(var h=0,i;(i=a[h])!=null;h++){if(i.nodeName&&f.noData[i.nodeName.toLowerCase()])continue;c=i[f.expando];if(c){b=d[c];if(b&&b.events){for(var j in b.events)e[j]?f.event.remove(i,j):f.removeEvent(i,j,b.handle);b.handle&&(b.handle.elem=null)}g?delete i[f.expando]:i.removeAttribute&&i.removeAttribute(f.expando),delete d[c]}}}});var bp=/alpha\([^)]*\)/i,bq=/opacity=([^)]*)/,br=/([A-Z]|^ms)/g,bs=/^[\-+]?(?:\d*\.)?\d+$/i,bt=/^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,bu=/^([\-+])=([\-+.\de]+)/,bv=/^margin/,bw={position:"absolute",visibility:"hidden",display:"block"},bx=["Top","Right","Bottom","Left"],by,bz,bA;f.fn.css=function(a,c){return f.access(this,function(a,c,d){return d!==b?f.style(a,c,d):f.css(a,c)},a,c,arguments.length>1)},f.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=by(a,"opacity");return c===""?"1":c}return a.style.opacity}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":f.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!!a&&a.nodeType!==3&&a.nodeType!==8&&!!a.style){var g,h,i=f.camelCase(c),j=a.style,k=f.cssHooks[i];c=f.cssProps[i]||i;if(d===b){if(k&&"get"in k&&(g=k.get(a,!1,e))!==b)return g;return j[c]}h=typeof d,h==="string"&&(g=bu.exec(d))&&(d=+(g[1]+1)*+g[2]+parseFloat(f.css(a,c)),h="number");if(d==null||h==="number"&&isNaN(d))return;h==="number"&&!f.cssNumber[i]&&(d+="px");if(!k||!("set"in k)||(d=k.set(a,d))!==b)try{j[c]=d}catch(l){}}},css:function(a,c,d){var e,g;c=f.camelCase(c),g=f.cssHooks[c],c=f.cssProps[c]||c,c==="cssFloat"&&(c="float");if(g&&"get"in g&&(e=g.get(a,!0,d))!==b)return e;if(by)return by(a,c)},swap:function(a,b,c){var d={},e,f;for(f in b)d[f]=a.style[f],a.style[f]=b[f];e=c.call(a);for(f in b)a.style[f]=d[f];return e}}),f.curCSS=f.css,c.defaultView&&c.defaultView.getComputedStyle&&(bz=function(a,b){var c,d,e,g,h=a.style;b=b.replace(br,"-$1").toLowerCase(),(d=a.ownerDocument.defaultView)&&(e=d.getComputedStyle(a,null))&&(c=e.getPropertyValue(b),c===""&&!f.contains(a.ownerDocument.documentElement,a)&&(c=f.style(a,b))),!f.support.pixelMargin&&e&&bv.test(b)&&bt.test(c)&&(g=h.width,h.width=c,c=e.width,h.width=g);return c}),c.documentElement.currentStyle&&(bA=function(a,b){var c,d,e,f=a.currentStyle&&a.currentStyle[b],g=a.style;f==null&&g&&(e=g[b])&&(f=e),bt.test(f)&&(c=g.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),g.left=b==="fontSize"?"1em":f,f=g.pixelLeft+"px",g.left=c,d&&(a.runtimeStyle.left=d));return f===""?"auto":f}),by=bz||bA,f.each(["height","width"],function(a,b){f.cssHooks[b]={get:function(a,c,d){if(c)return a.offsetWidth!==0?bB(a,b,d):f.swap(a,bw,function(){return bB(a,b,d)})},set:function(a,b){return bs.test(b)?b+"px":b}}}),f.support.opacity||(f.cssHooks.opacity={get:function(a,b){return bq.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=f.isNumeric(b)?"alpha(opacity="+b*100+")":"",g=d&&d.filter||c.filter||"";c.zoom=1;if(b>=1&&f.trim(g.replace(bp,""))===""){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bp.test(g)?g.replace(bp,e):g+" "+e}}),f(function(){f.support.reliableMarginRight||(f.cssHooks.marginRight={get:function(a,b){return f.swap(a,{display:"inline-block"},function(){return b?by(a,"margin-right"):a.style.marginRight})}})}),f.expr&&f.expr.filters&&(f.expr.filters.hidden=function(a){var b=a.offsetWidth,c=a.offsetHeight;return b===0&&c===0||!f.support.reliableHiddenOffsets&&(a.style&&a.style.display||f.css(a,"display"))==="none"},f.expr.filters.visible=function(a){return!f.expr.filters.hidden(a)}),f.each({margin:"",padding:"",border:"Width"},function(a,b){f.cssHooks[a+b]={expand:function(c){var d,e=typeof c=="string"?c.split(" "):[c],f={};for(d=0;d<4;d++)f[a+bx[d]+b]=e[d]||e[d-2]||e[0];return f}}});var bC=/%20/g,bD=/\[\]$/,bE=/\r?\n/g,bF=/#.*$/,bG=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,bH=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,bI=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,bJ=/^(?:GET|HEAD)$/,bK=/^\/\//,bL=/\?/,bM=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bN=/^(?:select|textarea)/i,bO=/\s+/,bP=/([?&])_=[^&]*/,bQ=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,bR=f.fn.load,bS={},bT={},bU,bV,bW=["*/"]+["*"];try{bU=e.href}catch(bX){bU=c.createElement("a"),bU.href="",bU=bU.href}bV=bQ.exec(bU.toLowerCase())||[],f.fn.extend({load:function(a,c,d){if(typeof a!="string"&&bR)return bR.apply(this,arguments);if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var g=a.slice(e,a.length);a=a.slice(0,e)}var h="GET";c&&(f.isFunction(c)?(d=c,c=b):typeof c=="object"&&(c=f.param(c,f.ajaxSettings.traditional),h="POST"));var i=this;f.ajax({url:a,type:h,dataType:"html",data:c,complete:function(a,b,c){c=a.responseText,a.isResolved()&&(a.done(function(a){c=a}),i.html(g?f("<div>").append(c.replace(bM,"")).find(g):c)),d&&i.each(d,[c,b,a])}});return this},serialize:function(){return f.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?f.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||bN.test(this.nodeName)||bH.test(this.type))}).map(function(a,b){var c=f(this).val();return c==null?null:f.isArray(c)?f.map(c,function(a,c){return{name:b.name,value:a.replace(bE,"\r\n")}}):{name:b.name,value:c.replace(bE,"\r\n")}}).get()}}),f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){f.fn[b]=function(a){return this.on(b,a)}}),f.each(["get","post"],function(a,c){f[c]=function(a,d,e,g){f.isFunction(d)&&(g=g||e,e=d,d=b);return f.ajax({type:c,url:a,data:d,success:e,dataType:g})}}),f.extend({getScript:function(a,c){return f.get(a,b,c,"script")},getJSON:function(a,b,c){return f.get(a,b,c,"json")},ajaxSetup:function(a,b){b?b$(a,f.ajaxSettings):(b=a,a=f.ajaxSettings),b$(a,b);return a},ajaxSettings:{url:bU,isLocal:bI.test(bV[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":bW},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":f.parseJSON,"text xml":f.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:bY(bS),ajaxTransport:bY(bT),ajax:function(a,c){function w(a,c,l,m){if(s!==2){s=2,q&&clearTimeout(q),p=b,n=m||"",v.readyState=a>0?4:0;var o,r,u,w=c,x=l?ca(d,v,l):b,y,z;if(a>=200&&a<300||a===304){if(d.ifModified){if(y=v.getResponseHeader("Last-Modified"))f.lastModified[k]=y;if(z=v.getResponseHeader("Etag"))f.etag[k]=z}if(a===304)w="notmodified",o=!0;else try{r=cb(d,x),w="success",o=!0}catch(A){w="parsererror",u=A}}else{u=w;if(!w||a)w="error",a<0&&(a=0)}v.status=a,v.statusText=""+(c||w),o?h.resolveWith(e,[r,w,v]):h.rejectWith(e,[v,w,u]),v.statusCode(j),j=b,t&&g.trigger("ajax"+(o?"Success":"Error"),[v,d,o?r:u]),i.fireWith(e,[v,w]),t&&(g.trigger("ajaxComplete",[v,d]),--f.active||f.event.trigger("ajaxStop"))}}typeof a=="object"&&(c=a,a=b),c=c||{};var d=f.ajaxSetup({},c),e=d.context||d,g=e!==d&&(e.nodeType||e instanceof f)?f(e):f.event,h=f.Deferred(),i=f.Callbacks("once memory"),j=d.statusCode||{},k,l={},m={},n,o,p,q,r,s=0,t,u,v={readyState:0,setRequestHeader:function(a,b){if(!s){var c=a.toLowerCase();a=m[c]=m[c]||a,l[a]=b}return this},getAllResponseHeaders:function(){return s===2?n:null},getResponseHeader:function(a){var c;if(s===2){if(!o){o={};while(c=bG.exec(n))o[c[1].toLowerCase()]=c[2]}c=o[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){s||(d.mimeType=a);return this},abort:function(a){a=a||"abort",p&&p.abort(a),w(0,a);return this}};h.promise(v),v.success=v.done,v.error=v.fail,v.complete=i.add,v.statusCode=function(a){if(a){var b;if(s<2)for(b in a)j[b]=[j[b],a[b]];else b=a[v.status],v.then(b,b)}return this},d.url=((a||d.url)+"").replace(bF,"").replace(bK,bV[1]+""),d.dataTypes=f.trim(d.dataType||"*").toLowerCase().split(bO),d.crossDomain==null&&(r=bQ.exec(d.url.toLowerCase()),d.crossDomain=!(!r||r[1]==bV[1]&&r[2]==bV[2]&&(r[3]||(r[1]==="http:"?80:443))==(bV[3]||(bV[1]==="http:"?80:443)))),d.data&&d.processData&&typeof d.data!="string"&&(d.data=f.param(d.data,d.traditional)),bZ(bS,d,c,v);if(s===2)return!1;t=d.global,d.type=d.type.toUpperCase(),d.hasContent=!bJ.test(d.type),t&&f.active++===0&&f.event.trigger("ajaxStart");if(!d.hasContent){d.data&&(d.url+=(bL.test(d.url)?"&":"?")+d.data,delete d.data),k=d.url;if(d.cache===!1){var x=f.now(),y=d.url.replace(bP,"$1_="+x);d.url=y+(y===d.url?(bL.test(d.url)?"&":"?")+"_="+x:"")}}(d.data&&d.hasContent&&d.contentType!==!1||c.contentType)&&v.setRequestHeader("Content-Type",d.contentType),d.ifModified&&(k=k||d.url,f.lastModified[k]&&v.setRequestHeader("If-Modified-Since",f.lastModified[k]),f.etag[k]&&v.setRequestHeader("If-None-Match",f.etag[k])),v.setRequestHeader("Accept",d.dataTypes[0]&&d.accepts[d.dataTypes[0]]?d.accepts[d.dataTypes[0]]+(d.dataTypes[0]!=="*"?", "+bW+"; q=0.01":""):d.accepts["*"]);for(u in d.headers)v.setRequestHeader(u,d.headers[u]);if(d.beforeSend&&(d.beforeSend.call(e,v,d)===!1||s===2)){v.abort();return!1}for(u in{success:1,error:1,complete:1})v[u](d[u]);p=bZ(bT,d,c,v);if(!p)w(-1,"No Transport");else{v.readyState=1,t&&g.trigger("ajaxSend",[v,d]),d.async&&d.timeout>0&&(q=setTimeout(function(){v.abort("timeout")},d.timeout));try{s=1,p.send(l,w)}catch(z){if(s<2)w(-1,z);else throw z}}return v},param:function(a,c){var d=[],e=function(a,b){b=f.isFunction(b)?b():b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=f.ajaxSettings.traditional);if(f.isArray(a)||a.jquery&&!f.isPlainObject(a))f.each(a,function(){e(this.name,this.value)});else for(var g in a)b_(g,a[g],c,e);return d.join("&").replace(bC,"+")}}),f.extend({active:0,lastModified:{},etag:{}});var cc=f.now(),cd=/(\=)\?(&|$)|\?\?/i;f.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return f.expando+"_"+cc++}}),f.ajaxPrefilter("json jsonp",function(b,c,d){var e=typeof b.data=="string"&&/^application\/x\-www\-form\-urlencoded/.test(b.contentType);if(b.dataTypes[0]==="jsonp"||b.jsonp!==!1&&(cd.test(b.url)||e&&cd.test(b.data))){var g,h=b.jsonpCallback=f.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,i=a[h],j=b.url,k=b.data,l="$1"+h+"$2";b.jsonp!==!1&&(j=j.replace(cd,l),b.url===j&&(e&&(k=k.replace(cd,l)),b.data===k&&(j+=(/\?/.test(j)?"&":"?")+b.jsonp+"="+h))),b.url=j,b.data=k,a[h]=function(a){g=[a]},d.always(function(){a[h]=i,g&&f.isFunction(i)&&a[h](g[0])}),b.converters["script json"]=function(){g||f.error(h+" was not called");return g[0]},b.dataTypes[0]="json";return"script"}}),f.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){f.globalEval(a);return a}}}),f.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),f.ajaxTransport("script",function(a){if(a.crossDomain){var d,e=c.head||c.getElementsByTagName("head")[0]||c.documentElement;return{send:function(f,g){d=c.createElement("script"),d.async="async",a.scriptCharset&&(d.charset=a.scriptCharset),d.src=a.url,d.onload=d.onreadystatechange=function(a,c){if(c||!d.readyState||/loaded|complete/.test(d.readyState))d.onload=d.onreadystatechange=null,e&&d.parentNode&&e.removeChild(d),d=b,c||g(200,"success")},e.insertBefore(d,e.firstChild)},abort:function(){d&&d.onload(0,1)}}}});var ce=a.ActiveXObject?function(){for(var a in cg)cg[a](0,1)}:!1,cf=0,cg;f.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&ch()||ci()}:ch,function(a){f.extend(f.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})}(f.ajaxSettings.xhr()),f.support.ajax&&f.ajaxTransport(function(c){if(!c.crossDomain||f.support.cors){var d;return{send:function(e,g){var h=c.xhr(),i,j;c.username?h.open(c.type,c.url,c.async,c.username,c.password):h.open(c.type,c.url,c.async);if(c.xhrFields)for(j in c.xhrFields)h[j]=c.xhrFields[j];c.mimeType&&h.overrideMimeType&&h.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(j in e)h.setRequestHeader(j,e[j])}catch(k){}h.send(c.hasContent&&c.data||null),d=function(a,e){var j,k,l,m,n;try{if(d&&(e||h.readyState===4)){d=b,i&&(h.onreadystatechange=f.noop,ce&&delete cg[i]);if(e)h.readyState!==4&&h.abort();else{j=h.status,l=h.getAllResponseHeaders(),m={},n=h.responseXML,n&&n.documentElement&&(m.xml=n);try{m.text=h.responseText}catch(a){}try{k=h.statusText}catch(o){k=""}!j&&c.isLocal&&!c.crossDomain?j=m.text?200:404:j===1223&&(j=204)}}}catch(p){e||g(-1,p)}m&&g(j,k,m,l)},!c.async||h.readyState===4?d():(i=++cf,ce&&(cg||(cg={},f(a).unload(ce)),cg[i]=d),h.onreadystatechange=d)},abort:function(){d&&d(0,1)}}}});var cj={},ck,cl,cm=/^(?:toggle|show|hide)$/,cn=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,co,cp=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],cq;f.fn.extend({show:function(a,b,c){var d,e;if(a||a===0)return this.animate(ct("show",3),a,b,c);for(var g=0,h=this.length;g<h;g++)d=this[g],d.style&&(e=d.style.display,!f._data(d,"olddisplay")&&e==="none"&&(e=d.style.display=""),(e===""&&f.css(d,"display")==="none"||!f.contains(d.ownerDocument.documentElement,d))&&f._data(d,"olddisplay",cu(d.nodeName)));for(g=0;g<h;g++){d=this[g];if(d.style){e=d.style.display;if(e===""||e==="none")d.style.display=f._data(d,"olddisplay")||""}}return this},hide:function(a,b,c){if(a||a===0)return this.animate(ct("hide",3),a,b,c);var d,e,g=0,h=this.length;for(;g<h;g++)d=this[g],d.style&&(e=f.css(d,"display"),e!=="none"&&!f._data(d,"olddisplay")&&f._data(d,"olddisplay",e));for(g=0;g<h;g++)this[g].style&&(this[g].style.display="none");return this},_toggle:f.fn.toggle,toggle:function(a,b,c){var d=typeof a=="boolean";f.isFunction(a)&&f.isFunction(b)?this._toggle.apply(this,arguments):a==null||d?this.each(function(){var b=d?a:f(this).is(":hidden");f(this)[b?"show":"hide"]()}):this.animate(ct("toggle",3),a,b,c);return this},fadeTo:function(a,b,c,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){function g(){e.queue===!1&&f._mark(this);var b=f.extend({},e),c=this.nodeType===1,d=c&&f(this).is(":hidden"),g,h,i,j,k,l,m,n,o,p,q;b.animatedProperties={};for(i in a){g=f.camelCase(i),i!==g&&(a[g]=a[i],delete a[i]);if((k=f.cssHooks[g])&&"expand"in k){l=k.expand(a[g]),delete a[g];for(i in l)i in a||(a[i]=l[i])}}for(g in a){h=a[g],f.isArray(h)?(b.animatedProperties[g]=h[1],h=a[g]=h[0]):b.animatedProperties[g]=b.specialEasing&&b.specialEasing[g]||b.easing||"swing";if(h==="hide"&&d||h==="show"&&!d)return b.complete.call(this);c&&(g==="height"||g==="width")&&(b.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY],f.css(this,"display")==="inline"&&f.css(this,"float")==="none"&&(!f.support.inlineBlockNeedsLayout||cu(this.nodeName)==="inline"?this.style.display="inline-block":this.style.zoom=1))}b.overflow!=null&&(this.style.overflow="hidden");for(i in a)j=new f.fx(this,b,i),h=a[i],cm.test(h)?(q=f._data(this,"toggle"+i)||(h==="toggle"?d?"show":"hide":0),q?(f._data(this,"toggle"+i,q==="show"?"hide":"show"),j[q]()):j[h]()):(m=cn.exec(h),n=j.cur(),m?(o=parseFloat(m[2]),p=m[3]||(f.cssNumber[i]?"":"px"),p!=="px"&&(f.style(this,i,(o||1)+p),n=(o||1)/j.cur()*n,f.style(this,i,n+p)),m[1]&&(o=(m[1]==="-="?-1:1)*o+n),j.custom(n,o,p)):j.custom(n,h,""));return!0}var e=f.speed(b,c,d);if(f.isEmptyObject(a))return this.each(e.complete,[!1]);a=f.extend({},a);return e.queue===!1?this.each(g):this.queue(e.queue,g)},stop:function(a,c,d){typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]);return this.each(function(){function h(a,b,c){var e=b[c];f.removeData(a,c,!0),e.stop(d)}var b,c=!1,e=f.timers,g=f._data(this);d||f._unmark(!0,this);if(a==null)for(b in g)g[b]&&g[b].stop&&b.indexOf(".run")===b.length-4&&h(this,g,b);else g[b=a+".run"]&&g[b].stop&&h(this,g,b);for(b=e.length;b--;)e[b].elem===this&&(a==null||e[b].queue===a)&&(d?e[b](!0):e[b].saveState(),c=!0,e.splice(b,1));(!d||!c)&&f.dequeue(this,a)})}}),f.each({slideDown:ct("show",1),slideUp:ct("hide",1),slideToggle:ct("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){f.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),f.extend({speed:function(a,b,c){var d=a&&typeof a=="object"?f.extend({},a):{complete:c||!c&&b||f.isFunction(a)&&a,duration:a,easing:c&&b||b&&!f.isFunction(b)&&b};d.duration=f.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in f.fx.speeds?f.fx.speeds[d.duration]:f.fx.speeds._default;if(d.queue==null||d.queue===!0)d.queue="fx";d.old=d.complete,d.complete=function(a){f.isFunction(d.old)&&d.old.call(this),d.queue?f.dequeue(this,d.queue):a!==!1&&f._unmark(this)};return d},easing:{linear:function(a){return a},swing:function(a){return-Math.cos(a*Math.PI)/2+.5}},timers:[],fx:function(a,b,c){this.options=b,this.elem=a,this.prop=c,b.orig=b.orig||{}}}),f.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),(f.fx.step[this.prop]||f.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a,b=f.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,c,d){function h(a){return e.step(a)}var e=this,g=f.fx;this.startTime=cq||cr(),this.end=c,this.now=this.start=a,this.pos=this.state=0,this.unit=d||this.unit||(f.cssNumber[this.prop]?"":"px"),h.queue=this.options.queue,h.elem=this.elem,h.saveState=function(){f._data(e.elem,"fxshow"+e.prop)===b&&(e.options.hide?f._data(e.elem,"fxshow"+e.prop,e.start):e.options.show&&f._data(e.elem,"fxshow"+e.prop,e.end))},h()&&f.timers.push(h)&&!co&&(co=setInterval(g.tick,g.interval))},show:function(){var a=f._data(this.elem,"fxshow"+this.prop);this.options.orig[this.prop]=a||f.style(this.elem,this.prop),this.options.show=!0,a!==b?this.custom(this.cur(),a):this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),f(this.elem).show()},hide:function(){this.options.orig[this.prop]=f._data(this.elem,"fxshow"+this.prop)||f.style(this.elem,this.prop),this.options.hide=!0,this.custom(this.cur(),0)},step:function(a){var b,c,d,e=cq||cr(),g=!0,h=this.elem,i=this.options;if(a||e>=i.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),i.animatedProperties[this.prop]=!0;for(b in i.animatedProperties)i.animatedProperties[b]!==!0&&(g=!1);if(g){i.overflow!=null&&!f.support.shrinkWrapBlocks&&f.each(["","X","Y"],function(a,b){h.style["overflow"+b]=i.overflow[a]}),i.hide&&f(h).hide();if(i.hide||i.show)for(b in i.animatedProperties)f.style(h,b,i.orig[b]),f.removeData(h,"fxshow"+b,!0),f.removeData(h,"toggle"+b,!0);d=i.complete,d&&(i.complete=!1,d.call(h))}return!1}i.duration==Infinity?this.now=e:(c=e-this.startTime,this.state=c/i.duration,this.pos=f.easing[i.animatedProperties[this.prop]](this.state,c,0,1,i.duration),this.now=this.start+(this.end-this.start)*this.pos),this.update();return!0}},f.extend(f.fx,{tick:function(){var a,b=f.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||f.fx.stop()},interval:13,stop:function(){clearInterval(co),co=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){f.style(a.elem,"opacity",a.now)},_default:function(a){a.elem.style&&a.elem.style[a.prop]!=null?a.elem.style[a.prop]=a.now+a.unit:a.elem[a.prop]=a.now}}}),f.each(cp.concat.apply([],cp),function(a,b){b.indexOf("margin")&&(f.fx.step[b]=function(a){f.style(a.elem,b,Math.max(0,a.now)+a.unit)})}),f.expr&&f.expr.filters&&(f.expr.filters.animated=function(a){return f.grep(f.timers,function(b){return a===b.elem}).length});var cv,cw=/^t(?:able|d|h)$/i,cx=/^(?:body|html)$/i;"getBoundingClientRect"in c.documentElement?cv=function(a,b,c,d){try{d=a.getBoundingClientRect()}catch(e){}if(!d||!f.contains(c,a))return d?{top:d.top,left:d.left}:{top:0,left:0};var g=b.body,h=cy(b),i=c.clientTop||g.clientTop||0,j=c.clientLeft||g.clientLeft||0,k=h.pageYOffset||f.support.boxModel&&c.scrollTop||g.scrollTop,l=h.pageXOffset||f.support.boxModel&&c.scrollLeft||g.scrollLeft,m=d.top+k-i,n=d.left+l-j;return{top:m,left:n}}:cv=function(a,b,c){var d,e=a.offsetParent,g=a,h=b.body,i=b.defaultView,j=i?i.getComputedStyle(a,null):a.currentStyle,k=a.offsetTop,l=a.offsetLeft;while((a=a.parentNode)&&a!==h&&a!==c){if(f.support.fixedPosition&&j.position==="fixed")break;d=i?i.getComputedStyle(a,null):a.currentStyle,k-=a.scrollTop,l-=a.scrollLeft,a===e&&(k+=a.offsetTop,l+=a.offsetLeft,f.support.doesNotAddBorder&&(!f.support.doesAddBorderForTableAndCells||!cw.test(a.nodeName))&&(k+=parseFloat(d.borderTopWidth)||0,l+=parseFloat(d.borderLeftWidth)||0),g=e,e=a.offsetParent),f.support.subtractsBorderForOverflowNotVisible&&d.overflow!=="visible"&&(k+=parseFloat(d.borderTopWidth)||0,l+=parseFloat(d.borderLeftWidth)||0),j=d}if(j.position==="relative"||j.position==="static")k+=h.offsetTop,l+=h.offsetLeft;f.support.fixedPosition&&j.position==="fixed"&&(k+=Math.max(c.scrollTop,h.scrollTop),l+=Math.max(c.scrollLeft,h.scrollLeft));return{top:k,left:l}},f.fn.offset=function(a){if(arguments.length)return a===b?this:this.each(function(b){f.offset.setOffset(this,a,b)});var c=this[0],d=c&&c.ownerDocument;if(!d)return null;if(c===d.body)return f.offset.bodyOffset(c);return cv(c,d,d.documentElement)},f.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;f.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(f.css(a,"marginTop"))||0,c+=parseFloat(f.css(a,"marginLeft"))||0);return{top:b,left:c}},setOffset:function(a,b,c){var d=f.css(a,"position");d==="static"&&(a.style.position="relative");var e=f(a),g=e.offset(),h=f.css(a,"top"),i=f.css(a,"left"),j=(d==="absolute"||d==="fixed")&&f.inArray("auto",[h,i])>-1,k={},l={},m,n;j?(l=e.position(),m=l.top,n=l.left):(m=parseFloat(h)||0,n=parseFloat(i)||0),f.isFunction(b)&&(b=b.call(a,c,g)),b.top!=null&&(k.top=b.top-g.top+m),b.left!=null&&(k.left=b.left-g.left+n),"using"in b?b.using.call(a,k):e.css(k)}},f.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),c=this.offset(),d=cx.test(b[0].nodeName)?{top:0,left:0}:b.offset();c.top-=parseFloat(f.css(a,"marginTop"))||0,c.left-=parseFloat(f.css(a,"marginLeft"))||0,d.top+=parseFloat(f.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(f.css(b[0],"borderLeftWidth"))||0;return{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||c.body;while(a&&!cx.test(a.nodeName)&&f.css(a,"position")==="static")a=a.offsetParent;return a})}}),f.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);f.fn[a]=function(e){return f.access(this,function(a,e,g){var h=cy(a);if(g===b)return h?c in h?h[c]:f.support.boxModel&&h.document.documentElement[e]||h.document.body[e]:a[e];h?h.scrollTo(d?f(h).scrollLeft():g,d?g:f(h).scrollTop()):a[e]=g},a,e,arguments.length,null)}}),f.each({Height:"height",Width:"width"},function(a,c){var d="client"+a,e="scroll"+a,g="offset"+a;f.fn["inner"+a]=function(){var a=this[0];return a?a.style?parseFloat(f.css(a,c,"padding")):this[c]():null},f.fn["outer"+a]=function(a){var b=this[0];return b?b.style?parseFloat(f.css(b,c,a?"margin":"border")):this[c]():null},f.fn[c]=function(a){return f.access(this,function(a,c,h){var i,j,k,l;if(f.isWindow(a)){i=a.document,j=i.documentElement[d];return f.support.boxModel&&j||i.body&&i.body[d]||j}if(a.nodeType===9){i=a.documentElement;if(i[d]>=i[e])return i[d];return Math.max(a.body[e],i[e],a.body[g],i[g])}if(h===b){k=f.css(a,c),l=parseFloat(k);return f.isNumeric(l)?l:k}f(a).css(c,h)},c,a,arguments.length,null)}}),a.jQuery=a.$=f,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return f})})(window);

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
* Licensed under the MIT License (LICENSE.txt).
*
* Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
* Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
* Thanks to: Seamus Leahy for adding deltaX and deltaY
*
* Version: 3.0.6
*
* Requires: 1.2.2+
*/

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },

    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },

    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";

    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail ) { delta = -orgEvent.detail/3; }

    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;

    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }

    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }

    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);

    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);

/*! jQuery UI - v1.10.3 - 2013-08-21
* http://jqueryui.com
* Includes: jquery.ui.core.js, jquery.ui.widget.js, jquery.ui.mouse.js, jquery.ui.position.js, jquery.ui.slider.js
* Copyright 2013 jQuery Foundation and other contributors Licensed MIT */

(function( $, undefined ) {

var uuid = 0,
	runiqueId = /^ui-id-\d+$/;

// $.ui might exist from components with no dependencies, e.g., $.ui.position
$.ui = $.ui || {};

$.extend( $.ui, {
	version: "1.10.3",

	keyCode: {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	}
});

// plugins
$.fn.extend({
	focus: (function( orig ) {
		return function( delay, fn ) {
			return typeof delay === "number" ?
				this.each(function() {
					var elem = this;
					setTimeout(function() {
						$( elem ).focus();
						if ( fn ) {
							fn.call( elem );
						}
					}, delay );
				}) :
				orig.apply( this, arguments );
		};
	})( $.fn.focus ),

	scrollParent: function() {
		var scrollParent;
		if (($.ui.ie && (/(static|relative)/).test(this.css("position"))) || (/absolute/).test(this.css("position"))) {
			scrollParent = this.parents().filter(function() {
				return (/(relative|absolute|fixed)/).test($.css(this,"position")) && (/(auto|scroll)/).test($.css(this,"overflow")+$.css(this,"overflow-y")+$.css(this,"overflow-x"));
			}).eq(0);
		} else {
			scrollParent = this.parents().filter(function() {
				return (/(auto|scroll)/).test($.css(this,"overflow")+$.css(this,"overflow-y")+$.css(this,"overflow-x"));
			}).eq(0);
		}

		return (/fixed/).test(this.css("position")) || !scrollParent.length ? $(document) : scrollParent;
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ), 10 );
					if ( !isNaN( value ) && value !== 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	},

	uniqueId: function() {
		return this.each(function() {
			if ( !this.id ) {
				this.id = "ui-id-" + (++uuid);
			}
		});
	},

	removeUniqueId: function() {
		return this.each(function() {
			if ( runiqueId.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		});
	}
});

// selectors
function focusable( element, isTabIndexNotNaN ) {
	var map, mapName, img,
		nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		map = element.parentNode;
		mapName = map.name;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap=#" + mapName + "]" )[0];
		return !!img && visible( img );
	}
	return ( /input|select|textarea|button|object/.test( nodeName ) ?
		!element.disabled :
		"a" === nodeName ?
			element.href || isTabIndexNotNaN :
			isTabIndexNotNaN) &&
		// the element and all of its ancestors must be visible
		visible( element );
}

function visible( element ) {
	return $.expr.filters.visible( element ) &&
		!$( element ).parents().addBack().filter(function() {
			return $.css( this, "visibility" ) === "hidden";
		}).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo(function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		}) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},

	focusable: function( element ) {
		return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			isTabIndexNaN = isNaN( tabIndex );
		return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
	}
});

// support: jQuery <1.8
if ( !$( "<a>" ).outerWidth( 1 ).jquery ) {
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.css( elem, "padding" + this ) ) || 0;
				if ( border ) {
					size -= parseFloat( $.css( elem, "border" + this + "Width" ) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.css( elem, "margin" + this ) ) || 0;
				}
			});
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each(function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			});
		};

		$.fn[ "outer" + name] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each(function() {
				$( this).css( type, reduce( this, size, true, margin ) + "px" );
			});
		};
	});
}

// support: jQuery <1.8
if ( !$.fn.addBack ) {
	$.fn.addBack = function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	};
}

// support: jQuery 1.6.1, 1.6.2 (http://bugs.jquery.com/ticket/9413)
if ( $( "<a>" ).data( "a-b", "a" ).removeData( "a-b" ).data( "a-b" ) ) {
	$.fn.removeData = (function( removeData ) {
		return function( key ) {
			if ( arguments.length ) {
				return removeData.call( this, $.camelCase( key ) );
			} else {
				return removeData.call( this );
			}
		};
	})( $.fn.removeData );
}





// deprecated
$.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );

$.support.selectstart = "onselectstart" in document.createElement( "div" );
$.fn.extend({
	disableSelection: function() {
		return this.bind( ( $.support.selectstart ? "selectstart" : "mousedown" ) +
			".ui-disableSelection", function( event ) {
				event.preventDefault();
			});
	},

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	}
});

$.extend( $.ui, {
	// $.ui.plugin is deprecated. Use $.widget() extensions instead.
	plugin: {
		add: function( module, option, set ) {
			var i,
				proto = $.ui[ module ].prototype;
			for ( i in set ) {
				proto.plugins[ i ] = proto.plugins[ i ] || [];
				proto.plugins[ i ].push( [ option, set[ i ] ] );
			}
		},
		call: function( instance, name, args ) {
			var i,
				set = instance.plugins[ name ];
			if ( !set || !instance.element[ 0 ].parentNode || instance.element[ 0 ].parentNode.nodeType === 11 ) {
				return;
			}

			for ( i = 0; i < set.length; i++ ) {
				if ( instance.options[ set[ i ][ 0 ] ] ) {
					set[ i ][ 1 ].apply( instance.element, args );
				}
			}
		}
	},

	// only used by resizable
	hasScroll: function( el, a ) {

		//If overflow is hidden, the element might have extra content, but the user wants to hide it
		if ( $( el ).css( "overflow" ) === "hidden") {
			return false;
		}

		var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
			has = false;

		if ( el[ scroll ] > 0 ) {
			return true;
		}

		// TODO: determine which cases actually cause this to happen
		// if the element doesn't have the scroll set, see if it's possible to
		// set the scroll
		el[ scroll ] = 1;
		has = ( el[ scroll ] > 0 );
		el[ scroll ] = 0;
		return has;
	}
});

})( jQuery );
(function( $, undefined ) {

var uuid = 0,
	slice = Array.prototype.slice,
	_cleanData = $.cleanData;
$.cleanData = function( elems ) {
	for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
		try {
			$( elem ).triggerHandler( "remove" );
		// http://bugs.jquery.com/ticket/8235
		} catch( e ) {}
	}
	_cleanData( elems );
};

$.widget = function( name, base, prototype ) {
	var fullName, existingConstructor, constructor, basePrototype,
		// proxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		proxiedPrototype = {},
		namespace = name.split( "." )[ 0 ];

	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};
	// extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,
		// copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),
		// track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	});

	basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = (function() {
			var _super = function() {
					return base.prototype[ prop ].apply( this, arguments );
				},
				_superApply = function( args ) {
					return base.prototype[ prop ].apply( this, args );
				};
			return function() {
				var __super = this._super,
					__superApply = this._superApply,
					returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		})();
	});
	constructor.prototype = $.widget.extend( basePrototype, {
		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? basePrototype.widgetEventPrefix : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	});

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
		});
		// remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );
};

$.widget.extend = function( target ) {
	var input = slice.call( arguments, 1 ),
		inputIndex = 0,
		inputLength = input.length,
		key,
		value;
	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :
						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );
				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.widget.extend.apply( null, [ options ].concat(args) ) :
			options;

		if ( isMethodCall ) {
			this.each(function() {
				var methodValue,
					instance = $.data( this, fullName );
				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}
				if ( !$.isFunction( instance[options] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}
				methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} )._init();
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",
	options: {
		disabled: false,

		// callbacks
		create: null
	},
	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = uuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;
		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			});
			this.document = $( element.style ?
				// element within the document
				element.ownerDocument :
				// element is window or document
				element.document || element );
			this.window = $( this.document[0].defaultView || this.document[0].parentWindow );
		}

		this._create();
		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},
	_getCreateOptions: $.noop,
	_getCreateEventData: $.noop,
	_create: $.noop,
	_init: $.noop,

	destroy: function() {
		this._destroy();
		// we can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.unbind( this.eventNamespace )
			// 1.9 BC for #7810
			// TODO remove dual storage
			.removeData( this.widgetName )
			.removeData( this.widgetFullName )
			// support: jquery <1.6.3
			// http://bugs.jquery.com/ticket/9413
			.removeData( $.camelCase( this.widgetFullName ) );
		this.widget()
			.unbind( this.eventNamespace )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetFullName + "-disabled " +
				"ui-state-disabled" );

		// clean up events and states
		this.bindings.unbind( this.eventNamespace );
		this.hoverable.removeClass( "ui-state-hover" );
		this.focusable.removeClass( "ui-state-focus" );
	},
	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key,
			parts,
			curOption,
			i;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {
			// handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( value === undefined ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( value === undefined ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				.toggleClass( this.widgetFullName + "-disabled ui-state-disabled", !!value )
				.attr( "aria-disabled", value );
			this.hoverable.removeClass( "ui-state-hover" );
			this.focusable.removeClass( "ui-state-focus" );
		}

		return this;
	},

	enable: function() {
		return this._setOption( "disabled", false );
	},
	disable: function() {
		return this._setOption( "disabled", true );
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement,
			instance = this;

		// no suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// no element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			// accept selectors, DOM elements
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^(\w+)\s*(.*)$/ ),
				eventName = match[1] + instance.eventNamespace,
				selector = match[2];
			if ( selector ) {
				delegateElement.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},

	_off: function( element, eventName ) {
		eventName = (eventName || "").split( " " ).join( this.eventNamespace + " " ) + this.eventNamespace;
		element.unbind( eventName ).undelegate( eventName );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-hover" );
			},
			mouseleave: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-hover" );
			}
		});
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-focus" );
			},
			focusout: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-focus" );
			}
		});
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}
		var hasOptions,
			effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;
		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}
		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;
		if ( options.delay ) {
			element.delay( options.delay );
		}
		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue(function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			});
		}
	};
});

})( jQuery );
(function( $, undefined ) {

var mouseHandled = false;
$( document ).mouseup( function() {
	mouseHandled = false;
});

$.widget("ui.mouse", {
	version: "1.10.3",
	options: {
		cancel: "input,textarea,button,select,option",
		distance: 1,
		delay: 0
	},
	_mouseInit: function() {
		var that = this;

		this.element
			.bind("mousedown."+this.widgetName, function(event) {
				return that._mouseDown(event);
			})
			.bind("click."+this.widgetName, function(event) {
				if (true === $.data(event.target, that.widgetName + ".preventClickEvent")) {
					$.removeData(event.target, that.widgetName + ".preventClickEvent");
					event.stopImmediatePropagation();
					return false;
				}
			});

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.unbind("."+this.widgetName);
		if ( this._mouseMoveDelegate ) {
			$(document)
				.unbind("mousemove."+this.widgetName, this._mouseMoveDelegate)
				.unbind("mouseup."+this.widgetName, this._mouseUpDelegate);
		}
	},

	_mouseDown: function(event) {
		// don't let more than one widget handle mouseStart
		if( mouseHandled ) { return; }

		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(event));

		this._mouseDownEvent = event;

		var that = this,
			btnIsLeft = (event.which === 1),
			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = (typeof this.options.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
		if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				that.mouseDelayMet = true;
			}, this.options.delay);
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(event) !== false);
			if (!this._mouseStarted) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if (true === $.data(event.target, this.widgetName + ".preventClickEvent")) {
			$.removeData(event.target, this.widgetName + ".preventClickEvent");
		}

		// these delegates are required to keep context
		this._mouseMoveDelegate = function(event) {
			return that._mouseMove(event);
		};
		this._mouseUpDelegate = function(event) {
			return that._mouseUp(event);
		};
		$(document)
			.bind("mousemove."+this.widgetName, this._mouseMoveDelegate)
			.bind("mouseup."+this.widgetName, this._mouseUpDelegate);

		event.preventDefault();

		mouseHandled = true;
		return true;
	},

	_mouseMove: function(event) {
		// IE mouseup check - mouseup happened when mouse was out of window
		if ($.ui.ie && ( !document.documentMode || document.documentMode < 9 ) && !event.button) {
			return this._mouseUp(event);
		}

		if (this._mouseStarted) {
			this._mouseDrag(event);
			return event.preventDefault();
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, event) !== false);
			(this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
		}

		return !this._mouseStarted;
	},

	_mouseUp: function(event) {
		$(document)
			.unbind("mousemove."+this.widgetName, this._mouseMoveDelegate)
			.unbind("mouseup."+this.widgetName, this._mouseUpDelegate);

		if (this._mouseStarted) {
			this._mouseStarted = false;

			if (event.target === this._mouseDownEvent.target) {
				$.data(event.target, this.widgetName + ".preventClickEvent", true);
			}

			this._mouseStop(event);
		}

		return false;
	},

	_mouseDistanceMet: function(event) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - event.pageX),
				Math.abs(this._mouseDownEvent.pageY - event.pageY)
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function(/* event */) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function(/* event */) {},
	_mouseDrag: function(/* event */) {},
	_mouseStop: function(/* event */) {},
	_mouseCapture: function(/* event */) { return true; }
});

})(jQuery);
(function( $, undefined ) {

$.ui = $.ui || {};

var cachedScrollbarWidth,
	max = Math.max,
	abs = Math.abs,
	round = Math.round,
	rhorizontal = /left|center|right/,
	rvertical = /top|center|bottom/,
	roffset = /[\+\-]\d+(\.[\d]+)?%?/,
	rposition = /^\w+/,
	rpercent = /%$/,
	_position = $.fn.position;

function getOffsets( offsets, width, height ) {
	return [
		parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
		parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
	];
}

function parseCss( element, property ) {
	return parseInt( $.css( element, property ), 10 ) || 0;
}

function getDimensions( elem ) {
	var raw = elem[0];
	if ( raw.nodeType === 9 ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: 0, left: 0 }
		};
	}
	if ( $.isWindow( raw ) ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: elem.scrollTop(), left: elem.scrollLeft() }
		};
	}
	if ( raw.preventDefault ) {
		return {
			width: 0,
			height: 0,
			offset: { top: raw.pageY, left: raw.pageX }
		};
	}
	return {
		width: elem.outerWidth(),
		height: elem.outerHeight(),
		offset: elem.offset()
	};
}

$.position = {
	scrollbarWidth: function() {
		if ( cachedScrollbarWidth !== undefined ) {
			return cachedScrollbarWidth;
		}
		var w1, w2,
			div = $( "<div style='display:block;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>" ),
			innerDiv = div.children()[0];

		$( "body" ).append( div );
		w1 = innerDiv.offsetWidth;
		div.css( "overflow", "scroll" );

		w2 = innerDiv.offsetWidth;

		if ( w1 === w2 ) {
			w2 = div[0].clientWidth;
		}

		div.remove();

		return (cachedScrollbarWidth = w1 - w2);
	},
	getScrollInfo: function( within ) {
		var overflowX = within.isWindow ? "" : within.element.css( "overflow-x" ),
			overflowY = within.isWindow ? "" : within.element.css( "overflow-y" ),
			hasOverflowX = overflowX === "scroll" ||
				( overflowX === "auto" && within.width < within.element[0].scrollWidth ),
			hasOverflowY = overflowY === "scroll" ||
				( overflowY === "auto" && within.height < within.element[0].scrollHeight );
		return {
			width: hasOverflowY ? $.position.scrollbarWidth() : 0,
			height: hasOverflowX ? $.position.scrollbarWidth() : 0
		};
	},
	getWithinInfo: function( element ) {
		var withinElement = $( element || window ),
			isWindow = $.isWindow( withinElement[0] );
		return {
			element: withinElement,
			isWindow: isWindow,
			offset: withinElement.offset() || { left: 0, top: 0 },
			scrollLeft: withinElement.scrollLeft(),
			scrollTop: withinElement.scrollTop(),
			width: isWindow ? withinElement.width() : withinElement.outerWidth(),
			height: isWindow ? withinElement.height() : withinElement.outerHeight()
		};
	}
};

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
		target = $( options.of ),
		within = $.position.getWithinInfo( options.within ),
		scrollInfo = $.position.getScrollInfo( within ),
		collision = ( options.collision || "flip" ).split( " " ),
		offsets = {};

	dimensions = getDimensions( target );
	if ( target[0].preventDefault ) {
		// force left top to allow flipping
		options.at = "left top";
	}
	targetWidth = dimensions.width;
	targetHeight = dimensions.height;
	targetOffset = dimensions.offset;
	// clone to reuse original targetOffset later
	basePosition = $.extend( {}, targetOffset );

	// force my and at to have valid horizontal and vertical positions
	// if a value is missing or invalid, it will be converted to center
	$.each( [ "my", "at" ], function() {
		var pos = ( options[ this ] || "" ).split( " " ),
			horizontalOffset,
			verticalOffset;

		if ( pos.length === 1) {
			pos = rhorizontal.test( pos[ 0 ] ) ?
				pos.concat( [ "center" ] ) :
				rvertical.test( pos[ 0 ] ) ?
					[ "center" ].concat( pos ) :
					[ "center", "center" ];
		}
		pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
		pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

		// calculate offsets
		horizontalOffset = roffset.exec( pos[ 0 ] );
		verticalOffset = roffset.exec( pos[ 1 ] );
		offsets[ this ] = [
			horizontalOffset ? horizontalOffset[ 0 ] : 0,
			verticalOffset ? verticalOffset[ 0 ] : 0
		];

		// reduce to just the positions without the offsets
		options[ this ] = [
			rposition.exec( pos[ 0 ] )[ 0 ],
			rposition.exec( pos[ 1 ] )[ 0 ]
		];
	});

	// normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	if ( options.at[ 0 ] === "right" ) {
		basePosition.left += targetWidth;
	} else if ( options.at[ 0 ] === "center" ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[ 1 ] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[ 1 ] === "center" ) {
		basePosition.top += targetHeight / 2;
	}

	atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
	basePosition.left += atOffset[ 0 ];
	basePosition.top += atOffset[ 1 ];

	return this.each(function() {
		var collisionPosition, using,
			elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseCss( this, "marginLeft" ),
			marginTop = parseCss( this, "marginTop" ),
			collisionWidth = elemWidth + marginLeft + parseCss( this, "marginRight" ) + scrollInfo.width,
			collisionHeight = elemHeight + marginTop + parseCss( this, "marginBottom" ) + scrollInfo.height,
			position = $.extend( {}, basePosition ),
			myOffset = getOffsets( offsets.my, elem.outerWidth(), elem.outerHeight() );

		if ( options.my[ 0 ] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[ 0 ] === "center" ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[ 1 ] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[ 1 ] === "center" ) {
			position.top -= elemHeight / 2;
		}

		position.left += myOffset[ 0 ];
		position.top += myOffset[ 1 ];

		// if the browser doesn't support fractions, then round for consistent results
		if ( !$.support.offsetFractions ) {
			position.left = round( position.left );
			position.top = round( position.top );
		}

		collisionPosition = {
			marginLeft: marginLeft,
			marginTop: marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[ i ] ] ) {
				$.ui.position[ collision[ i ] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
					my: options.my,
					at: options.at,
					within: within,
					elem : elem
				});
			}
		});

		if ( options.using ) {
			// adds feedback as second argument to using callback, if present
			using = function( props ) {
				var left = targetOffset.left - position.left,
					right = left + targetWidth - elemWidth,
					top = targetOffset.top - position.top,
					bottom = top + targetHeight - elemHeight,
					feedback = {
						target: {
							element: target,
							left: targetOffset.left,
							top: targetOffset.top,
							width: targetWidth,
							height: targetHeight
						},
						element: {
							element: elem,
							left: position.left,
							top: position.top,
							width: elemWidth,
							height: elemHeight
						},
						horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
						vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
					};
				if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
					feedback.horizontal = "center";
				}
				if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
					feedback.vertical = "middle";
				}
				if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
					feedback.important = "horizontal";
				} else {
					feedback.important = "vertical";
				}
				options.using.call( this, props, feedback );
			};
		}

		elem.offset( $.extend( position, { using: using } ) );
	});
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
				outerWidth = within.width,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = withinOffset - collisionPosLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
				newOverRight;

			// element is wider than within
			if ( data.collisionWidth > outerWidth ) {
				// element is initially over the left side of within
				if ( overLeft > 0 && overRight <= 0 ) {
					newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
					position.left += overLeft - newOverRight;
				// element is initially over right side of within
				} else if ( overRight > 0 && overLeft <= 0 ) {
					position.left = withinOffset;
				// element is initially over both left and right sides of within
				} else {
					if ( overLeft > overRight ) {
						position.left = withinOffset + outerWidth - data.collisionWidth;
					} else {
						position.left = withinOffset;
					}
				}
			// too far left -> align with left edge
			} else if ( overLeft > 0 ) {
				position.left += overLeft;
			// too far right -> align with right edge
			} else if ( overRight > 0 ) {
				position.left -= overRight;
			// adjust based on position and margin
			} else {
				position.left = max( position.left - collisionPosLeft, position.left );
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
				outerHeight = data.within.height,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = withinOffset - collisionPosTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
				newOverBottom;

			// element is taller than within
			if ( data.collisionHeight > outerHeight ) {
				// element is initially over the top of within
				if ( overTop > 0 && overBottom <= 0 ) {
					newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
					position.top += overTop - newOverBottom;
				// element is initially over bottom of within
				} else if ( overBottom > 0 && overTop <= 0 ) {
					position.top = withinOffset;
				// element is initially over both top and bottom of within
				} else {
					if ( overTop > overBottom ) {
						position.top = withinOffset + outerHeight - data.collisionHeight;
					} else {
						position.top = withinOffset;
					}
				}
			// too far up -> align with top
			} else if ( overTop > 0 ) {
				position.top += overTop;
			// too far down -> align with bottom edge
			} else if ( overBottom > 0 ) {
				position.top -= overBottom;
			// adjust based on position and margin
			} else {
				position.top = max( position.top - collisionPosTop, position.top );
			}
		}
	},
	flip: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.left + within.scrollLeft,
				outerWidth = within.width,
				offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = collisionPosLeft - offsetLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					data.at[ 0 ] === "right" ?
						-data.targetWidth :
						0,
				offset = -2 * data.offset[ 0 ],
				newOverRight,
				newOverLeft;

			if ( overLeft < 0 ) {
				newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
				if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
					position.left += myOffset + atOffset + offset;
				}
			}
			else if ( overRight > 0 ) {
				newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
				if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
					position.left += myOffset + atOffset + offset;
				}
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.top + within.scrollTop,
				outerHeight = within.height,
				offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = collisionPosTop - offsetTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
				top = data.my[ 1 ] === "top",
				myOffset = top ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					data.at[ 1 ] === "bottom" ?
						-data.targetHeight :
						0,
				offset = -2 * data.offset[ 1 ],
				newOverTop,
				newOverBottom;
			if ( overTop < 0 ) {
				newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
				if ( ( position.top + myOffset + atOffset + offset) > overTop && ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) ) {
					position.top += myOffset + atOffset + offset;
				}
			}
			else if ( overBottom > 0 ) {
				newOverTop = position.top -  data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
				if ( ( position.top + myOffset + atOffset + offset) > overBottom && ( newOverTop > 0 || abs( newOverTop ) < overBottom ) ) {
					position.top += myOffset + atOffset + offset;
				}
			}
		}
	},
	flipfit: {
		left: function() {
			$.ui.position.flip.left.apply( this, arguments );
			$.ui.position.fit.left.apply( this, arguments );
		},
		top: function() {
			$.ui.position.flip.top.apply( this, arguments );
			$.ui.position.fit.top.apply( this, arguments );
		}
	}
};

// fraction support test
(function () {
	var testElement, testElementParent, testElementStyle, offsetLeft, i,
		body = document.getElementsByTagName( "body" )[ 0 ],
		div = document.createElement( "div" );

	//Create a "fake body" for testing based on method used in jQuery.support
	testElement = document.createElement( body ? "div" : "body" );
	testElementStyle = {
		visibility: "hidden",
		width: 0,
		height: 0,
		border: 0,
		margin: 0,
		background: "none"
	};
	if ( body ) {
		$.extend( testElementStyle, {
			position: "absolute",
			left: "-1000px",
			top: "-1000px"
		});
	}
	for ( i in testElementStyle ) {
		testElement.style[ i ] = testElementStyle[ i ];
	}
	testElement.appendChild( div );
	testElementParent = body || document.documentElement;
	testElementParent.insertBefore( testElement, testElementParent.firstChild );

	div.style.cssText = "position: absolute; left: 10.7432222px;";

	offsetLeft = $( div ).offset().left;
	$.support.offsetFractions = offsetLeft > 10 && offsetLeft < 11;

	testElement.innerHTML = "";
	testElementParent.removeChild( testElement );
})();

}( jQuery ) );
(function( $, undefined ) {

// number of pages in a slider
// (how many times can you page up/down to go through the whole range)
var numPages = 5;

$.widget( "ui.slider", $.ui.mouse, {
	version: "1.10.3",
	widgetEventPrefix: "slide",

	options: {
		animate: false,
		distance: 0,
		max: 100,
		min: 0,
		orientation: "horizontal",
		range: false,
		step: 1,
		value: 0,
		values: null,

		// callbacks
		change: null,
		slide: null,
		start: null,
		stop: null
	},

	_create: function() {
		this._keySliding = false;
		this._mouseSliding = false;
		this._animateOff = true;
		this._handleIndex = null;
		this._detectOrientation();
		this._mouseInit();

		this.element
			.addClass( "ui-slider" +
				" ui-slider-" + this.orientation +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all");

		this._refresh();
		this._setOption( "disabled", this.options.disabled );

		this._animateOff = false;
	},

	_refresh: function() {
		this._createRange();
		this._createHandles();
		this._setupEvents();
		this._refreshValue();
	},

	_createHandles: function() {
		var i, handleCount,
			options = this.options,
			existingHandles = this.element.find( ".ui-slider-handle" ).addClass( "ui-state-default ui-corner-all" ),
			handle = "<a class='ui-slider-handle ui-state-default ui-corner-all' href='#'></a>",
			handles = [];

		handleCount = ( options.values && options.values.length ) || 1;

		if ( existingHandles.length > handleCount ) {
			existingHandles.slice( handleCount ).remove();
			existingHandles = existingHandles.slice( 0, handleCount );
		}

		for ( i = existingHandles.length; i < handleCount; i++ ) {
			handles.push( handle );
		}

		this.handles = existingHandles.add( $( handles.join( "" ) ).appendTo( this.element ) );

		this.handle = this.handles.eq( 0 );

		this.handles.each(function( i ) {
			$( this ).data( "ui-slider-handle-index", i );
		});
	},

	_createRange: function() {
		var options = this.options,
			classes = "";

		if ( options.range ) {
			if ( options.range === true ) {
				if ( !options.values ) {
					options.values = [ this._valueMin(), this._valueMin() ];
				} else if ( options.values.length && options.values.length !== 2 ) {
					options.values = [ options.values[0], options.values[0] ];
				} else if ( $.isArray( options.values ) ) {
					options.values = options.values.slice(0);
				}
			}

			if ( !this.range || !this.range.length ) {
				this.range = $( "<div></div>" )
					.appendTo( this.element );

				classes = "ui-slider-range" +
				// note: this isn't the most fittingly semantic framework class for this element,
				// but worked best visually with a variety of themes
				" ui-widget-header ui-corner-all";
			} else {
				this.range.removeClass( "ui-slider-range-min ui-slider-range-max" )
					// Handle range switching from true to min/max
					.css({
						"left": "",
						"bottom": ""
					});
			}

			this.range.addClass( classes +
				( ( options.range === "min" || options.range === "max" ) ? " ui-slider-range-" + options.range : "" ) );
		} else {
			this.range = $([]);
		}
	},

	_setupEvents: function() {
		var elements = this.handles.add( this.range ).filter( "a" );
		this._off( elements );
		this._on( elements, this._handleEvents );
		this._hoverable( elements );
		this._focusable( elements );
	},

	_destroy: function() {
		this.handles.remove();
		this.range.remove();

		this.element
			.removeClass( "ui-slider" +
				" ui-slider-horizontal" +
				" ui-slider-vertical" +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all" );

		this._mouseDestroy();
	},

	_mouseCapture: function( event ) {
		var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle,
			that = this,
			o = this.options;

		if ( o.disabled ) {
			return false;
		}

		this.elementSize = {
			width: this.element.outerWidth(),
			height: this.element.outerHeight()
		};
		this.elementOffset = this.element.offset();

		position = { x: event.pageX, y: event.pageY };
		normValue = this._normValueFromMouse( position );
		distance = this._valueMax() - this._valueMin() + 1;
		this.handles.each(function( i ) {
			var thisDistance = Math.abs( normValue - that.values(i) );
			if (( distance > thisDistance ) ||
				( distance === thisDistance &&
					(i === that._lastChangedValue || that.values(i) === o.min ))) {
				distance = thisDistance;
				closestHandle = $( this );
				index = i;
			}
		});

		allowed = this._start( event, index );
		if ( allowed === false ) {
			return false;
		}
		this._mouseSliding = true;

		this._handleIndex = index;

		closestHandle
			.addClass( "ui-state-active" )
			.focus();

		offset = closestHandle.offset();
		mouseOverHandle = !$( event.target ).parents().addBack().is( ".ui-slider-handle" );
		this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
			left: event.pageX - offset.left - ( closestHandle.width() / 2 ),
			top: event.pageY - offset.top -
				( closestHandle.height() / 2 ) -
				( parseInt( closestHandle.css("borderTopWidth"), 10 ) || 0 ) -
				( parseInt( closestHandle.css("borderBottomWidth"), 10 ) || 0) +
				( parseInt( closestHandle.css("marginTop"), 10 ) || 0)
		};

		if ( !this.handles.hasClass( "ui-state-hover" ) ) {
			this._slide( event, index, normValue );
		}
		this._animateOff = true;
		return true;
	},

	_mouseStart: function() {
		return true;
	},

	_mouseDrag: function( event ) {
		var position = { x: event.pageX, y: event.pageY },
			normValue = this._normValueFromMouse( position );

		this._slide( event, this._handleIndex, normValue );

		return false;
	},

	_mouseStop: function( event ) {
		this.handles.removeClass( "ui-state-active" );
		this._mouseSliding = false;

		this._stop( event, this._handleIndex );
		this._change( event, this._handleIndex );

		this._handleIndex = null;
		this._clickOffset = null;
		this._animateOff = false;

		return false;
	},

	_detectOrientation: function() {
		this.orientation = ( this.options.orientation === "vertical" ) ? "vertical" : "horizontal";
	},

	_normValueFromMouse: function( position ) {
		var pixelTotal,
			pixelMouse,
			percentMouse,
			valueTotal,
			valueMouse;

		if ( this.orientation === "horizontal" ) {
			pixelTotal = this.elementSize.width;
			pixelMouse = position.x - this.elementOffset.left - ( this._clickOffset ? this._clickOffset.left : 0 );
		} else {
			pixelTotal = this.elementSize.height;
			pixelMouse = position.y - this.elementOffset.top - ( this._clickOffset ? this._clickOffset.top : 0 );
		}

		percentMouse = ( pixelMouse / pixelTotal );
		if ( percentMouse > 1 ) {
			percentMouse = 1;
		}
		if ( percentMouse < 0 ) {
			percentMouse = 0;
		}
		if ( this.orientation === "vertical" ) {
			percentMouse = 1 - percentMouse;
		}

		valueTotal = this._valueMax() - this._valueMin();
		valueMouse = this._valueMin() + percentMouse * valueTotal;

		return this._trimAlignValue( valueMouse );
	},

	_start: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}
		return this._trigger( "start", event, uiHash );
	},

	_slide: function( event, index, newVal ) {
		var otherVal,
			newValues,
			allowed;

		if ( this.options.values && this.options.values.length ) {
			otherVal = this.values( index ? 0 : 1 );

			if ( ( this.options.values.length === 2 && this.options.range === true ) &&
					( ( index === 0 && newVal > otherVal) || ( index === 1 && newVal < otherVal ) )
				) {
				newVal = otherVal;
			}

			if ( newVal !== this.values( index ) ) {
				newValues = this.values();
				newValues[ index ] = newVal;
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal,
					values: newValues
				} );
				otherVal = this.values( index ? 0 : 1 );
				if ( allowed !== false ) {
					this.values( index, newVal, true );
				}
			}
		} else {
			if ( newVal !== this.value() ) {
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal
				} );
				if ( allowed !== false ) {
					this.value( newVal );
				}
			}
		}
	},

	_stop: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}

		this._trigger( "stop", event, uiHash );
	},

	_change: function( event, index ) {
		if ( !this._keySliding && !this._mouseSliding ) {
			var uiHash = {
				handle: this.handles[ index ],
				value: this.value()
			};
			if ( this.options.values && this.options.values.length ) {
				uiHash.value = this.values( index );
				uiHash.values = this.values();
			}

			//store the last changed value index for reference when handles overlap
			this._lastChangedValue = index;

			this._trigger( "change", event, uiHash );
		}
	},

	value: function( newValue ) {
		if ( arguments.length ) {
			this.options.value = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, 0 );
			return;
		}

		return this._value();
	},

	values: function( index, newValue ) {
		var vals,
			newValues,
			i;

		if ( arguments.length > 1 ) {
			this.options.values[ index ] = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, index );
			return;
		}

		if ( arguments.length ) {
			if ( $.isArray( arguments[ 0 ] ) ) {
				vals = this.options.values;
				newValues = arguments[ 0 ];
				for ( i = 0; i < vals.length; i += 1 ) {
					vals[ i ] = this._trimAlignValue( newValues[ i ] );
					this._change( null, i );
				}
				this._refreshValue();
			} else {
				if ( this.options.values && this.options.values.length ) {
					return this._values( index );
				} else {
					return this.value();
				}
			}
		} else {
			return this._values();
		}
	},

	_setOption: function( key, value ) {
		var i,
			valsLength = 0;

		if ( key === "range" && this.options.range === true ) {
			if ( value === "min" ) {
				this.options.value = this._values( 0 );
				this.options.values = null;
			} else if ( value === "max" ) {
				this.options.value = this._values( this.options.values.length-1 );
				this.options.values = null;
			}
		}

		if ( $.isArray( this.options.values ) ) {
			valsLength = this.options.values.length;
		}

		$.Widget.prototype._setOption.apply( this, arguments );

		switch ( key ) {
			case "orientation":
				this._detectOrientation();
				this.element
					.removeClass( "ui-slider-horizontal ui-slider-vertical" )
					.addClass( "ui-slider-" + this.orientation );
				this._refreshValue();
				break;
			case "value":
				this._animateOff = true;
				this._refreshValue();
				this._change( null, 0 );
				this._animateOff = false;
				break;
			case "values":
				this._animateOff = true;
				this._refreshValue();
				for ( i = 0; i < valsLength; i += 1 ) {
					this._change( null, i );
				}
				this._animateOff = false;
				break;
			case "min":
			case "max":
				this._animateOff = true;
				this._refreshValue();
				this._animateOff = false;
				break;
			case "range":
				this._animateOff = true;
				this._refresh();
				this._animateOff = false;
				break;
		}
	},

	//internal value getter
	// _value() returns value trimmed by min and max, aligned by step
	_value: function() {
		var val = this.options.value;
		val = this._trimAlignValue( val );

		return val;
	},

	//internal values getter
	// _values() returns array of values trimmed by min and max, aligned by step
	// _values( index ) returns single value trimmed by min and max, aligned by step
	_values: function( index ) {
		var val,
			vals,
			i;

		if ( arguments.length ) {
			val = this.options.values[ index ];
			val = this._trimAlignValue( val );

			return val;
		} else if ( this.options.values && this.options.values.length ) {
			// .slice() creates a copy of the array
			// this copy gets trimmed by min and max and then returned
			vals = this.options.values.slice();
			for ( i = 0; i < vals.length; i+= 1) {
				vals[ i ] = this._trimAlignValue( vals[ i ] );
			}

			return vals;
		} else {
			return [];
		}
	},

	// returns the step-aligned value that val is closest to, between (inclusive) min and max
	_trimAlignValue: function( val ) {
		if ( val <= this._valueMin() ) {
			return this._valueMin();
		}
		if ( val >= this._valueMax() ) {
			return this._valueMax();
		}
		var step = ( this.options.step > 0 ) ? this.options.step : 1,
			valModStep = (val - this._valueMin()) % step,
			alignValue = val - valModStep;

		if ( Math.abs(valModStep) * 2 >= step ) {
			alignValue += ( valModStep > 0 ) ? step : ( -step );
		}

		// Since JavaScript has problems with large floats, round
		// the final value to 5 digits after the decimal point (see #4124)
		return parseFloat( alignValue.toFixed(5) );
	},

	_valueMin: function() {
		return this.options.min;
	},

	_valueMax: function() {
		return this.options.max;
	},

	_refreshValue: function() {
		var lastValPercent, valPercent, value, valueMin, valueMax,
			oRange = this.options.range,
			o = this.options,
			that = this,
			animate = ( !this._animateOff ) ? o.animate : false,
			_set = {};

		if ( this.options.values && this.options.values.length ) {
			this.handles.each(function( i ) {
				valPercent = ( that.values(i) - that._valueMin() ) / ( that._valueMax() - that._valueMin() ) * 100;
				_set[ that.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
				$( this ).stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );
				if ( that.options.range === true ) {
					if ( that.orientation === "horizontal" ) {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { left: valPercent + "%" }, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( { width: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					} else {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { bottom: ( valPercent ) + "%" }, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( { height: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					}
				}
				lastValPercent = valPercent;
			});
		} else {
			value = this.value();
			valueMin = this._valueMin();
			valueMax = this._valueMax();
			valPercent = ( valueMax !== valueMin ) ?
					( value - valueMin ) / ( valueMax - valueMin ) * 100 :
					0;
			_set[ this.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
			this.handle.stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );

			if ( oRange === "min" && this.orientation === "horizontal" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { width: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "horizontal" ) {
				this.range[ animate ? "animate" : "css" ]( { width: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
			if ( oRange === "min" && this.orientation === "vertical" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { height: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "vertical" ) {
				this.range[ animate ? "animate" : "css" ]( { height: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
		}
	},

	_handleEvents: {
		keydown: function( event ) {
			/*jshint maxcomplexity:25*/
			var allowed, curVal, newVal, step,
				index = $( event.target ).data( "ui-slider-handle-index" );

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
				case $.ui.keyCode.END:
				case $.ui.keyCode.PAGE_UP:
				case $.ui.keyCode.PAGE_DOWN:
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					event.preventDefault();
					if ( !this._keySliding ) {
						this._keySliding = true;
						$( event.target ).addClass( "ui-state-active" );
						allowed = this._start( event, index );
						if ( allowed === false ) {
							return;
						}
					}
					break;
			}

			step = this.options.step;
			if ( this.options.values && this.options.values.length ) {
				curVal = newVal = this.values( index );
			} else {
				curVal = newVal = this.value();
			}

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
					newVal = this._valueMin();
					break;
				case $.ui.keyCode.END:
					newVal = this._valueMax();
					break;
				case $.ui.keyCode.PAGE_UP:
					newVal = this._trimAlignValue( curVal + ( (this._valueMax() - this._valueMin()) / numPages ) );
					break;
				case $.ui.keyCode.PAGE_DOWN:
					newVal = this._trimAlignValue( curVal - ( (this._valueMax() - this._valueMin()) / numPages ) );
					break;
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
					if ( curVal === this._valueMax() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal + step );
					break;
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					if ( curVal === this._valueMin() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal - step );
					break;
			}

			this._slide( event, index, newVal );
		},
		click: function( event ) {
			event.preventDefault();
		},
		keyup: function( event ) {
			var index = $( event.target ).data( "ui-slider-handle-index" );

			if ( this._keySliding ) {
				this._keySliding = false;
				this._stop( event, index );
				this._change( event, index );
				$( event.target ).removeClass( "ui-state-active" );
			}
		}
	}

});

}(jQuery));

//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

//     Backbone.js 0.9.10

//     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create a local reference to array methods.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '0.9.10';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
    } else if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
    } else {
      return true;
    }
  };

  // Optimized internal dispatch function for triggering events. Tries to
  // keep the usual cases speedy (most Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length;
    switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx);
    return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0]);
    return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1]);
    return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1], args[2]);
    return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind one or more space separated events, or an events map,
    // to a `callback` function. Passing `"all"` will bind the callback to
    // all events fired.
    on: function(name, callback, context) {
      if (!(eventsApi(this, 'on', name, [callback, context]) && callback)) return this;
      this._events || (this._events = {});
      var list = this._events[name] || (this._events[name] = []);
      list.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind events to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!(eventsApi(this, 'once', name, [callback, context]) && callback)) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      this.on(name, once, context);
      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var list, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (list = this._events[name]) {
          events = [];
          if (callback || context) {
            for (j = 0, k = list.length; j < k; j++) {
              ev = list[j];
              if ((callback && callback !== ev.callback &&
                               callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                events.push(ev);
              }
            }
          }
          this._events[name] = events;
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // An inversion-of-control version of `on`. Tell *this* object to listen to
    // an event in another object ... keeping track of what it's listening to.
    listenTo: function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      obj.on(name, typeof name === 'object' ? this : callback, this);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return;
      if (obj) {
        obj.off(name, typeof name === 'object' ? this : callback, this);
        if (!name && !callback) delete listeners[obj._listenerId];
      } else {
        if (typeof name === 'object') callback = this;
        for (var id in listeners) {
          listeners[id].off(name, callback, this);
        }
        this._listeners = {};
      }
      return this;
    }
  };

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Create a new model, with defined attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options && options.collection) this.collection = options.collection;
    if (options && options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // ----------------------------------------------------------------------

    // Set a hash of model attributes on the object, firing `"change"` unless
    // you choose to silence it.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"` unless you choose
    // to silence it. `unset` is a noop if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"` unless you choose
    // to silence it.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // ---------------------------------------------------------------------

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overriden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
      };
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, success, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      success = options.success;
      options.success = function(model, resp, options) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
      };

      // Finish configuring and sending the Ajax request.
      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(model, resp, options) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
      };

      if (this.isNew()) {
        options.success(this, null, options);
        return false;
      }

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return !this.validate || !this.validate(this.attributes, options);
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire a general
    // `"error"` event and call the error callback, if specified.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, options || {});
      return false;
    }

  });

  // Backbone.Collection
  // -------------------

  // Provides a standard collection class for our sets of models, ordered
  // or unordered. If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this.models = [];
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, model, attrs, existing, doSort, add, at, sort, sortAttr;
      add = [];
      at = options.at;
      sort = this.comparator && (at == null) && options.sort != false;
      sortAttr = _.isString(this.comparator) ? this.comparator : null;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(attrs = models[i], options))) {
          this.trigger('invalid', this, attrs, options);
          continue;
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.merge) {
            existing.set(attrs === model ? model.attributes : attrs, options);
            if (sort && !doSort && existing.hasChanged(sortAttr)) doSort = true;
          }
          continue;
        }

        // This is a new model, push it to the `add` list.
        add.push(model);

        // Listen to added models' events, and index models for lookup by
        // `id` and by `cid`.
        model.on('all', this._onModelEvent, this);
        this._byId[model.cid] = model;
        if (model.id != null) this._byId[model.id] = model;
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (add.length) {
        if (sort) doSort = true;
        this.length += add.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(add));
        } else {
          push.apply(this.models, add);
        }
      }

      // Silently sort the collection if appropriate.
      if (doSort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = add.length; i < l; i++) {
        (model = add[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (doSort) this.trigger('sort', this, options);

      return this;
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      this._idAttr || (this._idAttr = this.model.prototype.idAttribute);
      return this._byId[obj.id || obj.cid || obj[this._idAttr] || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of `filter`.
    where: function(attrs) {
      if (_.isEmpty(attrs)) return [];
      return this.filter(function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) {
        throw new Error('Cannot sort a set without a comparator');
      }
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Smartly update a collection with a change set of models, adding,
    // removing, and merging as necessary.
    update: function(models, options) {
      options = _.extend({add: true, merge: true, remove: true}, options);
      if (options.parse) models = this.parse(models, options);
      var model, i, l, existing;
      var add = [], remove = [], modelMap = {};

      // Allow a single model (or no argument) to be passed.
      if (!_.isArray(models)) models = models ? [models] : [];

      // Proxy to `add` for this case, no need to iterate...
      if (options.add && !options.remove) return this.add(models, options);

      // Determine which models to add and merge, and which to remove.
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i];
        existing = this.get(model);
        if (options.remove && existing) modelMap[existing.cid] = true;
        if ((options.add && !existing) || (options.merge && existing)) {
          add.push(model);
        }
      }
      if (options.remove) {
        for (i = 0, l = this.models.length; i < l; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) remove.push(model);
        }
      }

      // Remove models (if applicable) before we add and merge the rest.
      if (remove.length) this.remove(remove, options);
      if (add.length) this.add(add, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any `add` or `remove` events. Fires `reset` when finished.
    reset: function(models, options) {
      options || (options = {});
      if (options.parse) models = this.parse(models, options);
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models.slice();
      this._reset();
      if (models) this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `update: true` is passed, the response
    // data will be passed through the `update` method instead of `reset`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      options.success = function(collection, resp, options) {
        var method = options.update ? 'update' : 'reset';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
      };
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Reset all internal state. Called when the collection is reset.
    _reset: function() {
      this.length = 0;
      this.models.length = 0;
      this._byId  = {};
    },

    // Prepare a model or hash of attributes to be added to this collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) return false;
      return model;
    },

    // Internal method to remove a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    },

    sortedIndex: function (model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (!callback) callback = this[name];
      Backbone.history.route(route, _.bind(function(fragment) {
        var args = this._extractParameters(route, fragment);
        callback && callback.apply(this, args);
        this.trigger.apply(this, ['route:' + name].concat(args));
        this.trigger('route', name, args);
        Backbone.history.trigger('route', this, name, args);
      }, this));
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted parameters.
    _extractParameters: function(route, fragment) {
      return route.exec(fragment).slice(1);
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on URL fragments. If the
  // browser does not support `onhashchange`, falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Backbone.View
  // -------------

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) throw new Error('Method "' + events[key] + '" does not exist');
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(model, collection, id, className)*, are
    // attached directly to the view.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }
    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    var success = options.success;
    options.success = function(resp) {
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };

    var error = options.error;
    options.error = function(xhr) {
      if (error) error(model, xhr, options);
      model.trigger('error', model, xhr, options);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

}).call(this);

// Copyright 2012 Mauricio Santos. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//
// Some documentation is borrowed from the official Java API
// as it serves the same porpose.

/**
 * @namespace Top level namespace for Buckets, a JavaScript data structure library.
 */
var buckets = {};

/**
 * Default function to compare element order.
 * @function
 * @private
 */
buckets.defaultCompare = function(a, b) {
    if (a < b) {
        return - 1;
    } else if (a === b) {
        return 0;
    } else {
        return 1;
    }
};
/**
 * Default function to test equality.
 * @function
 * @private
 */
buckets.defaultEquals = function(a, b) {
    return a === b;
};

/**
 * Default function to convert an object to a string.
 * @function
 * @private
 */
buckets.defaultToString = function(item) {
    if (item === null) {
        return 'BUCKETS_NULL';
    } else if (buckets.isUndefined(item)) {
        return 'BUCKETS_UNDEFINED';
    } else if (buckets.isString(item)) {
        return item;
    } else {
        return item.toString();
    }
};

/**
 * Checks if the given argument is a function.
 * @function
 * @private
 */
buckets.isFunction = function(func) {
    return (typeof func) === 'function';
};

/**
 * Checks if the given argument is undefined.
 * @function
 * @private
 */
buckets.isUndefined = function(obj) {
    return (typeof obj) === 'undefined';
};

/**
 * Checks if the given argument is a string.
 * @function
 * @private
 */
buckets.isString = function(obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
};

/**
 * Reverses a compare function.
 * @function
 * @private
 */
buckets.reverseCompareFunction = function(compareFunction) {
    if (!buckets.isFunction(compareFunction)) {
        return function(a, b) {
            if (a < b) {
                return 1;
            } else if (a === b) {
                return 0;
            } else {
                return - 1;
            }
        };
    } else {
        return function(d, v) {
            return compareFunction(d, v) * -1;
        };
    }
};

/**
 * Returns an equal function given a compare function.
 * @function
 * @private
 */
buckets.compareToEquals = function(compareFunction) {
    return function(a, b) {
        return compareFunction(a, b) === 0;
    };
};

/**
 * @namespace Contains various functions for manipulating arrays.
 */
buckets.arrays = {};

/**
 * Returns the position of the first occurrence of the specified item
 * within the specified array.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the position of the first occurrence of the specified element
 * within the specified array, or -1 if not found.
 */
buckets.arrays.indexOf = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    for (var i = 0; i < length; i++) {
        if (equals(array[i], item)) {
            return i;
        }
    }
    return - 1;
};

/**
 * Returns the position of the last occurrence of the specified element
 * within the specified array.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the position of the last occurrence of the specified element
 * within the specified array or -1 if not found.
 */
buckets.arrays.lastIndexOf = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    for (var i = length - 1; i >= 0; i--) {
        if (equals(array[i], item)) {
            return i;
        }
    }
    return - 1;
};

/**
 * Returns true if the specified array contains the specified element.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function to 
 * check equality between 2 elements.
 * @return {boolean} true if the specified array contains the specified element.
 */
buckets.arrays.contains = function(array, item, equalsFunction) {
    return buckets.arrays.indexOf(array, item, equalsFunction) >= 0;
};


/**
 * Removes the first ocurrence of the specified element from the specified array.
 * @param {*} array the array in which to search element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function to 
 * check equality between 2 elements.
 * @return {boolean} true if the array changed after this call.
 */
buckets.arrays.remove = function(array, item, equalsFunction) {
    var index = buckets.arrays.indexOf(array, item, equalsFunction);
    if (index < 0) {
        return false;
    }
    array.splice(index, 1);
    return true;
};

/**
 * Returns the number of elements in the specified array equal
 * to the specified object.
 * @param {Array} array the array in which to determine the frequency of the element.
 * @param {Object} item the element whose frequency is to be determined.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the number of elements in the specified array 
 * equal to the specified object.
 */
buckets.arrays.frequency = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    var freq = 0;
    for (var i = 0; i < length; i++) {
        if (equals(array[i], item)) {
            freq++;
        }
    }
    return freq;
};

/**
 * Returns true if the two specified arrays are equal to one another.
 * Two arrays are considered equal if both arrays contain the same number
 * of elements, and all corresponding pairs of elements in the two 
 * arrays are equal and are in the same order. 
 * @param {Array} array1 one array to be tested for equality.
 * @param {Array} array2 the other array to be tested for equality.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between elemements in the arrays.
 * @return {boolean} true if the two arrays are equal
 */
buckets.arrays.equals = function(array1, array2, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;

    if (array1.length !== array2.length) {
        return false;
    }
    var length = array1.length;
    for (var i = 0; i < length; i++) {
        if (!equals(array1[i], array2[i])) {
            return false;
        }
    }
    return true;
};

/**
 * Returns shallow a copy of the specified array.
 * @param {*} array the array to copy.
 * @return {Array} a copy of the specified array
 */
buckets.arrays.copy = function(array) {
    return array.concat();
};

/**
 * Swaps the elements at the specified positions in the specified array.
 * @param {Array} array The array in which to swap elements.
 * @param {number} i the index of one element to be swapped.
 * @param {number} j the index of the other element to be swapped.
 * @return {boolean} true if the array is defined and the indexes are valid.
 */
buckets.arrays.swap = function(array, i, j) {
    if (i < 0 || i >= array.length || j < 0 || j >= array.length) {
        return false;
    }
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    return true;
};

/**
 * Executes the provided function once for each element present in this array 
 * starting from index 0 to length - 1.
 * @param {Array} array The array in which to iterate.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.arrays.forEach = function(array, callback) {
   var lenght = array.length;
   for (var i=0; i < lenght; i++) {
   		if(callback(array[i])===false){
			return;
		}
   }	 
};

/**
 * Creates an empty Linked List.
 * @class A linked list is a data structure consisting of a group of nodes
 * which together represent a sequence.
 * @constructor
 */
buckets.LinkedList = function() {

    /**
     * First node in the list
     * @type {Object}
     * @private
     */
    this.firstNode = null;

    /**
     * Last node in the list
     * @type {Object}
     * @private
     */
    this.lastNode = null;

    /**
     * Number of elements in the list
     * @type {number}
     * @private
     */
    this.nElements = 0;
};


/**
 * Adds an element to this list.
 * @param {Object} item element to be added.
 * @param {number=} index optional index to add the element. If no index is specified
 * the element is added to the end of this list.
 * @return {boolean} true if the element was added or false if the index is invalid
 * or if the element is undefined.
 */
buckets.LinkedList.prototype.add = function(item, index) {

    if (buckets.isUndefined(index)) {
        index = this.nElements;
    }
    if (index < 0 || index > this.nElements || buckets.isUndefined(item)) {
        return false;
    }
    var newNode = this.createNode(item);
    if (this.nElements === 0) {
        // First node in the list.
        this.firstNode = newNode;
        this.lastNode = newNode;
    } else if (index === this.nElements) {
        // Insert at the end.
        this.lastNode.next = newNode;
        this.lastNode = newNode;
    } else if (index === 0) {
        // Change first node.
        newNode.next = this.firstNode;
        this.firstNode = newNode;
    } else {
        var prev = this.nodeAtIndex(index - 1);
        newNode.next = prev.next;
        prev.next = newNode;
    }
    this.nElements++;
    return true;
};


/**
 * Returns the first element in this list.
 * @return {*} the first element of the list or undefined if the list is
 * empty.
 */
buckets.LinkedList.prototype.first = function() {

    if (this.firstNode !== null) {
        return this.firstNode.element;
    }
    return undefined;
};

/**
 * Returns the last element in this list.
 * @return {*} the last element in the list or undefined if the list is
 * empty.
 */
buckets.LinkedList.prototype.last = function() {

    if (this.lastNode !== null) {
        return this.lastNode.element;
    }
    return undefined;
};


/**
 * Returns the element at the specified position in this list.
 * @param {number} index desired index.
 * @return {*} the element at the given index or undefined if the index is
 * out of bounds.
 */
buckets.LinkedList.prototype.elementAtIndex = function(index) {

    var node = this.nodeAtIndex(index);
    if (node === null) {
        return undefined;
    }
    return node.element;
};

/**
 * Returns the index in this list of the first occurrence of the
 * specified element, or -1 if the List does not contain this element.
 * <p>If the elements inside this list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction Optional
 * function used to check if two elements are equal.
 * @return {number} the index in this list of the first occurrence
 * of the specified element, or -1 if this list does not contain the
 * element.
 */
buckets.LinkedList.prototype.indexOf = function(item, equalsFunction) {

    var equalsF = equalsFunction || buckets.defaultEquals;
    if (buckets.isUndefined(item)) {
        return - 1;
    }
    var currentNode = this.firstNode;
    var index = 0;
    while (currentNode !== null) {
        if (equalsF(currentNode.element, item)) {
            return index;
        }
        index++;
        currentNode = currentNode.next;
    }
    return - 1;
};

/**
 * Returns true if this list contains the specified element.
 * <p>If the elements inside the list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction Optional
 * function used to check if two elements are equal.
 * @return {boolean} true if this list contains the specified element, false
 * otherwise.
 */
buckets.LinkedList.prototype.contains = function(item, equalsFunction) {
    return (this.indexOf(item, equalsFunction) >= 0);
};

/**
 * Removes the first occurrence of the specified element in this list.
 * <p>If the elements inside the list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to be removed from this list, if present.
 * @return {boolean} true if the list contained the specified element.
 */
buckets.LinkedList.prototype.remove = function(item, equalsFunction) {
    var equalsF = equalsFunction || buckets.defaultEquals;
    if (this.nElements < 1 || buckets.isUndefined(item)) {
        return false;
    }
    var previous = null;
    var currentNode = this.firstNode;
    while (currentNode !== null) {

        if (equalsF(currentNode.element, item)) {

            if (currentNode === this.firstNode) {
                this.firstNode = this.firstNode.next;
                if (currentNode === this.lastNode) {
                    this.lastNode = null;
                }
            } else if (currentNode === this.lastNode) {
                this.lastNode = previous;
                previous.next = currentNode.next;
                currentNode.next = null;
            } else {
                previous.next = currentNode.next;
                currentNode.next = null;
            }
            this.nElements--;
            return true;
        }
        previous = currentNode;
        currentNode = currentNode.next;
    }
    return false;
};

/**
 * Removes all of the elements from this list.
 */
buckets.LinkedList.prototype.clear = function() {
    this.firstNode = null;
    this.lastNode = null;
    this.nElements = 0;
};

/**
 * Returns true if this list is equal to the given list.
 * Two lists are equal if they have the same elements in the same order.
 * @param {buckets.LinkedList} other the other list.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function used to check if two elements are equal. If the elements in the lists
 * are custom objects you should provide a function, otherwise the
 * the === operator is used to check equality between elements.
 * @return {boolean} true if this list is equal to the given list.
 */
buckets.LinkedList.prototype.equals = function(other, equalsFunction) {
    var eqF = equalsFunction || buckets.defaultEquals;
    if (! (other instanceof buckets.LinkedList)) {
        return false;
    }
    if (this.size() !== other.size()) {
        return false;
    }
    return this.equalsAux(this.firstNode, other.firstNode, eqF);
};

/**
 * @private
 */
buckets.LinkedList.prototype.equalsAux = function(n1, n2, eqF) {
    while (n1 !== null) {
        if (!eqF(n1.element, n2.element)) {
            return false;
        }
        n1 = n1.next;
        n2 = n2.next;
    }
    return true;
};

/**
 * Removes the element at the specified position in this list.
 * @param {number} index given index.
 * @return {*} removed element or undefined if the index is out of bounds.
 */
buckets.LinkedList.prototype.removeElementAtIndex = function(index) {

    if (index < 0 || index >= this.nElements) {
        return undefined;
    }
    var element;
    if (this.nElements === 1) {
        //First node in the list.
        element = this.firstNode.element;
        this.firstNode = null;
        this.lastNode = null;
    } else {
        var previous = this.nodeAtIndex(index - 1);
        if (previous === null) {
            element = this.firstNode.element;
            this.firstNode = this.firstNode.next;
        } else if (previous.next === this.lastNode) {
            element = this.lastNode.element;
            this.lastNode = previous;
        }
        if (previous !== null) {
            element = previous.next.element;
            previous.next = previous.next.next;
        }
    }
    this.nElements--;
    return element;
};

/**
 * Executes the provided function once for each element present in this list in order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.LinkedList.prototype.forEach = function(callback) {
    var currentNode = this.firstNode;
    while (currentNode !== null) {
        if (callback(currentNode.element) === false) {
            break;
        }
        currentNode = currentNode.next;
    }
};

/**
 * Reverses the order of the elements in this linked list (makes the last 
 * element first, and the first element last).
 */
buckets.LinkedList.prototype.reverse = function() {
    var previous = null;
    var current = this.firstNode;
    var temp = null;
    while (current !== null) {
        temp = current.next;
        current.next = previous;
        previous = current;
        current = temp;
    }
    temp = this.firstNode;
    this.firstNode = this.lastNode;
    this.lastNode = temp;
};


/**
 * Returns an array containing all of the elements in this list in proper
 * sequence.
 * @return {Array.<*>} an array containing all of the elements in this list,
 * in proper sequence.
 */
buckets.LinkedList.prototype.toArray = function() {
    var array = [];
    var currentNode = this.firstNode;
    while (currentNode !== null) {
        array.push(currentNode.element);
        currentNode = currentNode.next;
    }
    return array;
};
/**
 * Returns the number of elements in this list.
 * @return {number} the number of elements in this list.
 */
buckets.LinkedList.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this list contains no elements.
 * @return {boolean} true if this list contains no elements.
 */
buckets.LinkedList.prototype.isEmpty = function() {
    return this.nElements <= 0;
};

/**
 * @private
 */
buckets.LinkedList.prototype.nodeAtIndex = function(index) {

    if (index < 0 || index >= this.nElements) {
        return null;
    }
    if (index === (this.nElements - 1)) {
        return this.lastNode;
    }
    var node = this.firstNode;
    for (var i = 0; i < index; i++) {
        node = node.next;
    }
    return node;
};
/**
 * @private
 */
buckets.LinkedList.prototype.createNode = function(item) {
    return {
        element: item,
        next: null
    };
};


/**
 * Creates an empty dictionary. 
 * @class <p>Dictionaries map keys to values; each key can map to at most one value.
 * This implementation accepts any kind of objects as keys.</p>
 *
 * <p>If the keys are custom objects a function which converts keys to unique
 * strings must be provided. Example:</p>
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 * @constructor
 * @param {function(Object):string=} toStrFunction optional function used
 * to convert keys to strings. If the keys aren't strings or if toString()
 * is not appropriate, a custom function which receives a key and returns a
 * unique string must be provided.
 */
buckets.Dictionary = function(toStrFunction) {

    /**
     * Object holding the key-value pairs.
     * @type {Object}
     * @private
     */
    this.table = {};

    /**
     * Number of elements in the list.
     * @type {number}
     * @private
     */
    this.nElements = 0;

    /**
     * Function used to convert keys to strings.
     * @type {function(Object):string}
     * @private
     */
    this.toStr = toStrFunction || buckets.defaultToString;
};

/**
 * Returns the value to which this dictionary maps the specified key.
 * Returns undefined if this dictionary contains no mapping for this key.
 * @param {Object} key key whose associated value is to be returned.
 * @return {*} the value to which this dictionary maps the specified key or
 * undefined if the map contains no mapping for this key.
 */
buckets.Dictionary.prototype.get = function(key) {

    var pair = this.table[this.toStr(key)];
    if (buckets.isUndefined(pair)) {
        return undefined;
    }
    return pair.value;
};
/**
 * Associates the specified value with the specified key in this dictionary.
 * If the dictionary previously contained a mapping for this key, the old
 * value is replaced by the specified value.
 * @param {Object} key key with which the specified value is to be
 * associated.
 * @param {Object} value value to be associated with the specified key.
 * @return {*} previous value associated with the specified key, or undefined if
 * there was no mapping for the key or if the key/value are undefined.
 */
buckets.Dictionary.prototype.set = function(key, value) {

    if (buckets.isUndefined(key) || buckets.isUndefined(value)) {
        return undefined;
    }

    var ret;
    var k = this.toStr(key);
    var previousElement = this.table[k];
    if (buckets.isUndefined(previousElement)) {
        this.nElements++;
        ret = undefined;
    } else {
        ret = previousElement.value;
    }
    this.table[k] = {
        key: key,
        value: value
    };
    return ret;
};
/**
 * Removes the mapping for this key from this dictionary if it is present.
 * @param {Object} key key whose mapping is to be removed from the
 * dictionary.
 * @return {*} previous value associated with specified key, or undefined if
 * there was no mapping for key.
 */
buckets.Dictionary.prototype.remove = function(key) {
    var k = this.toStr(key);
    var previousElement = this.table[k];
    if (!buckets.isUndefined(previousElement)) {
        delete this.table[k];
        this.nElements--;
        return previousElement.value;
    }
    return undefined;
};
/**
 * Returns an array containing all of the keys in this dictionary.
 * @return {Array} an array containing all of the keys in this dictionary.
 */
buckets.Dictionary.prototype.keys = function() {
    var array = [];
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            array.push(this.table[name].key);
        }
    }
    return array;
};
/**
 * Returns an array containing all of the values in this dictionary.
 * @return {Array} an array containing all of the values in this dictionary.
 */
buckets.Dictionary.prototype.values = function() {
    var array = [];
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            array.push(this.table[name].value);
        }
    }
    return array;
};

/**
 * Executes the provided function once for each key-value pair 
 * present in this dictionary.
 * @param {function(Object,Object):*} callback function to execute, it is
 * invoked with two arguments: key and value. To break the iteration you can 
 * optionally return false.
 */
buckets.Dictionary.prototype.forEach = function(callback) {
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            var pair = this.table[name];
            var ret = callback(pair.key, pair.value);
            if (ret === false) {
                return;
            }
        }
    }
};

/**
 * Returns true if this dictionary contains a mapping for the specified key.
 * @param {Object} key key whose presence in this dictionary is to be
 * tested.
 * @return {boolean} true if this dictionary contains a mapping for the
 * specified key.
 */
buckets.Dictionary.prototype.containsKey = function(key) {
    return ! buckets.isUndefined(this.get(key));
};
/**
 * Removes all mappings from this dictionary.
 * @this {buckets.Dictionary}
 */
buckets.Dictionary.prototype.clear = function() {

    this.table = {};
    this.nElements = 0;
};
/**
 * Returns the number of keys in this dictionary.
 * @return {number} the number of key-value mappings in this dictionary.
 */
buckets.Dictionary.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this dictionary contains no mappings.
 * @return {boolean} true if this dictionary contains no mappings.
 */
buckets.Dictionary.prototype.isEmpty = function() {
    return this.nElements <= 0;
};

// /**
//  * Returns true if this dictionary is equal to the given dictionary.
//  * Two dictionaries are equal if they contain the same mappings.
//  * @param {buckets.Dictionary} other the other dictionary.
//  * @param {function(Object,Object):boolean=} valuesEqualFunction optional
//  * function used to check if two values are equal.
//  * @return {boolean} true if this dictionary is equal to the given dictionary.
//  */
// buckets.Dictionary.prototype.equals = function(other,valuesEqualFunction) {
// 	var eqF = valuesEqualFunction || buckets.defaultEquals;
// 	if(!(other instanceof buckets.Dictionary)){
// 		return false;
// 	}
// 	if(this.size() !== other.size()){
// 		return false;
// 	}
// 	return this.equalsAux(this.firstNode,other.firstNode,eqF);
// };
/**
 * Creates an empty multi dictionary. 
 * @class <p>A multi dictionary is a special kind of dictionary that holds
 * multiple values against each key. Setting a value into the dictionary will 
 * add the value to an array at that key. Getting a key will return an array,
 * holding all the values set to that key.
 * This implementation accepts any kind of objects as keys.</p>
 *
 * <p>If the keys are custom objects a function which converts keys to strings must be
 * provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 * <p>If the values are custom objects a function to check equality between values
 * must be provided. Example:</p>
 *
 * <pre>
 * function petsAreEqualByAge(pet1,pet2) {
 *  return pet1.age===pet2.age;
 * }
 * </pre>
 * @constructor
 * @param {function(Object):string=} toStrFunction optional function
 * to convert keys to strings. If the keys aren't strings or if toString()
 * is not appropriate, a custom function which receives a key and returns a
 * unique string must be provided.
 * @param {function(Object,Object):boolean=} valuesEqualsFunction optional
 * function to check if two values are equal.
 * 
 */
buckets.MultiDictionary = function(toStrFunction, valuesEqualsFunction) {
    // Call the parent's constructor
    this.parent = new buckets.Dictionary(toStrFunction);
    this.equalsF = valuesEqualsFunction || buckets.defaultEquals;
};

/**
 * Returns an array holding the values to which this dictionary maps
 * the specified key.
 * Returns an empty array if this dictionary contains no mappings for this key.
 * @param {Object} key key whose associated values are to be returned.
 * @return {Array} an array holding the values to which this dictionary maps
 * the specified key.
 */
buckets.MultiDictionary.prototype.get = function(key) {
    var values = this.parent.get(key);
    if (buckets.isUndefined(values)) {
        return [];
    }
    return buckets.arrays.copy(values);
};

/**
 * Adds the value to the array associated with the specified key, if 
 * it is not already present.
 * @param {Object} key key with which the specified value is to be
 * associated.
 * @param {Object} value the value to add to the array at the key
 * @return {boolean} true if the value was not already associated with that key.
 */
buckets.MultiDictionary.prototype.set = function(key, value) {

    if (buckets.isUndefined(key) || buckets.isUndefined(value)) {
        return false;
    }
    if (!this.containsKey(key)) {
        this.parent.set(key, [value]);
        return true;
    }
    var array = this.parent.get(key);
    if (buckets.arrays.contains(array, value, this.equalsF)) {
        return false;
    }
    array.push(value);
    return true;
};

/**
 * Removes the specified values from the array of values associated with the
 * specified key. If a value isn't given, all values associated with the specified 
 * key are removed.
 * @param {Object} key key whose mapping is to be removed from the
 * dictionary.
 * @param {Object=} value optional argument to specify the value to remove 
 * from the array associated with the specified key.
 * @return {*} true if the dictionary changed, false if the key doesn't exist or 
 * if the specified value isn't associated with the specified key.
 */
buckets.MultiDictionary.prototype.remove = function(key, value) {
    if (buckets.isUndefined(value)) {
        var v = this.parent.remove(key);
        if (buckets.isUndefined(v)) {
            return false;
        }
        return true;
    }
    var array = this.parent.get(key);
    if (buckets.arrays.remove(array, value, this.equalsF)) {
        if (array.length === 0) {
            this.parent.remove(key);
        }
        return true;
    }
    return false;
};

/**
 * Returns an array containing all of the keys in this dictionary.
 * @return {Array} an array containing all of the keys in this dictionary.
 */
buckets.MultiDictionary.prototype.keys = function() {
    return this.parent.keys();
};

/**
 * Returns an array containing all of the values in this dictionary.
 * @return {Array} an array containing all of the values in this dictionary.
 */
buckets.MultiDictionary.prototype.values = function() {
    var values = this.parent.values();
    var array = [];
    for (var i = 0; i < values.length; i++) {
        var v = values[i];
        for (var j = 0; j < v.length; j++) {
            array.push(v[j]);
        }
    }
    return array;
};

/**
 * Returns true if this dictionary at least one value associatted the specified key.
 * @param {Object} key key whose presence in this dictionary is to be
 * tested.
 * @return {boolean} true if this dictionary at least one value associatted 
 * the specified key.
 */
buckets.MultiDictionary.prototype.containsKey = function(key) {
    return this.parent.containsKey(key);
};

/**
 * Removes all mappings from this dictionary.
 */
buckets.MultiDictionary.prototype.clear = function() {
    return this.parent.clear();
};

/**
 * Returns the number of keys in this dictionary.
 * @return {number} the number of key-value mappings in this dictionary.
 */
buckets.MultiDictionary.prototype.size = function() {
    return this.parent.size();
};

/**
 * Returns true if this dictionary contains no mappings.
 * @return {boolean} true if this dictionary contains no mappings.
 */
buckets.MultiDictionary.prototype.isEmpty = function() {
    return this.parent.isEmpty();
};

/**
 * Creates an empty Heap.
 * @class 
 * <p>A heap is a binary tree, where the nodes maintain the heap property: 
 * each node is smaller than each of its children. 
 * This implementation uses an array to store elements.</p>
 * <p>If the inserted elements are custom objects a compare function must be provided, 
 *  at construction time, otherwise the <=, === and >= operators are 
 * used to compare elements. Example:</p>
 *
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 *
 * <p>If a Max-Heap is wanted (greater elements on top) you can a provide a
 * reverse compare function to accomplish that behavior. Example:</p>
 *
 * <pre>
 * function reverseCompare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return 1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return -1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two elements. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.Heap = function(compareFunction) {

    /**
     * Array used to store the elements od the heap.
     * @type {Array.<Object>}
     * @private
     */
    this.data = [];

    /**
     * Function used to compare elements.
     * @type {function(Object,Object):number}
     * @private
     */
    this.compare = compareFunction || buckets.defaultCompare;
};
/**
 * Returns the index of the left child of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the left child
 * for.
 * @return {number} The index of the left child.
 * @private
 */
buckets.Heap.prototype.leftChildIndex = function(nodeIndex) {
    return (2 * nodeIndex) + 1;
};
/**
 * Returns the index of the right child of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the right child
 * for.
 * @return {number} The index of the right child.
 * @private
 */
buckets.Heap.prototype.rightChildIndex = function(nodeIndex) {
    return (2 * nodeIndex) + 2;
};
/**
 * Returns the index of the parent of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the parent for.
 * @return {number} The index of the parent.
 * @private
 */
buckets.Heap.prototype.parentIndex = function(nodeIndex) {
    return Math.floor((nodeIndex - 1) / 2);
};
/**
 * Returns the index of the smaller child node (if it exists).
 * @param {number} leftChild left child index.
 * @param {number} rightChild right child index.
 * @return {number} the index with the minimum value or -1 if it doesn't
 * exists.
 * @private
 */
buckets.Heap.prototype.minIndex = function(leftChild, rightChild) {

    if (rightChild >= this.data.length) {
        if (leftChild >= this.data.length) {
            return - 1;
        } else {
            return leftChild;
        }
    } else {
        if (this.compare(this.data[leftChild], this.data[rightChild]) <= 0) {
            return leftChild;
        } else {
            return rightChild;
        }
    }
};
/**
 * Moves the node at the given index up to its proper place in the heap.
 * @param {number} index The index of the node to move up.
 * @private
 */
buckets.Heap.prototype.siftUp = function(index) {

    var parent = this.parentIndex(index);
    while (index > 0 && this.compare(this.data[parent], this.data[index]) > 0) {
        buckets.arrays.swap(this.data, parent, index);
        index = parent;
        parent = this.parentIndex(index);
    }
};
/**
 * Moves the node at the given index down to its proper place in the heap.
 * @param {number} nodeIndex The index of the node to move down.
 * @private
 */
buckets.Heap.prototype.siftDown = function(nodeIndex) {

    //smaller child index
    var min = this.minIndex(this.leftChildIndex(nodeIndex),
    this.rightChildIndex(nodeIndex));

    while (min >= 0 && this.compare(this.data[nodeIndex],
    this.data[min]) > 0) {
        buckets.arrays.swap(this.data, min, nodeIndex);
        nodeIndex = min;
        min = this.minIndex(this.leftChildIndex(nodeIndex),
        this.rightChildIndex(nodeIndex));
    }
};
/**
 * Retrieves but does not remove the root element of this heap.
 * @return {*} The value at the root of the heap. Returns undefined if the
 * heap is empty.
 */
buckets.Heap.prototype.peek = function() {

    if (this.data.length > 0) {
        return this.data[0];
    } else {
        return undefined;
    }
};
/**
 * Adds the given element into the heap.
 * @param {*} element the element.
 * @return true if the element was added or fals if it is undefined.
 */
buckets.Heap.prototype.add = function(element) {
    if (buckets.isUndefined(element)) {
        return undefined;
    }
    this.data.push(element);
    this.siftUp(this.data.length - 1);
    return true;
};

/**
 * Retrieves and removes the root element of this heap.
 * @return {*} The value removed from the root of the heap. Returns
 * undefined if the heap is empty.
 */
buckets.Heap.prototype.removeRoot = function() {

    if (this.data.length > 0) {
        var obj = this.data[0];
        this.data[0] = this.data[this.data.length - 1];
        this.data.splice(this.data.length - 1, 1);
        if (this.data.length > 0) {
            this.siftDown(0);
        }
        return obj;
    }
    return undefined;
};
/**
 * Returns true if this heap contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this Heap contains the specified element, false
 * otherwise.
 */
buckets.Heap.prototype.contains = function(element) {
    var equF = buckets.compareToEquals(this.compare);
    return buckets.arrays.contains(this.data, element, equF);
};
/**
 * Returns the number of elements in this heap.
 * @return {number} the number of elements in this heap.
 */
buckets.Heap.prototype.size = function() {
    return this.data.length;
};
/**
 * Checks if this heap is empty.
 * @return {boolean} true if and only if this heap contains no items; false
 * otherwise.
 */
buckets.Heap.prototype.isEmpty = function() {
    return this.data.length <= 0;
};
/**
 * Removes all of the elements from this heap.
 */
buckets.Heap.prototype.clear = function() {
    this.data.length = 0;
};

/**
 * Executes the provided function once for each element present in this heap in 
 * no particular order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Heap.prototype.forEach = function(callback) {
   buckets.arrays.forEach(this.data,callback);
};

/**
 * Creates an empty Stack.
 * @class A Stack is a Last-In-First-Out (LIFO) data structure, the last
 * element added to the stack will be the first one to be removed. This
 * implementation uses a linked list as a container.
 * @constructor
 */
buckets.Stack = function() {

    /**
     * List containing the elements.
     * @type buckets.LinkedList
     * @private
     */
    this.list = new buckets.LinkedList();
};
/**
 * Pushes an item onto the top of this stack.
 * @param {Object} elem the element to be pushed onto this stack.
 * @return {boolean} true if the element was pushed or false if it is undefined.
 */
buckets.Stack.prototype.push = function(elem) {
    return this.list.add(elem, 0);
};
/**
 * Pushes an item onto the top of this stack.
 * @param {Object} elem the element to be pushed onto this stack.
 * @return {boolean} true if the element was pushed or false if it is undefined.
 */
buckets.Stack.prototype.add = function(elem) {
    return this.list.add(elem, 0);
};
/**
 * Removes the object at the top of this stack and returns that object.
 * @return {*} the object at the top of this stack or undefined if the
 * stack is empty.
 */
buckets.Stack.prototype.pop = function() {
    return this.list.removeElementAtIndex(0);
};
/**
 * Looks at the object at the top of this stack without removing it from the
 * stack.
 * @return {*} the object at the top of this stack or undefined if the
 * stack is empty.
 */
buckets.Stack.prototype.peek = function() {
    return this.list.first();
};
/**
 * Returns the number of elements in this stack.
 * @return {number} the number of elements in this stack.
 */
buckets.Stack.prototype.size = function() {
    return this.list.size();
};

/**
 * Returns true if this stack contains the specified element.
 * <p>If the elements inside this stack are
 * not comparable with the === operator, a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} elem element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function to check if two elements are equal.
 * @return {boolean} true if this stack contains the specified element,
 * false otherwise.
 */
buckets.Stack.prototype.contains = function(elem, equalsFunction) {
    return this.list.contains(elem, equalsFunction);
};
/**
 * Checks if this stack is empty.
 * @return {boolean} true if and only if this stack contains no items; false
 * otherwise.
 */
buckets.Stack.prototype.isEmpty = function() {
    return this.list.isEmpty();
};
/**
 * Removes all of the elements from this stack.
 */
buckets.Stack.prototype.clear = function() {
    this.list.clear();
};

/**
 * Executes the provided function once for each element present in this stack in 
 * LIFO order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Stack.prototype.forEach = function(callback) {
   this.list.forEach(callback);
};

/**
 * Creates an empty queue.
 * @class A queue is a First-In-First-Out (FIFO) data structure, the first
 * element added to the queue will be the first one to be removed. This
 * implementation uses a linked list as a container.
 * @constructor
 */
buckets.Queue = function() {

    /**
     * List containing the elements.
     * @type buckets.LinkedList
     * @private
     */
    this.list = new buckets.LinkedList();
};
/**
 * Inserts the specified element into the end of this queue.
 * @param {Object} elem the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.Queue.prototype.enqueue = function(elem) {
    return this.list.add(elem);
};
/**
 * Inserts the specified element into the end of this queue.
 * @param {Object} elem the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.Queue.prototype.add = function(elem) {
    return this.list.add(elem);
};
/**
 * Retrieves and removes the head of this queue.
 * @return {*} the head of this queue, or undefined if this queue is empty.
 */
buckets.Queue.prototype.dequeue = function() {
    if (this.list.size() !== 0) {
        var el = this.list.first();
        this.list.removeElementAtIndex(0);
        return el;
    }
    return undefined;
};
/**
 * Retrieves, but does not remove, the head of this queue.
 * @return {*} the head of this queue, or undefined if this queue is empty.
 */
buckets.Queue.prototype.peek = function() {

    if (this.list.size() !== 0) {
        return this.list.first();
    }
    return undefined;
};

/**
 * Returns the number of elements in this queue.
 * @return {number} the number of elements in this queue.
 */
buckets.Queue.prototype.size = function() {
    return this.list.size();
};

/**
 * Returns true if this queue contains the specified element.
 * <p>If the elements inside this stack are
 * not comparable with the === operator, a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} elem element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function to check if two elements are equal.
 * @return {boolean} true if this queue contains the specified element,
 * false otherwise.
 */
buckets.Queue.prototype.contains = function(elem, equalsFunction) {
    return this.list.contains(elem, equalsFunction);
};

/**
 * Checks if this queue is empty.
 * @return {boolean} true if and only if this queue contains no items; false
 * otherwise.
 */
buckets.Queue.prototype.isEmpty = function() {
    return this.list.size() <= 0;
};

/**
 * Removes all of the elements from this queue.
 */
buckets.Queue.prototype.clear = function() {
    this.list.clear();
};

/**
 * Executes the provided function once for each element present in this queue in 
 * FIFO order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Queue.prototype.forEach = function(callback) {
   this.list.forEach(callback);
};

/**
 * Creates an empty priority queue.
 * @class <p>In a priority queue each element is associated with a "priority",
 * elements are dequeued in highest-priority-first order (the elements with the 
 * highest priority are dequeued first). Priority Queues are implemented as heaps. 
 * If the inserted elements are custom objects a compare function must be provided, 
 * otherwise the <=, === and >= operators are used to compare object priority.</p>
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two element priorities. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.PriorityQueue = function(compareFunction) {
    this.heap = new buckets.Heap(buckets.reverseCompareFunction(compareFunction));
};

/**
 * Inserts the specified element into this priority queue.
 * @param {Object} element the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.PriorityQueue.prototype.enqueue = function(element) {
    return this.heap.add(element);
};

/**
 * Inserts the specified element into this priority queue.
 * @param {Object} element the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.PriorityQueue.prototype.add = function(element) {
    return this.heap.add(element);
};

/**
 * Retrieves and removes the highest priority element of this queue.
 * @return {*} the the highest priority element of this queue, 
or undefined if this queue is empty.
 */
buckets.PriorityQueue.prototype.dequeue = function() {
    if (this.heap.size() !== 0) {
        var el = this.heap.peek();
        this.heap.removeRoot();
        return el;
    }
    return undefined;
};

/**
 * Retrieves, but does not remove, the highest priority element of this queue.
 * @return {*} the highest priority element of this queue, or undefined if this queue is empty.
 */
buckets.PriorityQueue.prototype.peek = function() {
    return this.heap.peek();
};

/**
 * Returns true if this priority queue contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this priority queue contains the specified element,
 * false otherwise.
 */
buckets.PriorityQueue.prototype.contains = function(element) {
    return this.heap.contains(element);
};

/**
 * Checks if this priority queue is empty.
 * @return {boolean} true if and only if this priority queue contains no items; false
 * otherwise.
 */
buckets.PriorityQueue.prototype.isEmpty = function() {
    return this.heap.isEmpty();
};

/**
 * Returns the number of elements in this priority queue.
 * @return {number} the number of elements in this priority queue.
 */
buckets.PriorityQueue.prototype.size = function() {
    return this.heap.size();
};

/**
 * Removes all of the elements from this priority queue.
 */
buckets.PriorityQueue.prototype.clear = function() {
    this.heap.clear();
};

/**
 * Executes the provided function once for each element present in this queue in 
 * no particular order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.PriorityQueue.prototype.forEach = function(callback) {
   buckets.heap.forEach(callback);
};


/**
 * Creates an empty set.
 * @class <p>A set is a data structure that contains no duplicate items.</p>
 * <p>If the inserted elements are custom objects a function 
 * which converts elements to strings must be provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object):string=} toStringFunction optional function used
 * to convert elements to strings. If the elements aren't strings or if toString()
 * is not appropriate, a custom function which receives a onject and returns a
 * unique string must be provided.
 */
buckets.Set = function(toStringFunction) {
    this.dictionary = new buckets.Dictionary(toStringFunction);
};

/**
 * Returns true if this set contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this set contains the specified element,
 * false otherwise.
 */
buckets.Set.prototype.contains = function(element) {
    return this.dictionary.containsKey(element);
};

/**
 * Adds the specified element to this set if it is not already present.
 * @param {Object} element the element to insert.
 * @return {boolean} true if this set did not already contain the specified element.
 */
buckets.Set.prototype.add = function(element) {
    if (this.contains(element) || buckets.isUndefined(element)) {
        return false;
    } else {
        this.dictionary.set(element, element);
        return true;
    }
};

/**
 * Performs an intersecion between this an another set.
 * Removes all values that are not present this set and the given set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.intersection = function(otherSet) {
    var set = this;
    this.forEach(function(element) {
        if (!otherSet.contains(element)) {
            set.remove(element);
        }
    });
};

/**
 * Performs a union between this an another set.
 * Adds all values from the given set to this set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.union = function(otherSet) {
    var set = this;
    otherSet.forEach(function(element) {
        set.add(element);
    });
};

/**
 * Performs a difference between this an another set.
 * Removes from this set all the values that are present in the given set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.difference = function(otherSet) {
    var set = this;
    otherSet.forEach(function(element) {
        set.remove(element);
    });
};

/**
 * Checks whether the given set contains all the elements in this set.
 * @param {buckets.Set} otherSet other set.
 * @return {boolean} true if this set is a subset of the given set.
 */
buckets.Set.prototype.isSubsetOf = function(otherSet) {
    if (this.size() > otherSet.size()) {
        return false;
    }

    this.forEach(function(element) {
        if (!otherSet.contains(element)) {
            return false;
        }
    });
    return true;
};

/**
 * Removes the specified element from this set if it is present.
 * @return {boolean} true if this set contained the specified element.
 */
buckets.Set.prototype.remove = function(element) {
    if (!this.contains(element)) {
        return false;
    } else {
        this.dictionary.remove(element);
        return true;
    }
};

/**
 * Executes the provided function once for each element 
 * present in this set.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one arguments: the element. To break the iteration you can 
 * optionally return false.
 */
buckets.Set.prototype.forEach = function(callback) {
    this.dictionary.forEach(function(k, v) {
        return callback(v);
    });
};

/**
 * Returns an array containing all of the elements in this set in arbitrary order.
 * @return {Array} an array containing all of the elements in this set.
 */
buckets.Set.prototype.toArray = function() {
    return this.dictionary.values();
};

/**
 * Returns true if this set contains no elements.
 * @return {boolean} true if this set contains no elements.
 */
buckets.Set.prototype.isEmpty = function() {
    return this.dictionary.isEmpty();
};

/**
 * Returns the number of elements in this set.
 * @return {number} the number of elements in this set.
 */
buckets.Set.prototype.size = function() {
    return this.dictionary.size();
};

/**
 * Removes all of the elements from this set.
 */
buckets.Set.prototype.clear = function() {
    this.dictionary.clear();
};

/**
 * Creates an empty bag.
 * @class <p>A bag is a special kind of set in which members are 
 * allowed to appear more than once.</p>
 * <p>If the inserted elements are custom objects a function 
 * which converts elements to unique strings must be provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object):string=} toStringFunction optional function used
 * to convert elements to strings. If the elements aren't strings or if toString()
 * is not appropriate, a custom function which receives an object and returns a
 * unique string must be provided.
 */
buckets.Bag = function(toStrFunction) {
    this.toStrF = toStrFunction || buckets.defaultToString;
    this.dictionary = new buckets.Dictionary(this.toStrF);
    this.nElements = 0;
};

/**
* Adds nCopies of the specified object to this bag.
* @param {Object} element element to add.
* @param {number=} nCopies the number of copies to add, if this argument is
* undefined 1 copy is added.
* @return {boolean} true unless element is undefined.
*/
buckets.Bag.prototype.add = function(element, nCopies) {

    if (isNaN(nCopies) || buckets.isUndefined(nCopies)) {
        nCopies = 1;
    }
    if (buckets.isUndefined(element) || nCopies <= 0) {
        return false;
    }

    if (!this.contains(element)) {
        var node = {
            value: element,
            copies: nCopies
        };
        this.dictionary.set(element, node);
    } else {
        this.dictionary.get(element).copies += nCopies;
    }
    this.nElements += nCopies;
    return true;
};

/**
* Counts the number of copies of the specified object in this bag.
* @param {Object} element the object to search for..
* @return {number} the number of copies of the object, 0 if not found
*/
buckets.Bag.prototype.count = function(element) {

    if (!this.contains(element)) {
        return 0;
    } else {
        return this.dictionary.get(element).copies;
    }
};

/**
 * Returns true if this bag contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this bag contains the specified element,
 * false otherwise.
 */
buckets.Bag.prototype.contains = function(element) {
    return this.dictionary.containsKey(element);
};

/**
* Removes nCopies of the specified object to this bag.
* If the number of copies to remove is greater than the actual number 
* of copies in the Bag, all copies are removed. 
* @param {Object} element element to remove.
* @param {number=} nCopies the number of copies to remove, if this argument is
* undefined 1 copy is removed.
* @return {boolean} true if at least 1 element was removed.
*/
buckets.Bag.prototype.remove = function(element, nCopies) {

    if (isNaN(nCopies) || buckets.isUndefined(nCopies)) {
        nCopies = 1;
    }
    if (buckets.isUndefined(element) || nCopies <= 0) {
        return false;
    }

    if (!this.contains(element)) {
        return false;
    } else {
        var node = this.dictionary.get(element);
        if (nCopies > node.copies) {
            this.nElements -= node.copies;
        } else {
            this.nElements -= nCopies;
        }
        node.copies -= nCopies;
        if (node.copies <= 0) {
            this.dictionary.remove(element);
        }
        return true;
    }
};

/**
 * Returns an array containing all of the elements in this big in arbitrary order, 
 * including multiple copies.
 * @return {Array} an array containing all of the elements in this bag.
 */
buckets.Bag.prototype.toArray = function() {
    var a = [];
    var values = this.dictionary.values();
    var vl = values.length;
    for (var i = 0; i < vl; i++) {
        var node = values[i];
        var element = node.value;
        var copies = node.copies;
        for (var j = 0; j < copies; j++) {
            a.push(element);
        }
    }
    return a;
};

/**
 * Returns a set of unique elements in this bag. 
 * @return {buckets.Set} a set of unique elements in this bag.
 */
buckets.Bag.prototype.toSet = function() {
    var set = new buckets.Set(this.toStrF);
    var elements = this.dictionary.values();
    var l = elements.length;
    for (var i = 0; i < l; i++) {
        var value = elements[i].value;
        set.add(value);
    }
    return set;
};

/**
 * Executes the provided function once for each element 
 * present in this bag, including multiple copies.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element. To break the iteration you can 
 * optionally return false.
 */
buckets.Bag.prototype.forEach = function(callback) {
    this.dictionary.forEach(function(k, v) {
        var value = v.value;
        var copies = v.copies;
        for (var i = 0; i < copies; i++) {
            if (callback(value) === false) {
                return false;
            }
        }
        return true;
    });
};
/**
 * Returns the number of elements in this bag.
 * @return {number} the number of elements in this bag.
 */
buckets.Bag.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this bag contains no elements.
 * @return {boolean} true if this bag contains no elements.
 */
buckets.Bag.prototype.isEmpty = function() {
    return this.nElements === 0;
};

/**
 * Removes all of the elements from this bag.
 */
buckets.Bag.prototype.clear = function() {
    this.nElements = 0;
    this.dictionary.clear();
};



/**
 * Creates an empty binary search tree.
 * @class <p>A binary search tree is a binary tree in which each 
 * internal node stores an element such that the elements stored in the 
 * left subtree are less than it and the elements 
 * stored in the right subtree are greater.</p>
 * <p>Formally, a binary search tree is a node-based binary tree data structure which 
 * has the following properties:</p>
 * <ul>
 * <li>The left subtree of a node contains only nodes with elements less 
 * than the node's element</li>
 * <li>The right subtree of a node contains only nodes with elements greater 
 * than the node's element</li>
 * <li>Both the left and right subtrees must also be binary search trees.</li>
 * </ul>
 * <p>If the inserted elements are custom objects a compare function must 
 * be provided at construction time, otherwise the <=, === and >= operators are 
 * used to compare elements. Example:</p>
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two elements. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.BSTree = function(compareFunction) {
    this.root = null;
    this.compare = compareFunction || buckets.defaultCompare;
    this.nElements = 0;
};


/**
 * Adds the specified element to this tree if it is not already present.
 * @param {Object} element the element to insert.
 * @return {boolean} true if this tree did not already contain the specified element.
 */
buckets.BSTree.prototype.add = function(element) {
    if (buckets.isUndefined(element)) {
        return false;
    }

    if (this.insertNode(this.createNode(element)) !== null) {
        this.nElements++;
        return true;
    }
    return false;
};

/**
 * Removes all of the elements from this tree.
 */
buckets.BSTree.prototype.clear = function() {
    this.root = null;
    this.nElements = 0;
};

/**
 * Returns true if this tree contains no elements.
 * @return {boolean} true if this tree contains no elements.
 */
buckets.BSTree.prototype.isEmpty = function() {
    return this.nElements === 0;
};

/**
 * Returns the number of elements in this tree.
 * @return {number} the number of elements in this tree.
 */
buckets.BSTree.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this tree contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this tree contains the specified element,
 * false otherwise.
 */
buckets.BSTree.prototype.contains = function(element) {
    if (buckets.isUndefined(element)) {
        return false;
    }
    return this.searchNode(this.root, element) !== null;
};

/**
 * Removes the specified element from this tree if it is present.
 * @return {boolean} true if this tree contained the specified element.
 */
buckets.BSTree.prototype.remove = function(element) {
    var node = this.searchNode(this.root, element);
    if (node === null) {
        return false;
    }
    this.removeNode(node);
    this.nElements--;
    return true;
};

/**
 * Executes the provided function once for each element present in this tree in 
 * in-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.inorderTraversal = function(callback) {
    this.inorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in pre-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.preorderTraversal = function(callback) {
    this.preorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in post-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.postorderTraversal = function(callback) {
    this.postorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in 
 * level-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.levelTraversal = function(callback) {
    this.levelTraversalAux(this.root, callback);
};

/**
 * Returns the minimum element of this tree.
 * @return {*} the minimum element of this tree or undefined if this tree is
 * is empty.
 */
buckets.BSTree.prototype.minimum = function() {
    if (this.isEmpty()) {
        return undefined;
    }
    return this.minimumAux(this.root).element;
};

/**
 * Returns the maximum element of this tree.
 * @return {*} the maximum element of this tree or undefined if this tree is
 * is empty.
 */
buckets.BSTree.prototype.maximum = function() {
    if (this.isEmpty()) {
        return undefined;
    }
    return this.maximumAux(this.root).element;
};

/**
 * Executes the provided function once for each element present in this tree in inorder.
 * Equivalent to inorderTraversal.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.BSTree.prototype.forEach = function(callback) {
    this.inorderTraversal(callback);
};

/**
 * Returns an array containing all of the elements in this tree in in-order.
 * @return {Array} an array containing all of the elements in this tree in in-order.
 */
buckets.BSTree.prototype.toArray = function() {
    var array = [];
    this.inorderTraversal(function(element) {
        array.push(element);
    });
    return array;
};

/**
 * Returns the height of this tree.
 * @return {number} the height of this tree or -1 if is empty.
 */
buckets.BSTree.prototype.height = function() {
    return this.heightAux(this.root);
};

/**
* @private
*/
buckets.BSTree.prototype.searchNode = function(node, element) {
    var cmp = null;
    while (node !== null && cmp !== 0) {
        cmp = this.compare(element, node.element);
        if (cmp < 0) {
            node = node.leftCh;
        } else if (cmp > 0) {
            node = node.rightCh;
        }
    }
    return node;
};


/**
* @private
*/
buckets.BSTree.prototype.transplant = function(n1, n2) {
    if (n1.parent === null) {
        this.root = n2;
    } else if (n1 === n1.parent.leftCh) {
        n1.parent.leftCh = n2;
    } else {
        n1.parent.rightCh = n2;
    }
    if (n2 !== null) {
        n2.parent = n1.parent;
    }
};


/**
* @private
*/
buckets.BSTree.prototype.removeNode = function(node) {
    if (node.leftCh === null) {
        this.transplant(node, node.rightCh);
    } else if (node.rightCh === null) {
        this.transplant(node, node.leftCh);
    } else {
        var y = this.minimumAux(node.rightCh);
        if (y.parent !== node) {
            this.transplant(y, y.rightCh);
            y.rightCh = node.rightCh;
            y.rightCh.parent = y;
        }
        this.transplant(node, y);
        y.leftCh = node.leftCh;
        y.leftCh.parent = y;
    }
};
/**
* @private
*/
buckets.BSTree.prototype.inorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    this.inorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
    if (signal.stop) {
        return;
    }
    this.inorderTraversalAux(node.rightCh, callback, signal);
};

/**
* @private
*/
buckets.BSTree.prototype.levelTraversalAux = function(node, callback) {
    var queue = new buckets.Queue();
    if (node !== null) {
        queue.enqueue(node);
    }
    while (!queue.isEmpty()) {
        node = queue.dequeue();
        if (callback(node.element) === false) {
            return;
        }
        if (node.leftCh !== null) {
            queue.enqueue(node.leftCh);
        }
        if (node.rightCh !== null) {
            queue.enqueue(node.rightCh);
        }
    }
};

/**
* @private
*/
buckets.BSTree.prototype.preorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
    if (signal.stop) {
        return;
    }
    this.preorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    this.preorderTraversalAux(node.rightCh, callback, signal);
};
/**
* @private
*/
buckets.BSTree.prototype.postorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    this.postorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    this.postorderTraversalAux(node.rightCh, callback, signal);
    if (signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
};

/**
* @private
*/
buckets.BSTree.prototype.minimumAux = function(node) {
    while (node.leftCh !== null) {
        node = node.leftCh;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.maximumAux = function(node) {
    while (node.rightCh !== null) {
        node = node.rightCh;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.successorNode = function(node) {
    if (node.rightCh !== null) {
        return this.minimumAux(node.rightCh);
    }
    var successor = node.parent;
    while (successor !== null && node === successor.rightCh) {
        node = successor;
        successor = node.parent;
    }
    return successor;
};

/**
* @private
*/
buckets.BSTree.prototype.heightAux = function(node) {
    if (node === null) {
        return - 1;
    }
    return Math.max(this.heightAux(node.leftCh), this.heightAux(node.rightCh)) + 1;
};

/*
* @private
*/
buckets.BSTree.prototype.insertNode = function(node) {

    var parent = null;
    var position = this.root;
    var cmp = null;
    while (position !== null) {
        cmp = this.compare(node.element, position.element);
        if (cmp === 0) {
            return null;
        } else if (cmp < 0) {
            parent = position;
            position = position.leftCh;
        } else {
            parent = position;
            position = position.rightCh;
        }
    }
    node.parent = parent;
    if (parent === null) {
        // tree is empty
        this.root = node;
    } else if (this.compare(node.element, parent.element) < 0) {
        parent.leftCh = node;
    } else {
        parent.rightCh = node;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.createNode = function(element) {
    return {
        element: element,
        leftCh: null,
        rightCh: null,
        parent: null
    };
};
/* ===================================================
 * bootstrap-transition.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  $(function () {

    "use strict"; // jshint ;_;


    /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
     * ======================================================= */

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd'
            ,  'msTransition'     : 'MSTransitionEnd'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

  })

}(window.jQuery);
/* =========================================================
 * bootstrap-modal.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


!function ($) {

  "use strict"; // jshint ;_;


 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function (content, options) {
    this.options = options
    this.$element = $(content)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this
          , e = $.Event('show')

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        $('body').addClass('modal-open')

        this.isShown = true

        escape.call(this)
        backdrop.call(this, function () {
          var transition = $.support.transition && that.$element.hasClass('fade')

          if (!that.$element.parent().length) {
            that.$element.appendTo(document.body) //don't move modals dom position
          }

          that.$element
            .show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element.addClass('in')

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.trigger('shown') }) :
            that.$element.trigger('shown')

        })
      }

    , hide: function (e) {
        e && e.preventDefault()

        var that = this

        e = $.Event('hide')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        $('body').removeClass('modal-open')

        escape.call(this)

        this.$element.removeClass('in')

        $.support.transition && this.$element.hasClass('fade') ?
          hideWithTransition.call(this) :
          hideModal.call(this)
      }

  }


 /* MODAL PRIVATE METHODS
  * ===================== */

  function hideWithTransition() {
    var that = this
      , timeout = setTimeout(function () {
          that.$element.off($.support.transition.end)
          hideModal.call(that)
        }, 500)

    this.$element.one($.support.transition.end, function () {
      clearTimeout(timeout)
      hideModal.call(that)
    })
  }

  function hideModal(that) {
    this.$element
      .hide()
      .trigger('hidden')

    backdrop.call(this)
  }

  function backdrop(callback) {
    var that = this
      , animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
        .appendTo(document.body)

      if (this.options.backdrop != 'static') {
        this.$backdrop.click($.proxy(this.hide, this))
      }

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      doAnimate ?
        this.$backdrop.one($.support.transition.end, callback) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      $.support.transition && this.$element.hasClass('fade')?
        this.$backdrop.one($.support.transition.end, $.proxy(removeBackdrop, this)) :
        removeBackdrop.call(this)

    } else if (callback) {
      callback()
    }
  }

  function removeBackdrop() {
    this.$backdrop.remove()
    this.$backdrop = null
  }

  function escape() {
    var that = this
    if (this.isShown && this.options.keyboard) {
      $(document).on('keyup.dismiss.modal', function ( e ) {
        e.which == 27 && that.hide()
      })
    } else if (!this.isShown) {
      $(document).off('keyup.dismiss.modal')
    }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  $.fn.modal = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL DATA-API
  * ============== */

  $(function () {
    $('body').on('click.modal.data-api', '[data-toggle="modal"]', function ( e ) {
      var $this = $(this), href
        , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        , option = $target.data('modal') ? 'toggle' : $.extend({}, $target.data(), $this.data())

      e.preventDefault()
      $target.modal(option)
    })
  })

}(window.jQuery);
/* ============================================================
 * bootstrap-dropdown.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle="dropdown"]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function (e) {
      var $this = $(this)
        , $parent
        , selector
        , isActive

      if ($this.is('.disabled, :disabled')) return

      selector = $this.attr('data-target')

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      $parent = $(selector)
      $parent.length || ($parent = $this.parent())

      isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) $parent.toggleClass('open')

      return false
    }

  }

  function clearMenus() {
    $(toggle).parent().removeClass('open')
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(function () {
    $('html').on('click.dropdown.data-api', clearMenus)
    $('body')
      .on('click.dropdown', '.dropdown form', function (e) { e.stopPropagation() })
      .on('click.dropdown.data-api', toggle, Dropdown.prototype.toggle)
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-scrollspy.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#scrollspy
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================== */


!function ($) {

  "use strict"; // jshint ;_;


  /* SCROLLSPY CLASS DEFINITION
   * ========================== */

  function ScrollSpy( element, options) {
    var process = $.proxy(this.process, this)
      , $element = $(element).is('body') ? $(window) : $(element)
      , href
    this.options = $.extend({}, $.fn.scrollspy.defaults, options)
    this.$scrollElement = $element.on('scroll.scroll.data-api', process)
    this.selector = (this.options.target
      || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      || '') + ' .nav li > a'
    this.$body = $('body')
    this.refresh()
    this.process()
  }

  ScrollSpy.prototype = {

      constructor: ScrollSpy

    , refresh: function () {
        var self = this
          , $targets

        this.offsets = $([])
        this.targets = $([])

        $targets = this.$body
          .find(this.selector)
          .map(function () {
            var $el = $(this)
              , href = $el.data('target') || $el.attr('href')
              , $href = /^#\w/.test(href) && $(href)
            return ( $href
              && href.length
              && [[ $href.position().top, href ]] ) || null
          })
          .sort(function (a, b) { return a[0] - b[0] })
          .each(function () {
            self.offsets.push(this[0])
            self.targets.push(this[1])
          })
      }

    , process: function () {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
          , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
          , maxScroll = scrollHeight - this.$scrollElement.height()
          , offsets = this.offsets
          , targets = this.targets
          , activeTarget = this.activeTarget
          , i

        if (scrollTop >= maxScroll) {
          return activeTarget != (i = targets.last()[0])
            && this.activate ( i )
        }

        for (i = offsets.length; i--;) {
          activeTarget != targets[i]
            && scrollTop >= offsets[i]
            && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
            && this.activate( targets[i] )
        }
      }

    , activate: function (target) {
        var active
          , selector

        this.activeTarget = target

        $(this.selector)
          .parent('.active')
          .removeClass('active')

        selector = this.selector
          + '[data-target="' + target + '"],'
          + this.selector + '[href="' + target + '"]'

        active = $(selector)
          .parent('li')
          .addClass('active')

        if (active.parent('.dropdown-menu'))  {
          active = active.closest('li.dropdown').addClass('active')
        }

        active.trigger('activate')
      }

  }


 /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

  $.fn.scrollspy = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('scrollspy')
        , options = typeof option == 'object' && option
      if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.scrollspy.Constructor = ScrollSpy

  $.fn.scrollspy.defaults = {
    offset: 10
  }


 /* SCROLLSPY DATA-API
  * ================== */

  $(function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      $spy.scrollspy($spy.data())
    })
  })

}(window.jQuery);
/* ========================================================
 * bootstrap-tab.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TAB CLASS DEFINITION
  * ==================== */

  var Tab = function ( element ) {
    this.element = $(element)
  }

  Tab.prototype = {

    constructor: Tab

  , show: function () {
      var $this = this.element
      , $ul = $this.closest('ul:not(.dropdown-menu)')
        , selector = $this.attr('data-target')
        , previous
        , $target
        , e

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      if ( $this.parent('li').hasClass('active') ) return

      previous = $ul.find('.active a').last()[0]

      e = $.Event('show', {
        relatedTarget: previous
      })

      $this.trigger(e)

      if (e.isDefaultPrevented()) return

      $target = $(selector)

      this.activate($this.parent('li'), $ul)
      this.activate($target, $target.parent(), function () {
        $this.trigger({
          type: 'shown'
        , relatedTarget: previous
        })
      })
    }

  , activate: function ( element, container, callback) {
      var $active = container.find('> .active')
        , transition = callback
            && $.support.transition
            && $active.hasClass('fade')

      function next() {
        $active
          .removeClass('active')
          .find('> .dropdown-menu > .active')
          .removeClass('active')

        element.addClass('active')

        if (transition) {
          element[0].offsetWidth // reflow for transition
          element.addClass('in')
        } else {
          element.removeClass('fade')
        }

        if ( element.parent('.dropdown-menu') ) {
          element.closest('li.dropdown').addClass('active')
        }

        callback && callback()
      }

      transition ?
        $active.one($.support.transition.end, next) :
        next()

      $active.removeClass('in')
    }
  }


 /* TAB PLUGIN DEFINITION
  * ===================== */

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tab')
      if (!data) $this.data('tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


 /* TAB DATA-API
  * ============ */

  $(function () {
    $('body').on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
      e.preventDefault()
      $(this).tab('show')
    })
  })

}(window.jQuery);
/* ===========================================================
 * bootstrap-tooltip.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      if (this.options.trigger != 'manual') {
        eventIn  = this.options.trigger == 'hover' ? 'mouseenter' : 'focus'
        eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur'
        this.$element.on(eventIn, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut, this.options.selector, $.proxy(this.leave, this))
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data())

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , inside
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp

      if (this.hasContent() && this.enabled) {
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        inside = /in/.test(placement)

        $tip
          .remove()
          .css({ top: 0, left: 0, display: 'block' })
          .appendTo(inside ? this.$element : document.body)

        pos = this.getPosition(inside)

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (inside ? placement.split(' ')[1] : placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        $tip
          .css(tp)
          .addClass(placement)
          .addClass('in')
      }
    }

  , isHTML: function(text) {
      // html string detection logic adapted from jQuery
      return typeof text != 'string'
        || ( text.charAt(0) === "<"
          && text.charAt( text.length - 1 ) === ">"
          && text.length >= 3
        ) || /^(?:[^<]*<[\w\W]+>[^>]*$)/.exec(text)
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.isHTML(title) ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).remove()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.remove()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.remove()
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function (inside) {
      return $.extend({}, (inside ? {top: 0, left: 0} : this.$element.offset()), {
        width: this.$element[0].offsetWidth
      , height: this.$element[0].offsetHeight
      })
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function () {
      this[this.tip().hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover'
  , title: ''
  , delay: 0
  }

}(window.jQuery);

/* ===========================================================
 * bootstrap-popover.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* POPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var Popover = function ( element, options ) {
    this.init('popover', element, options)
  }


  /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

    constructor: Popover

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()
        , content = this.getContent()

      $tip.find('.popover-title')[this.isHTML(title) ? 'html' : 'text'](title)
      $tip.find('.popover-content > *')[this.isHTML(content) ? 'html' : 'text'](content)

      $tip.removeClass('fade top bottom left right in')
    }

  , hasContent: function () {
      return this.getTitle() || this.getContent()
    }

  , getContent: function () {
      var content
        , $e = this.$element
        , o = this.options

      content = $e.attr('data-content')
        || (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)

      return content
    }

  , tip: function () {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
      }
      return this.$tip
    }

  })


 /* POPOVER PLUGIN DEFINITION
  * ======================= */

  $.fn.popover = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('popover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.popover.Constructor = Popover

  $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
    placement: 'right'
  , content: ''
  , template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-alert.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#alerts
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* ALERT CLASS DEFINITION
  * ====================== */

  var dismiss = '[data-dismiss="alert"]'
    , Alert = function (el) {
        $(el).on('click', dismiss, this.close)
      }

  Alert.prototype.close = function (e) {
    var $this = $(this)
      , selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = $(selector)

    e && e.preventDefault()

    $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

    $parent.trigger(e = $.Event('close'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      $parent
        .trigger('closed')
        .remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent.on($.support.transition.end, removeElement) :
      removeElement()
  }


 /* ALERT PLUGIN DEFINITION
  * ======================= */

  $.fn.alert = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('alert')
      if (!data) $this.data('alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.alert.Constructor = Alert


 /* ALERT DATA-API
  * ============== */

  $(function () {
    $('body').on('click.alert.data-api', dismiss, Alert.prototype.close)
  })

}(window.jQuery);
/* ============================================================
 * bootstrap-button.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#buttons
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var Button = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.button.defaults, options)
  }

  Button.prototype.setState = function (state) {
    var d = 'disabled'
      , $el = this.$element
      , data = $el.data()
      , val = $el.is('input') ? 'val' : 'html'

    state = state + 'Text'
    data.resetText || $el.data('resetText', $el[val]())

    $el[val](data[state] || this.options[state])

    // push to event loop to allow forms to submit
    setTimeout(function () {
      state == 'loadingText' ?
        $el.addClass(d).attr(d, d) :
        $el.removeClass(d).removeAttr(d)
    }, 0)
  }

  Button.prototype.toggle = function () {
    var $parent = this.$element.parent('[data-toggle="buttons-radio"]')

    $parent && $parent
      .find('.active')
      .removeClass('active')

    this.$element.toggleClass('active')
  }


 /* BUTTON PLUGIN DEFINITION
  * ======================== */

  $.fn.button = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('button')
        , options = typeof option == 'object' && option
      if (!data) $this.data('button', (data = new Button(this, options)))
      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  $.fn.button.defaults = {
    loadingText: 'loading...'
  }

  $.fn.button.Constructor = Button


 /* BUTTON DATA-API
  * =============== */

  $(function () {
    $('body').on('click.button.data-api', '[data-toggle^=button]', function ( e ) {
      var $btn = $(e.target)
      if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
      $btn.button('toggle')
    })
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-collapse.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

  var Collapse = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options.parent) {
      this.$parent = $(this.options.parent)
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension
        , scroll
        , actives
        , hasData

      if (this.transitioning) return

      dimension = this.dimension()
      scroll = $.camelCase(['scroll', dimension].join('-'))
      actives = this.$parent && this.$parent.find('> .accordion-group > .in')

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        if (hasData && hasData.transitioning) return
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', $.Event('show'), 'shown')
      this.$element[dimension](this.$element[0][scroll])
    }

  , hide: function () {
      var dimension
      if (this.transitioning) return
      dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', $.Event('hide'), 'hidden')
      this.$element[dimension](0)
    }

  , reset: function (size) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function (method, startEvent, completeEvent) {
      var that = this
        , complete = function () {
            if (startEvent.type == 'show') that.reset()
            that.transitioning = 0
            that.$element.trigger(completeEvent)
          }

      this.$element.trigger(startEvent)

      if (startEvent.isDefaultPrevented()) return

      this.transitioning = 1

      this.$element[method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
    }

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* COLLAPSIBLE PLUGIN DEFINITION
  * ============================== */

  $.fn.collapse = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = typeof option == 'object' && option
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSIBLE DATA-API
  * ==================== */

  $(function () {
    $('body').on('click.collapse.data-api', '[data-toggle=collapse]', function ( e ) {
      var $this = $(this), href
        , target = $this.attr('data-target')
          || e.preventDefault()
          || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
        , option = $(target).data('collapse') ? 'toggle' : $this.data()
      $(target).collapse(option)
    })
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-carousel.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#carousel
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* CAROUSEL CLASS DEFINITION
  * ========================= */

  var Carousel = function (element, options) {
    this.$element = $(element)
    this.options = options
    this.options.slide && this.slide(this.options.slide)
    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
  }

  Carousel.prototype = {

    cycle: function (e) {
      if (!e) this.paused = false
      this.options.interval
        && !this.paused
        && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
      return this
    }

  , to: function (pos) {
      var $active = this.$element.find('.active')
        , children = $active.parent().children()
        , activePos = children.index($active)
        , that = this

      if (pos > (children.length - 1) || pos < 0) return

      if (this.sliding) {
        return this.$element.one('slid', function () {
          that.to(pos)
        })
      }

      if (activePos == pos) {
        return this.pause().cycle()
      }

      return this.slide(pos > activePos ? 'next' : 'prev', $(children[pos]))
    }

  , pause: function (e) {
      if (!e) this.paused = true
      clearInterval(this.interval)
      this.interval = null
      return this
    }

  , next: function () {
      if (this.sliding) return
      return this.slide('next')
    }

  , prev: function () {
      if (this.sliding) return
      return this.slide('prev')
    }

  , slide: function (type, next) {
      var $active = this.$element.find('.active')
        , $next = next || $active[type]()
        , isCycling = this.interval
        , direction = type == 'next' ? 'left' : 'right'
        , fallback  = type == 'next' ? 'first' : 'last'
        , that = this
        , e = $.Event('slide')

      this.sliding = true

      isCycling && this.pause()

      $next = $next.length ? $next : this.$element.find('.item')[fallback]()

      if ($next.hasClass('active')) return

      if ($.support.transition && this.$element.hasClass('slide')) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $next.addClass(type)
        $next[0].offsetWidth // force reflow
        $active.addClass(direction)
        $next.addClass(direction)
        this.$element.one($.support.transition.end, function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () { that.$element.trigger('slid') }, 0)
        })
      } else {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $active.removeClass('active')
        $next.addClass('active')
        this.sliding = false
        this.$element.trigger('slid')
      }

      isCycling && this.cycle()

      return this
    }

  }


 /* CAROUSEL PLUGIN DEFINITION
  * ========================== */

  $.fn.carousel = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('carousel')
        , options = $.extend({}, $.fn.carousel.defaults, typeof option == 'object' && option)
      if (!data) $this.data('carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (typeof option == 'string' || (option = options.slide)) data[option]()
      else if (options.interval) data.cycle()
    })
  }

  $.fn.carousel.defaults = {
    interval: 5000
  , pause: 'hover'
  }

  $.fn.carousel.Constructor = Carousel


 /* CAROUSEL DATA-API
  * ================= */

  $(function () {
    $('body').on('click.carousel.data-api', '[data-slide]', function ( e ) {
      var $this = $(this), href
        , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        , options = !$target.data('modal') && $.extend({}, $target.data(), $this.data())
      $target.carousel(options)
      e.preventDefault()
    })
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-typeahead.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function($){

  "use strict"; // jshint ;_;


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.typeahead.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.updater = this.options.updater || this.updater
    this.$menu = $(this.options.menu).appendTo('body')
    this.source = this.options.source
    this.shown = false
    this.listen()
  }

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element
        .val(this.updater(val))
        .change()
      return this.hide()
    }

  , updater: function (item) {
      return item
    }

  , show: function () {
      var pos = $.extend({}, this.$element.offset(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu.css({
        top: pos.top + pos.height
      , left: pos.left
      })

      this.$menu.show()
      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , lookup: function (event) {
      var that = this
        , items
        , q

      this.query = this.$element.val()

      if (!this.query) {
        return this.shown ? this.hide() : this
      }

      items = $.grep(this.source, function (item) {
        return that.matcher(item)
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }

      return this.render(items.slice(0, this.options.items)).show()
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase())
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
        else if (~item.indexOf(this.query)) caseSensitive.push(item)
        else caseInsensitive.push(item)
      }

      return beginswith.concat(caseSensitive, caseInsensitive)
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item)
        i.find('a').html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if ($.browser.webkit || $.browser.msie) {
        this.$element.on('keydown', $.proxy(this.keypress, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , keypress: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          if (e.type != 'keydown') break
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          if (e.type != 'keydown') break
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , blur: function (e) {
      var that = this
      setTimeout(function () { that.hide() }, 150)
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
    }

  , mouseenter: function (e) {
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  $.fn.typeahead = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeahead')
        , options = typeof option == 'object' && option
      if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  }

  $.fn.typeahead.Constructor = Typeahead


 /* TYPEAHEAD DATA-API
  * ================== */

  $(function () {
    $('body').on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
      var $this = $(this)
      if ($this.data('typeahead')) return
      e.preventDefault()
      $this.typeahead($this.data())
    })
  })

}(window.jQuery);

!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function") define(definition);
  else this.tz = definition();
} (function () {
/*
  function die () {
    console.log.apply(console, __slice.call(arguments, 0));
    return process.exit(1);
  }

  function say () { return console.log.apply(console, __slice.call(arguments, 0)) }
*/
  function actualize (entry, rule, year) {
    var actualized, date = rule.day[1];

    do {
      actualized = new Date(Date.UTC(year, rule.month, Math.abs(date++)));
    } while (rule.day[0] < 7 && actualized.getUTCDay() != rule.day[0])

    actualized = {
      clock: rule.clock,
      sort: actualized.getTime(),
      rule: rule,
      save: rule.save * 6e4,
      offset: entry.offset
    };

    actualized[actualized.clock] = actualized.sort + rule.time * 6e4;

    if (actualized.posix) {
      actualized.wallclock = actualized[actualized.clock] + (entry.offset + rule.saved);
    } else {
      actualized.posix = actualized[actualized.clock] - (entry.offset + rule.saved);
    }

    return actualized;
  }

  function find (request, clock, time) {
    var i, I, entry, found, zone = request[request.zone], actualized = [], abbrev, rules
      , j, year = new Date(time).getUTCFullYear(), off = 1;
    for (i = 1, I = zone.length; i < I; i++) if (zone[i][clock] <= time) break;
    entry = zone[i];
    if (entry.rules) {
      rules = request[entry.rules];
      for (j = year + 1; j >= year - off; --j)
        for (i = 0, I = rules.length; i < I; i++)
          if (rules[i].from <= j && j <= rules[i].to) actualized.push(actualize(entry, rules[i], j));
          else if (rules[i].to < j && off == 1) off = j - rules[i].to;
      actualized.sort(function (a, b) { return a.sort - b.sort });
      for (i = 0, I = actualized.length; i < I; i++) {
        if (time >= actualized[i][clock] && actualized[i][actualized[i].clock] > entry[actualized[i].clock]) found = actualized[i];
      }
    }
    if (found) {
      if (abbrev = /^(.*)\/(.*)$/.exec(entry.format)) {
        found.abbrev = abbrev[found.save ? 2 : 1];
      } else {
        found.abbrev = entry.format.replace(/%s/, found.rule.letter);
      }
    }
    return found || entry;
  }

  function convertToWallclock (request, posix) {
    if (request.zone == "UTC") return posix;
    request.entry = find(request, "posix", posix);
    return posix + request.entry.offset + request.entry.save;
  }

  function convertToPOSIX (request, wallclock) {
    if (request.zone == "UTC") return wallclock;

    var entry, diff;
    request.entry = entry = find(request, "wallclock", wallclock);
    diff = wallclock - entry.wallclock;

    return 0 < diff && diff < entry.save ? null : wallclock - entry.offset - entry.save;
  }

  function adjust (request, posix, match) {
    var increment = +(match[1] + 1) // conversion necessary for week day addition
      , offset = match[2] * increment
      , index = UNITS.indexOf(match[3].toLowerCase())
      , date
      ;
    if (index > 9) {
      posix += offset * TIME[index - 10];
    } else {
      date = new Date(convertToWallclock(request, posix));
      if (index < 7) {
        while (offset) {
          date.setUTCDate(date.getUTCDate() + increment);
          if (date.getUTCDay() == index) offset -= increment;
        }
      } else if (index == 7) {
        date.setUTCFullYear(date.getUTCFullYear() + offset);
      } else if (index == 8) {
        date.setUTCMonth(date.getUTCMonth() + offset);
      } else {
        date.setUTCDate(date.getUTCDate() + offset);
      }
      if ((posix = convertToPOSIX(request, date.getTime())) == null) {
        posix = convertToPOSIX(request, date.getTime() + 864e5 * increment) - 864e5 * increment;
      }
    }
    return posix;
  }

  function convert (vargs) {
    if (!vargs.length) return "0.0.23";

    var request = Object.create(this)
      , adjustments = []
      , i, I, $, argument, date
      ;

    for (i = 0; i < vargs.length; i++) { // leave the for loop alone, it works.
      argument = vargs[i];
      // https://twitter.com/bigeasy/status/215112186572439552
      if (Array.isArray(argument)) {
        if (!i && !isNaN(argument[1])) {
          date = argument;
        } else {
          argument.splice.apply(vargs, [ i--, 1 ].concat(argument));
        }
      } else if (isNaN(argument)) {
        $ = typeof argument;
        if ($ == "string") {
          if (~argument.indexOf("%")) {
            request.format = argument;
          } else if (!i && argument == "*") {
            date = argument;
          } else if (!i && ($ = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|(([+-])(\d{2}(:\d{2}){0,2})))?)?$/.exec(argument))) {
            date = [];
            date.push.apply(date, $.slice(1, 8));
            if ($[9]) {
              date.push($[10] + 1);
              date.push.apply(date, $[11].split(/:/));
            } else if ($[8]) {
              date.push(1);
            }
          } else if (/^\w{2,3}_\w{2}$/.test(argument)) {
            request.locale = argument;
          } else if ($ = UNIT_RE.exec(argument)) {
            adjustments.push($);
          } else {
            request.zone = argument;
          }
        } else if ($ == "function") {
          if ($ = argument.call(request)) return $;
        } else if (/^\w{2,3}_\w{2}$/.test(argument.name)) {
          request[argument.name] = argument;
        } else if (argument.zones) {
          for ($ in argument.zones) request[$] = argument.zones[$];
          for ($ in argument.rules) request[$] = argument.rules[$];
        }
      } else if (!i) {
        date = argument;
      }
    }

    if (!request[request.locale]) delete request.locale;
    if (!request[request.zone]) delete request.zone;

    if (date != null) {
      if (date == "*") {
        date = request.clock();
      } else if (Array.isArray(date)) {
        I = !date[7];
        for (i = 0; i < 11; i++) date[i] = +(date[i] || 0); // conversion necessary for decrement
        --date[1]; // Grr..
        date = Date.UTC.apply(Date.UTC, date.slice(0, 8)) +
          -date[7] * (date[8] * 36e5 + date[9] * 6e4 + date[10] * 1e3);
      } else {
        date = Math.floor(date);
      }
      if (!isNaN(date)) {
        if (I) date = convertToPOSIX(request, date);

        if (date == null) return date;

        for (i = 0, I = adjustments.length; i < I; i++) {
          date = adjust(request, date, adjustments[i]);
        }

        if (!request.format) return date;

        $ = new Date(convertToWallclock(request, date));
        return request.format.replace(/%([-0_^]?)(:{0,3})(\d*)(.)/g,
        function (value, flag, colons, padding, specifier) {
          var f, fill = "0", pad;
          if (f = request[specifier]) {
            value = String(f.call(request, $, date, flag, colons.length));
            if ((flag || f.style) == "_") fill = " ";
            pad = flag == "-" ? 0 : f.pad || 0;
            while (value.length < pad) value = fill + value;
            pad = flag == "-" ? 0 : padding || f.pad;
            while (value.length < pad) value = fill + value;
            if (specifier == "N" && pad < value.length) value = value.slice(0, pad);
            if (flag == "^") value = value.toUpperCase();
          }
          return value;
        });
      }
    }

    return function () { return request.convert(arguments) };
  }

  var context =
    { clock: function () { return +(new Date()) }
    , zone: "UTC"
    , entry: { abbrev: "UTC", offset: 0, save: 0 }
    , UTC: 1
    , z: function(date, posix, flag, delimiters) {
        var offset = this.entry.offset + this.entry.save
          , seconds = Math.abs(offset / 1000), parts = [], part = 3600, i, z;
        for (i = 0; i < 3; i++) {
          parts.push(("0" + Math.floor(seconds / part)).slice(-2));
          seconds %= part;
          part /= 60;
        }
        if (flag == "^" && !offset) return "Z";
        if (flag == "^") delimiters = 3;
        if (delimiters == 3) {
          z = parts.join(":");
          z = z.replace(/:00$/, "");
          if (flag != "^") z = z.replace(/:00$/, "");
        } else if (delimiters) {
          z = parts.slice(0, delimiters + 1).join(":");
          if (flag == "^") z = z.replace(/:00$/, "");
        } else {
          z = parts.slice(0, 2).join("");
        }
        z = (offset < 0 ? "-" : "+") + z;
        z = z.replace(/([-+])(0)/, { "_": " $1", "-": "$1" }[flag] || "$1$2");
        return z;
      }
    , "%": function(date) { return "%" }
    , n: function (date) { return "\n" }
    , t: function (date) { return "\t" }
    , U: function (date) { return weekOfYear(date, 0) }
    , W: function (date) { return weekOfYear(date, 1) }
    , V: function (date) { return isoWeek(date)[0] }
    , G: function (date) { return isoWeek(date)[1] }
    , g: function (date) { return isoWeek(date)[1] % 100 }
    , j: function (date) { return Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0)) / 864e5) + 1 }
    , s: function (date) { return Math.floor(date.getTime() / 1000) }
    , C: function (date) { return Math.floor(date.getUTCFullYear() / 100) }
    , N: function (date) { return date.getTime() % 1000 * 1000000 }
    , m: function (date) { return date.getUTCMonth() + 1 }
    , Y: function (date) { return date.getUTCFullYear() }
    , y: function (date) { return date.getUTCFullYear() % 100 }
    , H: function (date) { return date.getUTCHours() }
    , M: function (date) { return date.getUTCMinutes() }
    , S: function (date) { return date.getUTCSeconds() }
    , e: function (date) { return date.getUTCDate() }
    , d: function (date) { return date.getUTCDate() }
    , u: function (date) { return date.getUTCDay() || 7 }
    , w: function (date) { return date.getUTCDay() }
    , l: function (date) { return date.getUTCHours() % 12 || 12 }
    , I: function (date) { return date.getUTCHours() % 12 || 12 }
    , k: function (date) { return date.getUTCHours() }
    , Z: function (date) { return this.entry.abbrev }
    , a: function (date) { return this[this.locale].day.abbrev[date.getUTCDay()] }
    , A: function (date) { return this[this.locale].day.full[date.getUTCDay()] }
    , h: function (date) { return this[this.locale].month.abbrev[date.getUTCMonth()] }
    , b: function (date) { return this[this.locale].month.abbrev[date.getUTCMonth()] }
    , B: function (date) { return this[this.locale].month.full[date.getUTCMonth()] }
    , P: function (date) { return this[this.locale].meridiem[Math.floor(date.getUTCHours() / 12)].toLowerCase() }
    , p: function (date) { return this[this.locale].meridiem[Math.floor(date.getUTCHours() / 12)] }
    , R: function (date, posix) { return this.convert([ posix, "%H:%M" ]) }
    , T: function (date, posix) { return this.convert([ posix, "%H:%M:%S" ]) }
    , D: function (date, posix) { return this.convert([ posix, "%m/%d/%y" ]) }
    , F: function (date, posix) { return this.convert([ posix, "%Y-%m-%d" ]) }
    , x: function (date, posix) { return this.convert([ posix, this[this.locale].date ]) }
    , r: function (date, posix) { return this.convert([ posix, this[this.locale].time12 || '%I:%M:%S' ]) }
    , X: function (date, posix) { return this.convert([ posix, this[this.locale].time24 ]) }
    , c: function (date, posix) { return this.convert([ posix, this[this.locale].dateTime ]) }
    , convert: convert
    , locale: "en_US"
    , en_US: {
        date: "%m/%d/%Y",
        time24: "%I:%M:%S %p",
        time12: "%I:%M:%S %p",
        dateTime: "%a %d %b %Y %I:%M:%S %p %Z",
        meridiem: [ "AM", "PM" ],
        month: {
          abbrev: "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec".split("|"),
          full: "January|February|March|April|May|June|July|August|September|October|November|December".split("|")
        },
        day: {
          abbrev: "Sun|Mon|Tue|Wed|Thu|Fri|Sat".split("|"),
          full: "Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday".split("|")
        }
      }
    };
  var UNITS = "Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|year|month|day|hour|minute|second|millisecond"
    , UNIT_RE = new RegExp("^\\s*([+-])(\\d+)\\s+(" + UNITS + ")s?\\s*$", "i")
    , TIME = [ 36e5, 6e4, 1e3, 1 ]
    ;
  UNITS = UNITS.toLowerCase().split("|");

  "delmHMSUWVgCIky".replace(/./g, function (e) { context[e].pad = 2 });

  context.N.pad = 9;
  context.j.pad = 3;

  context.k.style = "_";
  context.l.style = "_";
  context.e.style = "_";

  function weekOfYear (date, startOfWeek) {
    var diff, nyd, weekStart;
    nyd = new Date(Date.UTC(date.getUTCFullYear(), 0));
    diff = Math.floor((date.getTime() - nyd.getTime()) / 864e5);
    if (nyd.getUTCDay() == startOfWeek) {
      weekStart = 0;
    } else {
      weekStart = 7 - nyd.getUTCDay() + startOfWeek;
      if (weekStart == 8) {
        weekStart = 1;
      }
    }
    return diff >= weekStart ? Math.floor((diff - weekStart) / 7) + 1 : 0;
  }

  function isoWeek (date) {
    var nyd, nyy, week;
    nyy = date.getUTCFullYear();
    nyd = new Date(Date.UTC(nyy, 0)).getUTCDay();
    week = weekOfYear(date, 1) + (nyd > 1 && nyd <= 4 ? 1 : 0);
    if (!week) {
      nyy = date.getUTCFullYear() - 1;
      nyd = new Date(Date.UTC(nyy, 0)).getUTCDay();
      week = nyd == 4 || (nyd == 3 && new Date(nyy, 1, 29).getDate() == 29) ? 53 : 52;
      return [week, date.getUTCFullYear() - 1];
    } else if (week == 53 && !(nyd == 4 || (nyd == 3 && new Date(nyy, 1, 29).getDate() == 29))) {
      return [1, date.getUTCFullYear() + 1];
    } else {
      return [week, date.getUTCFullYear()];
    }
  }

  return function () { return context.convert(arguments) };
});

/*! sprintf.js | Copyright (c) 2007-2013 Alexandru Marasteanu <hello at alexei dot ro> | 3 clause BSD license */(function(e){function r(e){return Object.prototype.toString.call(e).slice(8,-1).toLowerCase()}function i(e,t){for(var n=[];t>0;n[--t]=e);return n.join("")}var t=function(){return t.cache.hasOwnProperty(arguments[0])||(t.cache[arguments[0]]=t.parse(arguments[0])),t.format.call(null,t.cache[arguments[0]],arguments)};t.format=function(e,n){var s=1,o=e.length,u="",a,f=[],l,c,h,p,d,v;for(l=0;l<o;l++){u=r(e[l]);if(u==="string")f.push(e[l]);else if(u==="array"){h=e[l];if(h[2]){a=n[s];for(c=0;c<h[2].length;c++){if(!a.hasOwnProperty(h[2][c]))throw t('[sprintf] property "%s" does not exist',h[2][c]);a=a[h[2][c]]}}else h[1]?a=n[h[1]]:a=n[s++];if(/[^s]/.test(h[8])&&r(a)!="number")throw t("[sprintf] expecting number but found %s",r(a));switch(h[8]){case"b":a=a.toString(2);break;case"c":a=String.fromCharCode(a);break;case"d":a=parseInt(a,10);break;case"e":a=h[7]?a.toExponential(h[7]):a.toExponential();break;case"f":a=h[7]?parseFloat(a).toFixed(h[7]):parseFloat(a);break;case"o":a=a.toString(8);break;case"s":a=(a=String(a))&&h[7]?a.substring(0,h[7]):a;break;case"u":a>>>=0;break;case"x":a=a.toString(16);break;case"X":a=a.toString(16).toUpperCase()}a=/[def]/.test(h[8])&&h[3]&&a>=0?"+"+a:a,d=h[4]?h[4]=="0"?"0":h[4].charAt(1):" ",v=h[6]-String(a).length,p=h[6]?i(d,v):"",f.push(h[5]?a+p:p+a)}}return f.join("")},t.cache={},t.parse=function(e){var t=e,n=[],r=[],i=0;while(t){if((n=/^[^\x25]+/.exec(t))!==null)r.push(n[0]);else if((n=/^\x25{2}/.exec(t))!==null)r.push("%");else{if((n=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(t))===null)throw"[sprintf] huh?";if(n[2]){i|=1;var s=[],o=n[2],u=[];if((u=/^([a-z_][a-z_\d]*)/i.exec(o))===null)throw"[sprintf] huh?";s.push(u[1]);while((o=o.substring(u[0].length))!=="")if((u=/^\.([a-z_][a-z_\d]*)/i.exec(o))!==null)s.push(u[1]);else{if((u=/^\[(\d+)\]/.exec(o))===null)throw"[sprintf] huh?";s.push(u[1])}n[2]=s}else i|=2;if(i===3)throw"[sprintf] mixing positional and named placeholders is not (yet) supported";r.push(n)}t=t.substring(n[0].length)}return r};var n=function(e,n,r){return r=n.slice(0),r.splice(0,0,e),t.apply(null,r)};e.sprintf=t,e.vsprintf=n})(typeof exports!="undefined"?exports:window);
/*
 * memoize.js
 * by @philogb and @addyosmani
 * with further optimizations by @mathias
 * and @DmitryBaranovsk
 * perf tests: http://bit.ly/q3zpG3
 * Released under an MIT license.
 */
function memoize( fn ) {
    return function () {
        var args = Array.prototype.slice.call(arguments),
        hash = "",
        i = args.length;
        currentArg = null;
        while (i--) {
            currentArg = args[i];
            hash += (currentArg === Object(currentArg)) ?
                JSON.stringify(currentArg) : currentArg;
            fn.memoize || (fn.memoize = {});
        }
        return (hash in fn.memoize) ? fn.memoize[hash] :
            fn.memoize[hash] = fn.apply(this, args);
    };
}

/*
function memoize(f){
    var cache = {};
    cache['hits'] = 0
    cache['misses'] = 0
    return function(){

        var key = JSON.stringify(Array.prototype.slice.call(arguments));

        if(key in cache){
            cache['hits'] += 1
            console.log('From cache...', cache['hits'], cache['misses']);
            return cache[key]
        }else{
            cache['misses'] +=1
            console.log('Computing..', cache['hits'], cache['misses']);
            return cache[key] = f.apply(this,arguments);
        }

    }

}
*/

//customizations to libraries
(function () {
  "use strict";
_.uniqueId = function (prefix) {
    //from ipython project
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789ABCDEF";
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

    var uuid = s.join("");
    if (prefix){
        return prefix + "-" + uuid;
    }else{
        return uuid;
    }
};

_.isNullOrUndefined = function(x){
    return _.isNull(x) || _.isUndefined(x);
};

_.setdefault = function(obj, key, value){
    if (_.has(obj, key)){
        return obj[key]}
    else{
        obj[key] = value
        return value
    }
};
}).call(this);


(function(/*! Stitch !*/) {
  if (!this.rrequire) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), indexPath = expand(path, './index'), module, fn;
      module   = cache[path] || cache[indexPath]
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = indexPath]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.rrequire = function(name) {
      return require(name, '');
    }
    this.rrequire.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
    this.rrequire.modules = modules;
    this.rrequire.cache   = cache;
  }
  return this.rrequire.define;
}).call(this)({
  "embed_core": function(exports, require, module) {(function() {
  var addDirectPlot, addDirectPlotWrap, addPlot, addPlotWrap, base, find_injections, foundEls, injectCss, parse_el, search_and_plot, serverLoad, unsatisfied_els, utility,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  base = require("./base");

  utility = require("./serverutils").utility;

  addPlotWrap = function(settings, dd) {
    return addPlot(settings.bokeh_modelid, settings.bokeh_modeltype, settings.element, dd);
  };

  addPlot = function(modelid, modeltype, element, data) {
    var data_plot_id, model, view;
    data_plot_id = _.keys(data)[0];
    if (!data_plot_id === modelid) {
      return;
    }
    console.log("addPlot");
    console.log(modelid, modeltype, element);
    base.load_models(data[data_plot_id]);
    model = base.Collections(modeltype).get(modelid);
    view = new model.default_view({
      model: model
    });
    view.render();
    return _.delay(function() {
      return $(element).append(view.$el);
    });
  };

  addDirectPlotWrap = function(settings) {
    console.log("addDirectPlotWrap");
    return addDirectPlot(settings.bokeh_docid, settings.bokeh_ws_conn_string, settings.bokeh_docapikey, settings.bokeh_root_url, settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);
  };

  serverLoad = function(docid, ws_conn_string, docapikey, root_url) {
    var BokehConfig, headers;
    console.log("serverLoad");
    headers = {
      'BOKEH-API-KEY': docapikey
    };
    $.ajaxSetup({
      'headers': headers
    });
    BokehConfig = base.Config;
    BokehConfig.prefix = root_url;
    BokehConfig.ws_conn_string = ws_conn_string;
    return utility.load_doc_once(docid);
  };

  addDirectPlot = function(docid, ws_conn_string, docapikey, root_url, modelid, modeltype, element) {
    return serverLoad(docid, ws_conn_string, docapikey, root_url).done(function() {
      var model, plot_collection, view;
      console.log("addPlot");
      console.log(modelid, modeltype, element);
      plot_collection = base.Collections(modeltype);
      model = plot_collection.get(modelid);
      view = new model.default_view({
        model: model
      });
      return _.delay(function() {
        return $(element).append(view.$el);
      });
    });
  };

  injectCss = function(host) {
    var css_urls, load_css, static_base;
    static_base = "" + host + "vendor/bokehjs/";
    css_urls = ["" + static_base + "css/bokeh.css", "" + static_base + "css/continuum.css", "" + static_base + "vendor/bootstrap/css/bootstrap.css", "" + static_base + "vendor/jquery/css/themes/base/jquery-ui.min.css"];
    load_css = function(url) {
      var link;
      link = document.createElement('link');
      link.href = url;
      link.rel = "stylesheet";
      link.type = "text/css";
      return document.body.appendChild(link);
    };
    return _.map(css_urls, load_css);
  };

  foundEls = [];

  parse_el = function(el) {
    "this takes a bokeh embed script element and returns the relvant\nattributes through to a dictionary, ";
    var attr, attrs, bokehCount, bokehRe, info, _i, _len;
    attrs = el.attributes;
    bokehRe = /bokeh.*/;
    info = {};
    bokehCount = 0;
    for (_i = 0, _len = attrs.length; _i < _len; _i++) {
      attr = attrs[_i];
      if (attr.name.match(bokehRe)) {
        info[attr.name] = attr.value;
        bokehCount++;
      }
    }
    if (bokehCount > 0) {
      return info;
    } else {
      return false;
    }
  };

  unsatisfied_els = {};

  find_injections = function() {
    var container, d, el, els, info, is_new_el, matches, new_settings, re, _i, _len;
    els = document.getElementsByTagName('script');
    re = /.*embed.js.*/;
    new_settings = [];
    for (_i = 0, _len = els.length; _i < _len; _i++) {
      el = els[_i];
      is_new_el = __indexOf.call(foundEls, el) < 0;
      matches = el.src.match(re);
      if (is_new_el && matches) {
        foundEls.push(el);
        info = parse_el(el);
        d = document.createElement('div');
        container = document.createElement('div');
        el.parentNode.insertBefore(container, el);
        info['element'] = container;
        new_settings.push(info);
      }
    }
    return new_settings;
  };

  search_and_plot = function(dd) {
    var new_plot_dicts, plot_from_dict;
    plot_from_dict = function(info_dict, key) {
      var dd_id;
      if (info_dict.bokeh_plottype === 'embeddata') {
        dd_id = _.keys(dd)[0];
        if (key === dd_id) {
          addPlotWrap(info_dict, dd);
          return delete unsatisfied_els[key];
        }
      } else {
        addDirectPlotWrap(info_dict);
        return delete unsatisfied_els[key];
      }
    };
    new_plot_dicts = find_injections();
    _.each(new_plot_dicts, function(plotdict) {
      return unsatisfied_els[plotdict['bokeh_modelid']] = plotdict;
    });
    return _.map(unsatisfied_els, plot_from_dict);
  };

  exports.search_and_plot = search_and_plot;

  exports.injectCss = injectCss;

  console.log('embed_core');

}).call(this);
}, "serverrun": function(exports, require, module) {(function() {
  var Config, Promises, base, usercontext, utility, utils;

  utils = require("./serverutils");

  base = require("./base");

  Config = base.Config;

  utility = utils.utility;

  Promises = utils.Promises;

  Config.ws_conn_string = "ws://" + window.location.host + "/bokeh/sub";

  usercontext = require("usercontext/usercontext");

  $(function() {
    var load, userdocs, wswrapper;
    wswrapper = utility.make_websocket();
    userdocs = new usercontext.UserDocs();
    userdocs.subscribe(wswrapper, 'defaultuser');
    window.userdocs = userdocs;
    load = userdocs.fetch();
    return load.done(function() {
      var userdocsview;
      userdocsview = new usercontext.UserDocsView({
        collection: userdocs
      });
      return $('#PlotPane').append(userdocsview.el);
    });
  });

}).call(this);
}, "serverutils": function(exports, require, module) {(function() {
  var Collections, Config, Deferreds, HasProperties, Promises, WebSocketWrapper, base, load_models, submodels, utility;

  Deferreds = {};

  Promises = {};

  Deferreds._doc_loaded = $.Deferred();

  Deferreds._doc_requested = $.Deferred();

  Promises.doc_loaded = Deferreds._doc_loaded.promise();

  Promises.doc_requested = Deferreds._doc_requested.promise();

  Promises.doc_promises = {};

  base = require("./base");

  Collections = base.Collections;

  HasProperties = base.HasProperties;

  load_models = base.load_models;

  submodels = base.submodels;

  WebSocketWrapper = base.WebSocketWrapper;

  Config = base.Config;

  exports.wswrapper = null;

  exports.plotcontext = null;

  exports.plotcontextview = null;

  exports.Promises = Promises;

  HasProperties.prototype.sync = Backbone.sync;

  utility = {
    load_user: function() {
      var response;
      response = $.get('/bokeh/userinfo/', {});
      return response;
    },
    load_doc_once: function(docid) {
      var doc_prom;
      if (_.has(Promises.doc_promises, docid)) {
        console.log("already found " + docid + " in promises");
        return Promises.doc_promises[docid];
      } else {
        console.log("" + docid + " not in promises, loading it");
        doc_prom = utility.load_doc(docid);
        Promises.doc_promises[docid] = doc_prom;
        return doc_prom;
      }
    },
    load_doc_by_title: function(title) {
      var response;
      response = $.get(Config.prefix + "/bokeh/doc", {
        title: title
      }).done(function(data) {
        var all_models, apikey, docid;
        all_models = data['all_models'];
        load_models(all_models);
        apikey = data['apikey'];
        docid = data['docid'];
        return submodels(exports.wswrapper, "bokehplot:" + docid, apikey);
      });
      return response;
    },
    load_doc_static: function(docid, data) {
      " loads data without making a websocket connection ";
      var promise;
      load_data(data['all_models']);
      promise = jQuery.Deferred();
      promise.resolve();
      return promise;
    },
    load_doc: function(docid) {
      var response, wswrapper;
      wswrapper = utility.make_websocket();
      response = $.get(Config.prefix + ("/bokeh/bokehinfo/" + docid + "/"), {}).done(function(data) {
        var all_models, apikey;
        all_models = data['all_models'];
        load_models(all_models);
        apikey = data['apikey'];
        return submodels(exports.wswrapper, "bokehplot:" + docid, apikey);
      });
      return response;
    },
    make_websocket: function() {
      var wswrapper;
      wswrapper = new WebSocketWrapper(Config.ws_conn_string);
      exports.wswrapper = wswrapper;
      return wswrapper;
    },
    render_plots: function(plot_context_ref, viewclass, viewoptions) {
      var options, plotcontext, plotcontextview;
      if (viewclass == null) {
        viewclass = null;
      }
      if (viewoptions == null) {
        viewoptions = {};
      }
      plotcontext = Collections(plot_context_ref.type).get(plot_context_ref.id);
      if (!viewclass) {
        viewclass = plotcontext.default_view;
      }
      options = _.extend(viewoptions, {
        model: plotcontext
      });
      plotcontextview = new viewclass(options);
      plotcontext = plotcontext;
      plotcontextview = plotcontextview;
      plotcontextview.render();
      exports.plotcontext = plotcontext;
      return exports.plotcontextview = plotcontextview;
    },
    bokeh_connection: function(host, docid, protocol) {
      if (_.isUndefined(protocol)) {
        protocol = "https";
      }
      if (Promises.doc_requested.state() === "pending") {
        Deferreds._doc_requested.resolve();
        return $.get("" + protocol + "://" + host + "/bokeh/publicbokehinfo/" + docid, {}, function(data) {
          console.log('instatiate_doc_single, docid', docid);
          data = JSON.parse(data);
          load_models(data['all_models']);
          return Deferreds._doc_loaded.resolve(data);
        });
      }
    },
    instantiate_doc_single_plot: function(docid, view_model_id, target_el, host) {
      var container;
      if (target_el == null) {
        target_el = "#PlotPane";
      }
      if (host == null) {
        host = "www.wakari.io";
      }
      container = require("./container");
      utility.bokeh_connection(host, docid, "https");
      return Deferreds._doc_loaded.done(function(data) {
        utility.render_plots(data.plot_context_ref, container.PlotContextView, {
          target_model_id: view_model_id
        });
        return $(target_el).empty().append(exports.plotcontextview.el);
      });
    }
  };

  exports.utility = utility;

}).call(this);
}, "usercontext/documentationtemplate": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<p>\n  <b>\n    You have no Plots.  Follow the intsructions\n    below to create some\n  </b>\n</p>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "usercontext/usercontext": function(exports, require, module) {(function() {
  var ContinuumView, Doc, DocView, HasParent, HasProperties, UserDocs, UserDocsView, base, build_views, documentationtemplate, load_models, userdocstemplate, utility, _ref, _ref1, _ref2, _ref3,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  ContinuumView = require("../common/continuum_view").ContinuumView;

  HasParent = base.HasParent;

  HasProperties = base.HasProperties;

  load_models = base.load_models;

  userdocstemplate = require("./userdocstemplate");

  documentationtemplate = require("./documentationtemplate");

  utility = require("../serverutils").utility;

  build_views = base.build_views;

  DocView = (function(_super) {
    __extends(DocView, _super);

    function DocView() {
      _ref = DocView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    DocView.prototype.template = require("./wrappertemplate");

    DocView.prototype.attributes = {
      "class": 'accordion-group'
    };

    DocView.prototype.events = {
      "click .bokehdoclabel": "loaddoc",
      "click .bokehdelete": "deldoc"
    };

    DocView.prototype.deldoc = function(e) {
      console.log('foo');
      e.preventDefault();
      this.model.destroy();
      return false;
    };

    DocView.prototype.loaddoc = function() {
      return this.model.load();
    };

    DocView.prototype.initialize = function(options) {
      DocView.__super__.initialize.call(this, options);
      return this.render_init();
    };

    DocView.prototype.delegateEvents = function(events) {
      DocView.__super__.delegateEvents.call(this, events);
      return this.listenTo(this.model, 'loaded', this.render);
    };

    DocView.prototype.render_init = function() {
      var html;
      html = this.template({
        model: this.model,
        bodyid: _.uniqueId()
      });
      return this.$el.html(html);
    };

    DocView.prototype.render = function() {
      var plot_context;
      plot_context = this.model.get_obj('plot_context');
      this.plot_context_view = new plot_context.default_view({
        model: plot_context
      });
      this.$el.find('.plots').append(this.plot_context_view.el);
      return true;
    };

    return DocView;

  })(ContinuumView);

  UserDocsView = (function(_super) {
    __extends(UserDocsView, _super);

    function UserDocsView() {
      _ref1 = UserDocsView.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    UserDocsView.prototype.initialize = function(options) {
      this.docs = options.docs;
      this.collection = options.collection;
      this.views = {};
      UserDocsView.__super__.initialize.call(this, options);
      return this.render();
    };

    UserDocsView.prototype.attributes = {
      "class": 'usercontext'
    };

    UserDocsView.prototype.events = {
      'click .bokehrefresh': function() {
        return this.collection.fetch({
          update: true
        });
      }
    };

    UserDocsView.prototype.delegateEvents = function(events) {
      var _this = this;
      UserDocsView.__super__.delegateEvents.call(this, events);
      this.listenTo(this.collection, 'add', this.render);
      this.listenTo(this.collection, 'remove', this.render);
      this.listenTo(this.collection, 'add', function(model, collection, options) {
        return _this.listenTo(model, 'loaded', function() {
          return _this.listenTo(model.get_obj('plot_context'), 'change', function() {
            return _this.trigger('show');
          });
        });
      });
      return this.listenTo(this.collection, 'remove', function(model, collection, options) {
        return _this.stopListening(model);
      });
    };

    UserDocsView.prototype.render_docs = function() {
      this.$el.html(documentationtemplate());
      return this.$el.append(this.docs);
    };

    UserDocsView.prototype.render = function() {
      var html, model, models, _i, _len;
      if (this.collection.models.length === 0 && this.docs) {
        return this.render_docs();
      }
      html = userdocstemplate();
      _.map(_.values(this.views), function(view) {
        return view.$el.detach();
      });
      models = this.collection.models.slice().reverse();
      build_views(this.views, models, {});
      this.$el.html(html);
      for (_i = 0, _len = models.length; _i < _len; _i++) {
        model = models[_i];
        this.$el.find(".accordion").append(this.views[model.id].el);
      }
      return this;
    };

    return UserDocsView;

  })(ContinuumView);

  Doc = (function(_super) {
    __extends(Doc, _super);

    function Doc() {
      _ref2 = Doc.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    Doc.prototype.default_view = DocView;

    Doc.prototype.idAttribute = 'docid';

    Doc.prototype.defaults = {
      docid: null,
      title: null,
      plot_context: null,
      apikey: null
    };

    Doc.prototype.sync = function() {};

    Doc.prototype.destroy = function(options) {
      Doc.__super__.destroy.call(this, options);
      return $.ajax({
        url: "/bokeh/doc/" + (this.get('docid')) + "/",
        type: 'delete'
      });
    };

    Doc.prototype.load = function(use_title) {
      var docid, resp, title,
        _this = this;
      if (this.loaded) {
        return;
      }
      if (use_title) {
        title = this.get('title');
        resp = utility.load_doc_by_title(title);
      } else {
        docid = this.get('docid');
        resp = utility.load_doc(docid);
      }
      return resp.done(function(data) {
        _this.set('docid', data.docid);
        _this.set('apikey', data['apikey']);
        _this.set('plot_context', data['plot_context_ref']);
        _this.trigger('loaded');
        return _this.loaded = true;
      });
    };

    return Doc;

  })(HasParent);

  UserDocs = (function(_super) {
    __extends(UserDocs, _super);

    function UserDocs() {
      _ref3 = UserDocs.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    UserDocs.prototype.model = Doc;

    UserDocs.prototype.subscribe = function(wswrapper, username) {
      wswrapper.subscribe("bokehuser:" + username, null);
      return this.listenTo(wswrapper, "msg:bokehuser:" + username, function(msg) {
        msg = JSON.parse(msg);
        if (msg['msgtype'] === 'docchange') {
          return this.fetch({
            update: true
          });
        }
      });
    };

    UserDocs.prototype.fetch = function(options) {
      var resp, response,
        _this = this;
      if (_.isUndefined(options)) {
        options = {};
      }
      resp = response = $.get('/bokeh/userinfo/', {});
      resp.done(function(data) {
        var docs;
        docs = data['docs'];
        if (options.update) {
          return _this.update(docs, options);
        } else {
          return _this.reset(docs, options);
        }
      });
      return resp;
    };

    return UserDocs;

  })(Backbone.Collection);

  exports.UserDocs = UserDocs;

  exports.UserDocsView = UserDocsView;

  exports.Doc = Doc;

  exports.DocView = DocView;

}).call(this);
}, "usercontext/userdocstemplate": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="accordion">\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "usercontext/wrappertemplate": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="accordion-heading bokehdocheading">\n  <a class="accordion-toggle bokehdoclabel" data-toggle="collapse" \n     href="#');
    
      __out.push(__sanitize(this.bodyid));
    
      __out.push('">\n    Document: ');
    
      __out.push(__sanitize(this.model.get('title')));
    
      __out.push('\n    <i class="bokehdelete icon-trash"></i>\n  </a>\n</div>\n<div id="');
    
      __out.push(__sanitize(this.bodyid));
    
      __out.push('" class="accordion-body collapse">\n  <div class="accordion-inner plots">\n  </div>\n</div>\n\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "base": function(exports, require, module) {(function() {
  var Collections, Config, HasParent, HasProperties, WebSocketWrapper, build_views, load_models, locations, mod_cache, safebind, submodels, _ref, _ref1,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Config = {
    prefix: ''
  };

  safebind = function(binder, target, event, callback) {
    var error,
      _this = this;
    if (!_.has(binder, 'eventers')) {
      binder['eventers'] = {};
    }
    try {
      binder['eventers'][target.id] = target;
    } catch (_error) {
      error = _error;
    }
    if (target != null) {
      target.on(event, callback, binder);
      target.on('destroy remove', function() {
        return delete binder['eventers'][target];
      }, binder);
    } else {
      debugger;
      console.log("error with binder", binder, event);
    }
    return null;
  };

  load_models = function(modelspecs) {
    var attrs, coll, coll_attrs, model, newspecs, oldspecs, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m;
    newspecs = [];
    oldspecs = [];
    for (_i = 0, _len = modelspecs.length; _i < _len; _i++) {
      model = modelspecs[_i];
      coll = Collections(model['type']);
      attrs = model['attributes'];
      if (coll && coll.get(attrs['id'])) {
        oldspecs.push([coll, attrs]);
      } else {
        newspecs.push([coll, attrs]);
      }
    }
    for (_j = 0, _len1 = newspecs.length; _j < _len1; _j++) {
      coll_attrs = newspecs[_j];
      coll = coll_attrs[0], attrs = coll_attrs[1];
      if (coll) {
        coll.add(attrs, {
          'silent': true
        });
      }
    }
    for (_k = 0, _len2 = newspecs.length; _k < _len2; _k++) {
      coll_attrs = newspecs[_k];
      coll = coll_attrs[0], attrs = coll_attrs[1];
      if (coll) {
        coll.get(attrs['id']).dinitialize(attrs);
      }
    }
    for (_l = 0, _len3 = newspecs.length; _l < _len3; _l++) {
      coll_attrs = newspecs[_l];
      coll = coll_attrs[0], attrs = coll_attrs[1];
      if (coll) {
        model = coll.get(attrs.id);
        model.trigger('add', model, coll, {});
      }
    }
    for (_m = 0, _len4 = oldspecs.length; _m < _len4; _m++) {
      coll_attrs = oldspecs[_m];
      coll = coll_attrs[0], attrs = coll_attrs[1];
      if (coll) {
        coll.get(attrs['id']).set(attrs);
      }
    }
    return null;
  };

  WebSocketWrapper = (function() {
    _.extend(WebSocketWrapper.prototype, Backbone.Events);

    function WebSocketWrapper(ws_conn_string) {
      this.onmessage = __bind(this.onmessage, this);
      var _this = this;
      this.auth = {};
      this.ws_conn_string = ws_conn_string;
      this._connected = $.Deferred();
      this.connected = this._connected.promise();
      if (window.MozWebSocket) {
        this.s = new MozWebSocket(ws_conn_string);
      } else {
        this.s = new WebSocket(ws_conn_string);
      }
      this.s.onopen = function() {
        return _this._connected.resolve();
      };
      this.s.onmessage = this.onmessage;
    }

    WebSocketWrapper.prototype.onmessage = function(msg) {
      var data, index, topic;
      data = msg.data;
      index = data.indexOf(":");
      index = data.indexOf(":", index + 1);
      topic = data.substring(0, index);
      data = data.substring(index + 1);
      this.trigger("msg:" + topic, data);
      return null;
    };

    WebSocketWrapper.prototype.send = function(msg) {
      var _this = this;
      return $.when(this.connected).done(function() {
        return _this.s.send(msg);
      });
    };

    WebSocketWrapper.prototype.subscribe = function(topic, auth) {
      var msg;
      this.auth[topic] = auth;
      msg = JSON.stringify({
        msgtype: 'subscribe',
        topic: topic,
        auth: auth
      });
      return this.send(msg);
    };

    return WebSocketWrapper;

  })();

  submodels = function(wswrapper, topic, apikey) {
    wswrapper.subscribe(topic, apikey);
    return wswrapper.on("msg:" + topic, function(msg) {
      var clientid, model, msgobj, ref, _i, _len, _ref;
      msgobj = JSON.parse(msg);
      if (msgobj['msgtype'] === 'modelpush') {
        load_models(msgobj['modelspecs']);
      } else if (msgobj['msgtype'] === 'modeldel') {
        _ref = msgobj['modelspecs'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ref = _ref[_i];
          model = resolve_ref(ref['type'], ref['id']);
          if (model) {
            model.destroy({
              'local': true
            });
          }
        }
      } else if (msgobj['msgtype'] === 'status' && msgobj['status'][0] === 'subscribesuccess') {
        clientid = msgobj['status'][2];
        Config.clientid = clientid;
        $.ajaxSetup({
          'headers': {
            'Continuum-Clientid': clientid
          }
        });
      } else {
        console.log(msgobj);
      }
      return null;
    });
  };

  HasProperties = (function(_super) {
    __extends(HasProperties, _super);

    function HasProperties() {
      this.rpc = __bind(this.rpc, this);
      this.get_obj = __bind(this.get_obj, this);
      this.resolve_ref = __bind(this.resolve_ref, this);
      this.convert_to_ref = __bind(this.convert_to_ref, this);
      _ref = HasProperties.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    HasProperties.prototype.destroy = function(options) {
      var target, val, _ref1, _results;
      HasProperties.__super__.destroy.call(this, options);
      if (_.has(this, 'eventers')) {
        _ref1 = this.eventers;
        _results = [];
        for (target in _ref1) {
          if (!__hasProp.call(_ref1, target)) continue;
          val = _ref1[target];
          _results.push(val.off(null, null, this));
        }
        return _results;
      }
    };

    HasProperties.prototype.isNew = function() {
      return false;
    };

    HasProperties.prototype.initialize = function(attrs, options) {
      var _this = this;
      if (!attrs) {
        attrs = {};
      }
      if (!options) {
        options = {};
      }
      HasProperties.__super__.initialize.call(this, attrs, options);
      this.properties = {};
      this.property_cache = {};
      if (!_.has(attrs, this.idAttribute)) {
        this.id = _.uniqueId(this.type);
        this.attributes[this.idAttribute] = this.id;
      }
      return _.defer(function() {
        if (!_this.inited) {
          return _this.dinitialize(attrs, options);
        }
      });
    };

    HasProperties.prototype.dinitialize = function(attrs, options) {
      return this.inited = true;
    };

    HasProperties.prototype.set_obj = function(key, value, options) {
      var attrs, val;
      if (_.isObject(key) || key === null) {
        attrs = key;
        options = value;
      } else {
        attrs = {};
        attrs[key] = value;
      }
      for (key in attrs) {
        if (!__hasProp.call(attrs, key)) continue;
        val = attrs[key];
        attrs[key] = this.convert_to_ref(val);
      }
      return this.set(attrs, options);
    };

    HasProperties.prototype.set = function(key, value, options) {
      var attrs, toremove, val, _i, _len;
      if (_.isObject(key) || key === null) {
        attrs = key;
        options = value;
      } else {
        attrs = {};
        attrs[key] = value;
      }
      toremove = [];
      for (key in attrs) {
        if (!__hasProp.call(attrs, key)) continue;
        val = attrs[key];
        if (_.has(this, 'properties') && _.has(this.properties, key) && this.properties[key]['setter']) {
          this.properties[key]['setter'].call(this, val);
          toremove.push(key);
        }
      }
      for (_i = 0, _len = toremove.length; _i < _len; _i++) {
        key = toremove[_i];
        delete attrs[key];
      }
      if (!_.isEmpty(attrs)) {
        return HasProperties.__super__.set.call(this, attrs, options);
      }
    };

    HasProperties.prototype.convert_to_ref = function(value) {
      if (_.isArray(value)) {
        return _.map(value, this.convert_to_ref);
      } else {
        if (value instanceof HasProperties) {
          return value.ref();
        }
      }
    };

    HasProperties.prototype.add_dependencies = function(prop_name, object, fields) {
      var fld, prop_spec, _i, _len, _results;
      if (!_.isArray(fields)) {
        fields = [fields];
      }
      prop_spec = this.properties[prop_name];
      prop_spec.dependencies = prop_spec.dependencies.concat({
        obj: object,
        fields: fields
      });
      _results = [];
      for (_i = 0, _len = fields.length; _i < _len; _i++) {
        fld = fields[_i];
        _results.push(safebind(this, object, "change:" + fld, prop_spec['callbacks']['changedep']));
      }
      return _results;
    };

    HasProperties.prototype.register_setter = function(prop_name, setter) {
      var prop_spec;
      prop_spec = this.properties[prop_name];
      return prop_spec.setter = setter;
    };

    HasProperties.prototype.register_property = function(prop_name, getter, use_cache) {
      var changedep, prop_spec, propchange,
        _this = this;
      if (_.isUndefined(use_cache)) {
        use_cache = true;
      }
      if (_.has(this.properties, prop_name)) {
        this.remove_property(prop_name);
      }
      changedep = function() {
        return _this.trigger('changedep:' + prop_name);
      };
      propchange = function() {
        var firechange, new_val, old_val;
        firechange = true;
        if (prop_spec['use_cache']) {
          old_val = _this.get_cache(prop_name);
          _this.clear_cache(prop_name);
          new_val = _this.get(prop_name);
          firechange = new_val !== old_val;
        }
        if (firechange) {
          _this.trigger('change:' + prop_name, _this, _this.get(prop_name));
          return _this.trigger('change', _this);
        }
      };
      prop_spec = {
        'getter': getter,
        'dependencies': [],
        'use_cache': use_cache,
        'setter': null,
        'callbacks': {
          changedep: changedep,
          propchange: propchange
        }
      };
      this.properties[prop_name] = prop_spec;
      safebind(this, this, "changedep:" + prop_name, prop_spec['callbacks']['propchange']);
      return prop_spec;
    };

    HasProperties.prototype.remove_property = function(prop_name) {
      var dep, dependencies, fld, obj, prop_spec, _i, _j, _len, _len1, _ref1;
      prop_spec = this.properties[prop_name];
      dependencies = prop_spec.dependencies;
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        obj = dep.obj;
        _ref1 = dep['fields'];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          fld = _ref1[_j];
          obj.off('change:' + fld, prop_spec['callbacks']['changedep'], this);
        }
      }
      this.off("changedep:" + dep);
      delete this.properties[prop_name];
      if (prop_spec.use_cache) {
        return this.clear_cache(prop_name);
      }
    };

    HasProperties.prototype.has_cache = function(prop_name) {
      return _.has(this.property_cache, prop_name);
    };

    HasProperties.prototype.add_cache = function(prop_name, val) {
      return this.property_cache[prop_name] = val;
    };

    HasProperties.prototype.clear_cache = function(prop_name, val) {
      return delete this.property_cache[prop_name];
    };

    HasProperties.prototype.get_cache = function(prop_name) {
      return this.property_cache[prop_name];
    };

    HasProperties.prototype.get = function(prop_name) {
      var computed, getter, prop_spec;
      if (_.has(this.properties, prop_name)) {
        prop_spec = this.properties[prop_name];
        if (prop_spec.use_cache && this.has_cache(prop_name)) {
          return this.property_cache[prop_name];
        } else {
          getter = prop_spec.getter;
          computed = getter.apply(this, this);
          if (this.properties[prop_name].use_cache) {
            this.add_cache(prop_name, computed);
          }
          return computed;
        }
      } else {
        return HasProperties.__super__.get.call(this, prop_name);
      }
    };

    HasProperties.prototype.ref = function() {
      return {
        'type': this.type,
        'id': this.id
      };
    };

    HasProperties.prototype.resolve_ref = function(ref) {
      if (_.isArray(ref)) {
        return _.map(ref, this.resolve_ref);
      }
      if (!ref) {
        console.log('ERROR, null reference');
      }
      if (ref['type'] === this.type && ref['id'] === this.id) {
        return this;
      } else {
        return Collections(ref['type']).get(ref['id']);
      }
    };

    HasProperties.prototype.get_obj = function(ref_name) {
      var ref;
      ref = this.get(ref_name);
      if (ref) {
        return this.resolve_ref(ref);
      }
    };

    HasProperties.prototype.url = function() {
      var base;
      base = Config.prefix + "/bokeh/bb/" + this.get('doc') + "/" + this.type + "/";
      if (this.isNew()) {
        return base;
      }
      return base + this.get('id') + "/";
    };

    HasProperties.prototype.sync = function(method, model, options) {
      return options.success(model, null, {});
    };

    HasProperties.prototype.defaults = {};

    HasProperties.prototype.rpc = function(funcname, args, kwargs) {
      var data, docid, id, prefix, resp, type, url;
      prefix = Config.prefix;
      docid = this.get('doc');
      id = this.get('id');
      type = this.type;
      url = "" + prefix + "/bokeh/bb/rpc/" + docid + "/" + type + "/" + id + "/" + funcname + "/";
      data = {
        args: args,
        kwargs: kwargs
      };
      resp = $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify(data),
        contentType: 'application/json',
        xhrFields: {
          withCredentials: true
        }
      });
      return resp;
    };

    return HasProperties;

  })(Backbone.Model);

  HasParent = (function(_super) {
    __extends(HasParent, _super);

    function HasParent() {
      _ref1 = HasParent.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    HasParent.prototype.get_fallback = function(attr) {
      var retval;
      if (this.get_obj('parent') && _.indexOf(this.get_obj('parent').parent_properties, attr) >= 0 && !_.isUndefined(this.get_obj('parent').get(attr))) {
        return this.get_obj('parent').get(attr);
      } else {
        retval = this.display_defaults[attr];
        return retval;
      }
    };

    HasParent.prototype.get = function(attr) {
      var normalval;
      normalval = HasParent.__super__.get.call(this, attr);
      if (!_.isUndefined(normalval)) {
        return normalval;
      } else if (!(attr === 'parent')) {
        return this.get_fallback(attr);
      }
    };

    HasParent.prototype.display_defaults = {};

    return HasParent;

  })(HasProperties);

  build_views = function(view_storage, view_models, options, view_types) {
    var created_views, error, i_model, key, model, newmodels, to_remove, view_specific_option, _i, _j, _len, _len1;
    if (view_types == null) {
      view_types = [];
    }
    "use strict";
    created_views = [];
    try {
      newmodels = _.filter(view_models, function(x) {
        return !_.has(view_storage, x.id);
      });
    } catch (_error) {
      error = _error;
      debugger;
      console.log(error);
      throw error;
    }
    for (i_model = _i = 0, _len = newmodels.length; _i < _len; i_model = ++_i) {
      model = newmodels[i_model];
      view_specific_option = _.extend({}, options, {
        'model': model
      });
      try {
        if (i_model < view_types.length) {
          view_storage[model.id] = new view_types[i_model](view_specific_option);
        } else {
          view_storage[model.id] = new model.default_view(view_specific_option);
        }
      } catch (_error) {
        error = _error;
        console.log("error on model of", model, error);
        throw error;
      }
      created_views.push(view_storage[model.id]);
    }
    to_remove = _.difference(_.keys(view_storage), _.pluck(view_models, 'id'));
    for (_j = 0, _len1 = to_remove.length; _j < _len1; _j++) {
      key = to_remove[_j];
      view_storage[key].remove();
      delete view_storage[key];
    }
    return created_views;
  };

  locations = {
    AnnotationRenderer: ['./renderers/annotation_renderer', 'annotationrenderers'],
    GlyphRenderer: ['./renderers/glyph_renderer', 'glyphrenderers'],
    GuideRenderer: ['./renderers/guide_renderer', 'guiderenderers'],
    PanTool: ['./tools/pan_tool', 'pantools'],
    ZoomTool: ['./tools/zoom_tool', 'zoomtools'],
    ResizeTool: ['./tools/resize_tool', 'resizetools'],
    SelectionTool: ['./tools/select_tool', 'selectiontools'],
    DataRangeBoxSelectionTool: ['./tools/select_tool', 'datarangeboxselectiontools'],
    PreviewSaveTool: ['./tools/preview_save_tool', 'previewsavetools'],
    EmbedTool: ['./tools/embed_tool', 'embedtools'],
    BoxSelectionOverlay: ['./overlays/boxselectionoverlay', 'boxselectionoverlays'],
    ObjectArrayDataSource: ['./common/datasource', 'objectarraydatasources'],
    ColumnDataSource: ['./common/datasource', 'columndatasources'],
    Range1d: ['./common/ranges', 'range1ds'],
    DataRange1d: ['./common/ranges', 'datarange1ds'],
    DataFactorRange: ['./common/ranges', 'datafactorranges'],
    Plot: ['./common/plot', 'plots'],
    GMapPlot: ['./common/gmap_plot', 'gmapplots'],
    GridPlot: ['./common/grid_plot', 'gridplots'],
    CDXPlotContext: ['./common/plot_context', 'plotcontexts'],
    PlotContext: ['./common/plot_context', 'plotcontexts'],
    PlotList: ['./common/plot_context', 'plotlists'],
    DataTable: ['./widgets/table', 'datatables'],
    IPythonRemoteData: ['./pandas/pandas', 'ipythonremotedatas'],
    PandasPivotTable: ['./pandas/pandas', 'pandaspivottables'],
    PandasPlotSource: ['./pandas/pandas', 'pandasplotsources'],
    LinearAxis: ['./renderers/guide/linear_axis', 'linearaxes'],
    DatetimeAxis: ['./renderers/guide/datetime_axis', 'datetimeaxes'],
    Grid: ['./renderers/guide/grid', 'grids'],
    Legend: ['./renderers/annotation_renderer', 'annotationrenderers'],
    DataSlider: ['./tools/slider', 'datasliders']
  };

  exports.locations = locations;

  mod_cache = {};

  Collections = function(typename) {
    var collection, modulename, _ref2;
    if (!locations[typename]) {
      throw "./base: Unknown Collection " + typename;
    }
    _ref2 = locations[typename], modulename = _ref2[0], collection = _ref2[1];
    if (mod_cache[modulename] == null) {
      console.log("calling require", modulename);
      mod_cache[modulename] = require(modulename);
    }
    return mod_cache[modulename][collection];
  };

  Collections.bulksave = function(models) {
    var doc, jsondata, m, url, xhr;
    doc = models[0].get('doc');
    jsondata = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = models.length; _i < _len; _i++) {
        m = models[_i];
        _results.push({
          type: m.type,
          attributes: _.clone(m.attributes)
        });
      }
      return _results;
    })();
    jsondata = JSON.stringify(jsondata);
    url = Config.prefix + "/bokeh/bb/" + doc + "/bulkupsert";
    xhr = $.ajax({
      type: 'POST',
      url: url,
      contentType: "application/json",
      data: jsondata,
      header: {
        client: "javascript"
      }
    });
    xhr.done(function(data) {
      return load_models(data.modelspecs);
    });
    return xhr;
  };

  exports.Collections = Collections;

  exports.Config = Config;

  exports.safebind = safebind;

  exports.load_models = load_models;

  exports.WebSocketWrapper = WebSocketWrapper;

  exports.submodels = submodels;

  exports.HasProperties = HasProperties;

  exports.HasParent = HasParent;

  exports.build_views = build_views;

}).call(this);
}, "common/affine": function(exports, require, module) {(function() {
  var Affine;

  Affine = (function() {
    function Affine(a, b, c, d, tx, ty) {
      this.a = a != null ? a : 1;
      this.b = b != null ? b : 0;
      this.c = c != null ? c : 0;
      this.d = d != null ? d : 1;
      this.tx = tx != null ? tx : 0;
      this.ty = ty != null ? ty : 0;
    }

    Affine.prototype.apply = function(x, y) {
      return [this.a * x + this.b * y + this.tx, this.c * x + this.d * y + this.ty];
    };

    Affine.prototype.v_apply = function(xs, ys) {
      var i, xres, yres, _i, _ref;
      xres = new Float32Array(xs.length);
      yres = new Float32Array(ys.length);
      for (i = _i = 0, _ref = xs.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        xres[i] = this.a * xs[i] + this.b * ys[i] + this.tx;
        yres[i] = this.c * xs[i] + this.d * ys[i] + this.ty;
      }
      return [xres, yres];
    };

    Affine.prototype.is_identity = function() {
      return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
    };

    Affine.prototype.translate = function(tx, ty) {
      this.tx = this.a * tx + this.b * ty;
      return this.ty = this.c * tx + this.d * ty;
    };

    Affine.prototype.scale = function(sx, sy) {
      this.a *= sx;
      this.b *= sy;
      this.c *= sx;
      return this.d *= sy;
    };

    Affine.prototype.rotate = function(alpha) {
      var C, S, a, b, c, d;
      C = Math.cos(alpha);
      S = Math.sin(alpha);
      a = C * this.a + S * this.b;
      b = C * this.b - S * this.a;
      c = C * this.c + S * this.d;
      d = C * this.d - S * this.c;
      this.a = a;
      this.b = b;
      this.c = c;
      return this.d = d;
    };

    Affine.prototype.shear = function(kx, ky) {
      var a, b, c, d;
      a = this.a + kx * this.c;
      b = this.b + kx * this.d;
      c = this.c + ky * this.a;
      d = this.d + ky * this.b;
      this.a = a;
      this.b = b;
      this.c = c;
      return this.d = d;
    };

    Affine.prototype.reflect_x = function(x0) {
      this.tx = 2 * this.a * x0 + this.tx;
      this.ty = 2 * this.c * x0 + this.ty;
      this.a = -this.a;
      return this.c = -this.c;
    };

    Affine.prototype.reflect_y = function(y0) {
      this.tx = 2 * this.b * y0 + this.tx;
      this.ty = 2 * this.d * y0 + this.ty;
      this.b = -this.b;
      return this.d = -this.d;
    };

    Affine.prototype.reflect_xy = function(x0, y0) {
      this.tx = 2 * (this.a * x0 + this.b * y0) + this.tx;
      this.ty = 2 * (this.c * x0 + this.d * y0) + this.ty;
      this.a = -this.a;
      this.b = -this.b;
      this.c = -this.c;
      return this.d = -this.d;
    };

    Affine.prototype.compose_right = function(m) {
      var a, b, c, d, tx, ty;
      a = this.a * m.a + this.b * m.c;
      b = this.a * m.b + this.b * m.d;
      c = this.c * m.a + this.d * m.c;
      d = this.c * m.b + this.d * m.d;
      tx = this.a * m.tx + this.b * m.ty + this.tx;
      ty = this.c * m.tx + this.d * m.ty + this.ty;
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tx = tx;
      return this.ty = ty;
    };

    Affine.prototype.compose_left = function(m) {
      var a, b, c, d, tx, ty;
      a = m.a * this.a + m.b * this.c;
      b = m.a * this.b + m.b * this.d;
      c = m.c * this.a + m.d * this.c;
      d = m.c * this.b + m.d * this.d;
      tx = m.a * this.tx + m.b * this.ty + m.tx;
      ty = m.c * this.tx + m.d * this.ty + m.ty;
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tx = tx;
      return this.ty = ty;
    };

    return Affine;

  })();

}).call(this);
}, "common/continuum_view": function(exports, require, module) {(function() {
  var ContinuumView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ContinuumView = (function(_super) {
    __extends(ContinuumView, _super);

    function ContinuumView() {
      _ref = ContinuumView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ContinuumView.prototype.initialize = function(options) {
      if (!_.has(options, 'id')) {
        return this.id = _.uniqueId('ContinuumView');
      }
    };

    ContinuumView.prototype.bind_bokeh_events = function() {
      return 'pass';
    };

    ContinuumView.prototype.delegateEvents = function(events) {
      return ContinuumView.__super__.delegateEvents.call(this, events);
    };

    ContinuumView.prototype.remove = function() {
      var target, val, _ref1;
      if (_.has(this, 'eventers')) {
        _ref1 = this.eventers;
        for (target in _ref1) {
          if (!__hasProp.call(_ref1, target)) continue;
          val = _ref1[target];
          val.off(null, null, this);
        }
      }
      this.trigger('remove');
      return ContinuumView.__super__.remove.call(this);
    };

    ContinuumView.prototype.mget = function() {
      return this.model.get.apply(this.model, arguments);
    };

    ContinuumView.prototype.mset = function() {
      return this.model.set.apply(this.model, arguments);
    };

    ContinuumView.prototype.mget_obj = function(fld) {
      return this.model.get_obj(fld);
    };

    ContinuumView.prototype.render_end = function() {
      return "pass";
    };

    return ContinuumView;

  })(Backbone.View);

  exports.ContinuumView = ContinuumView;

}).call(this);
}, "common/datasource": function(exports, require, module) {(function() {
  var ColumnDataSource, ColumnDataSources, HasProperties, ObjectArrayDataSource, ObjectArrayDataSources, base, _ref, _ref1, _ref2, _ref3,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  HasProperties = base.HasProperties;

  ObjectArrayDataSource = (function(_super) {
    __extends(ObjectArrayDataSource, _super);

    function ObjectArrayDataSource() {
      _ref = ObjectArrayDataSource.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ObjectArrayDataSource.prototype.type = 'ObjectArrayDataSource';

    ObjectArrayDataSource.prototype.initialize = function(attrs, options) {
      ObjectArrayDataSource.__super__.initialize.call(this, attrs, options);
      this.cont_ranges = {};
      return this.discrete_ranges = {};
    };

    ObjectArrayDataSource.prototype.getcolumn = function(colname) {
      var x;
      return (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.get('data');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          x = _ref1[_i];
          _results.push(x[colname]);
        }
        return _results;
      }).call(this);
    };

    ObjectArrayDataSource.prototype.compute_cont_range = function(field) {
      var data;
      data = this.getcolumn(field);
      return [_.max(data), _.min(data)];
    };

    ObjectArrayDataSource.prototype.compute_discrete_factor = function(field) {
      var temp, uniques, val, _i, _len, _ref1;
      temp = {};
      _ref1 = this.getcolumn(field);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        val = _ref1[_i];
        temp[val] = true;
      }
      uniques = _.keys(temp);
      return uniques = _.sortBy(uniques, (function(x) {
        return x;
      }));
    };

    ObjectArrayDataSource.prototype.get_cont_range = function(field, padding) {
      var center, max, min, span, _ref1, _ref2,
        _this = this;
      if (_.isUndefined(padding)) {
        padding = 1.0;
      }
      if (!_.exists(this.cont_ranges, field)) {
        _ref1 = this.compute_cont_range(field), min = _ref1[0], max = _ref1[1];
        span = (max - min) * (1 + padding);
        center = (max + min) / 2.0;
        _ref2 = [center - span / 2.0, center + span / 2.0], min = _ref2[0], max = _ref2[1];
        this.cont_ranges[field] = Collections('Range1d').create({
          start: min,
          end: max
        });
        this.on('change:data', function() {
          var _ref3;
          _ref3 = _this.compute_cont_range(field), max = _ref3[0], min = _ref3[1];
          _this.cont_ranges[field].set('start', min);
          return _this.cont_ranges[field].set('end', max);
        });
      }
      return this.cont_ranges[field];
    };

    ObjectArrayDataSource.prototype.get_discrete_range = function(field) {
      var factors,
        _this = this;
      if (!_.exists(this.discrete_ranges, field)) {
        factors = this.compute_discrete_factor(field);
        this.discrete_ranges[field] = Collections('FactorRange').create({
          values: factors
        });
        this.on('change:data', function() {
          factors = _this.compute_discrete_factor(field);
          return _this.discrete_ranges[field] = Collections('FactorRange').set('values', factors);
        });
      }
      return this.discrete_ranges[field];
    };

    ObjectArrayDataSource.prototype.select = function(fields, func) {
      var args, idx, selected, val, x, _i, _len, _ref1;
      selected = [];
      _ref1 = this.get('data');
      for (idx = _i = 0, _len = _ref1.length; _i < _len; idx = ++_i) {
        val = _ref1[idx];
        args = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = fields.length; _j < _len1; _j++) {
            x = fields[_j];
            _results.push(val[x]);
          }
          return _results;
        })();
        if (func.apply(func, args)) {
          selected.push(idx);
        }
      }
      selected.sort();
      return selected;
    };

    return ObjectArrayDataSource;

  })(HasProperties);

  ObjectArrayDataSource.prototype.defaults = _.clone(ObjectArrayDataSource.prototype.defaults);

  _.extend(ObjectArrayDataSource.prototype.defaults, {
    data: [{}],
    name: 'data',
    selected: [],
    selecting: false
  });

  ObjectArrayDataSources = (function(_super) {
    __extends(ObjectArrayDataSources, _super);

    function ObjectArrayDataSources() {
      _ref1 = ObjectArrayDataSources.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ObjectArrayDataSources.prototype.model = ObjectArrayDataSource;

    return ObjectArrayDataSources;

  })(Backbone.Collection);

  ColumnDataSource = (function(_super) {
    __extends(ColumnDataSource, _super);

    function ColumnDataSource() {
      _ref2 = ColumnDataSource.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    ColumnDataSource.prototype.type = 'ColumnDataSource';

    ColumnDataSource.prototype.initialize = function(attrs, options) {
      ColumnDataSource.__super__.initialize.call(this, attrs, options);
      this.cont_ranges = {};
      return this.discrete_ranges = {};
    };

    ColumnDataSource.prototype.getcolumn = function(colname) {
      return this.get('data')[colname];
    };

    ColumnDataSource.prototype.datapoints = function() {
      var data, field, fields, i, point, points, _i, _j, _len, _ref3;
      data = this.get('data');
      fields = _.keys(data);
      points = [];
      for (i = _i = 0, _ref3 = data[fields[0]].length - 1; 0 <= _ref3 ? _i <= _ref3 : _i >= _ref3; i = 0 <= _ref3 ? ++_i : --_i) {
        point = {};
        for (_j = 0, _len = fields.length; _j < _len; _j++) {
          field = fields[_j];
          point[field] = data[field][i];
        }
        points.push(point);
      }
      return points;
    };

    return ColumnDataSource;

  })(ObjectArrayDataSource);

  ColumnDataSources = (function(_super) {
    __extends(ColumnDataSources, _super);

    function ColumnDataSources() {
      _ref3 = ColumnDataSources.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    ColumnDataSources.prototype.model = ColumnDataSource;

    return ColumnDataSources;

  })(Backbone.Collection);

  exports.objectarraydatasources = new ObjectArrayDataSources;

  exports.columndatasources = new ColumnDataSources;

  exports.ObjectArrayDataSource = ObjectArrayDataSource;

  exports.ColumnDataSource = ColumnDataSource;

}).call(this);
}, "common/gmap_plot": function(exports, require, module) {(function() {
  var ActiveToolManager, Collections, ContinuumView, GMapPlot, GMapPlotView, GMapPlots, GridMapper, HasParent, LEVELS, LinearMapper, ViewState, base, build_views, properties, safebind, text_properties, _ref, _ref1, _ref2,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  HasParent = base.HasParent;

  safebind = base.safebind;

  build_views = base.build_views;

  properties = require('../renderers/properties');

  text_properties = properties.text_properties;

  ContinuumView = require('./continuum_view').ContinuumView;

  LinearMapper = require('../mappers/1d/linear_mapper').LinearMapper;

  GridMapper = require('../mappers/2d/grid_mapper').GridMapper;

  ViewState = require('./view_state').ViewState;

  ActiveToolManager = require("../tools/active_tool_manager").ActiveToolManager;

  LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];

  GMapPlotView = (function(_super) {
    __extends(GMapPlotView, _super);

    function GMapPlotView() {
      this.bounds_change = __bind(this.bounds_change, this);
      this._mousemove = __bind(this._mousemove, this);
      this._mousedown = __bind(this._mousedown, this);
      _ref = GMapPlotView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GMapPlotView.prototype.events = {
      "mousemove .bokeh_canvas_wrapper": "_mousemove",
      "mousedown .bokeh_canvas_wrapper": "_mousedown"
    };

    GMapPlotView.prototype.className = "bokeh";

    GMapPlotView.prototype.view_options = function() {
      return _.extend({
        plot_model: this.model,
        plot_view: this
      }, this.options);
    };

    GMapPlotView.prototype._mousedown = function(e) {
      var f, _i, _len, _ref1, _results;
      _ref1 = this.mousedownCallbacks;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        f = _ref1[_i];
        _results.push(f(e, e.layerX, e.layerY));
      }
      return _results;
    };

    GMapPlotView.prototype._mousemove = function(e) {
      var f, _i, _len, _ref1, _results;
      _ref1 = this.moveCallbacks;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        f = _ref1[_i];
        _results.push(f(e, e.layerX, e.layerY));
      }
      return _results;
    };

    GMapPlotView.prototype.pause = function() {
      return this.is_paused = true;
    };

    GMapPlotView.prototype.unpause = function(render_canvas) {
      if (render_canvas == null) {
        render_canvas = false;
      }
      this.is_paused = false;
      if (render_canvas) {
        return this.request_render_canvas(true);
      } else {
        return this.request_render();
      }
    };

    GMapPlotView.prototype.request_render = function() {
      if (!this.is_paused) {
        this.throttled_render();
      }
    };

    GMapPlotView.prototype.request_render_canvas = function(full_render) {
      if (!this.is_paused) {
        this.throttled_render_canvas(full_render);
      }
    };

    GMapPlotView.prototype.initialize = function(options) {
      var level, tool, _i, _j, _len, _len1, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      GMapPlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
      this.throttled_render = _.throttle(this.render, 100);
      this.throttled_render_canvas = _.throttle(this.render_canvas, 100);
      this.title_props = new text_properties(this, {}, 'title_');
      this.view_state = new ViewState({
        canvas_width: (_ref1 = options.canvas_width) != null ? _ref1 : this.mget('canvas_width'),
        canvas_height: (_ref2 = options.canvas_height) != null ? _ref2 : this.mget('canvas_height'),
        x_offset: (_ref3 = options.x_offset) != null ? _ref3 : this.mget('x_offset'),
        y_offset: (_ref4 = options.y_offset) != null ? _ref4 : this.mget('y_offset'),
        outer_width: (_ref5 = options.outer_width) != null ? _ref5 : this.mget('outer_width'),
        outer_height: (_ref6 = options.outer_height) != null ? _ref6 : this.mget('outer_height'),
        min_border_top: (_ref7 = (_ref8 = options.min_border_top) != null ? _ref8 : this.mget('min_border_top')) != null ? _ref7 : this.mget('min_border'),
        min_border_bottom: (_ref9 = (_ref10 = options.min_border_bottom) != null ? _ref10 : this.mget('min_border_bottom')) != null ? _ref9 : this.mget('min_border'),
        min_border_left: (_ref11 = (_ref12 = options.min_border_left) != null ? _ref12 : this.mget('min_border_left')) != null ? _ref11 : this.mget('min_border'),
        min_border_right: (_ref13 = (_ref14 = options.min_border_right) != null ? _ref14 : this.mget('min_border_right')) != null ? _ref13 : this.mget('min_border'),
        requested_border_top: 0,
        requested_border_bottom: 0,
        requested_border_left: 0,
        requested_border_right: 0
      });
      this.x_range = (_ref15 = options.x_range) != null ? _ref15 : this.mget_obj('x_range');
      this.y_range = (_ref16 = options.y_range) != null ? _ref16 : this.mget_obj('y_range');
      this.xmapper = new LinearMapper({
        source_range: this.x_range,
        target_range: this.view_state.get('inner_range_horizontal')
      });
      this.ymapper = new LinearMapper({
        source_range: this.y_range,
        target_range: this.view_state.get('inner_range_vertical')
      });
      this.mapper = new GridMapper({
        domain_mapper: this.xmapper,
        codomain_mapper: this.ymapper
      });
      _ref17 = this.mget_obj('tools');
      for (_i = 0, _len = _ref17.length; _i < _len; _i++) {
        tool = _ref17[_i];
        if (tool.type === "PanTool" || tool.type === "ZoomTool") {
          tool.set_obj('dataranges', [this.x_range, this.y_range]);
          tool.set('dimensions', ['width', 'height']);
        }
      }
      this.requested_padding = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };
      this.old_mapper_state = {
        x: null,
        y: null
      };
      this.am_rendering = false;
      this.renderers = {};
      this.tools = {};
      this.zoom_count = null;
      this.eventSink = _.extend({}, Backbone.Events);
      this.moveCallbacks = [];
      this.mousedownCallbacks = [];
      this.keydownCallbacks = [];
      this.render_init();
      this.render_canvas(false);
      this.atm = new ActiveToolManager(this.eventSink);
      this.levels = {};
      for (_j = 0, _len1 = LEVELS.length; _j < _len1; _j++) {
        level = LEVELS[_j];
        this.levels[level] = {};
      }
      this.build_levels();
      this.request_render();
      this.atm.bind_bokeh_events();
      this.bind_bokeh_events();
      return this;
    };

    GMapPlotView.prototype.map_to_screen = function(x, x_units, y, y_units, units) {
      var sx, sy, _ref1;
      if (x_units === 'screen') {
        sx = x.slice(0);
        sy = y.slice(0);
      } else {
        _ref1 = this.mapper.v_map_to_target(x, y), sx = _ref1[0], sy = _ref1[1];
      }
      sx = this.view_state.v_sx_to_device(sx);
      sy = this.view_state.v_sy_to_device(sy);
      return [sx, sy];
    };

    GMapPlotView.prototype.map_from_screen = function(sx, sy, units) {
      var x, y, _ref1;
      sx = this.view_state.v_device_sx(sx.slice(0));
      sy = this.view_state.v_device_sx(sy.slice(0));
      if (units === 'screen') {
        x = sx;
        y = sy;
      } else {
        _ref1 = this.mapper.v_map_from_target(sx, sy), x = _ref1[0], y = _ref1[1];
      }
      return [x, y];
    };

    GMapPlotView.prototype.update_range = function(range_info) {
      var center, ne_lat, ne_lng, sw_lat, sw_lng;
      this.pause();
      if (range_info.sdx != null) {
        this.map.panBy(range_info.sdx, range_info.sdy);
      } else {
        sw_lng = Math.min(range_info.xr.start, range_info.xr.end);
        ne_lng = Math.max(range_info.xr.start, range_info.xr.end);
        sw_lat = Math.min(range_info.yr.start, range_info.yr.end);
        ne_lat = Math.max(range_info.yr.start, range_info.yr.end);
        center = new google.maps.LatLng((ne_lat + sw_lat) / 2, (ne_lng + sw_lng) / 2);
        if (range_info.factor > 0) {
          this.zoom_count += 1;
          if (this.zoom_count === 10) {
            this.map.setZoom(this.map.getZoom() + 1);
            this.zoom_count = 0;
          }
        } else {
          this.zoom_count -= 1;
          if (this.zoom_count === -10) {
            this.map.setCenter(center);
            this.map.setZoom(this.map.getZoom() - 1);
            this.map.setCenter(center);
            this.zoom_count = 0;
          }
        }
      }
      return this.unpause();
    };

    GMapPlotView.prototype.build_tools = function() {
      return build_views(this.tools, this.mget_obj('tools'), this.view_options());
    };

    GMapPlotView.prototype.build_views = function() {
      return build_views(this.renderers, this.mget_obj('renderers'), this.view_options());
    };

    GMapPlotView.prototype.build_levels = function() {
      var level, t, tools, v, views, _i, _j, _len, _len1;
      views = this.build_views();
      tools = this.build_tools();
      for (_i = 0, _len = views.length; _i < _len; _i++) {
        v = views[_i];
        level = v.mget('level');
        this.levels[level][v.model.id] = v;
        v.bind_bokeh_events();
      }
      for (_j = 0, _len1 = tools.length; _j < _len1; _j++) {
        t = tools[_j];
        level = t.mget('level');
        this.levels[level][t.model.id] = t;
        t.bind_bokeh_events();
      }
      return this;
    };

    GMapPlotView.prototype.bind_bokeh_events = function() {
      var _this = this;
      safebind(this, this.view_state, 'change', function() {
        _this.request_render_canvas();
        return _this.request_render();
      });
      safebind(this, this.x_range, 'change', this.request_render);
      safebind(this, this.y_range, 'change', this.request_render);
      safebind(this, this.model, 'change:renderers', this.build_levels);
      safebind(this, this.model, 'change:tool', this.build_levels);
      safebind(this, this.model, 'change', this.request_render);
      return safebind(this, this.model, 'destroy', function() {
        return _this.remove();
      });
    };

    GMapPlotView.prototype.render_init = function() {
      this.$el.append($("<div class='button_bar btn-group'/>\n<div class='plotarea'>\n<div class='bokeh_canvas_wrapper'>\n  <div class=\"bokeh_gmap\"></div>\n  <canvas class='bokeh_canvas'></canvas>\n</div>\n</div>"));
      this.button_bar = this.$el.find('.button_bar');
      this.canvas_wrapper = this.$el.find('.bokeh_canvas_wrapper');
      this.canvas = this.$el.find('canvas.bokeh_canvas');
      return this.gmap_div = this.$el.find('.bokeh_gmap');
    };

    GMapPlotView.prototype.render_canvas = function(full_render) {
      var build_map, ih, iw, left, oh, ow, top,
        _this = this;
      if (full_render == null) {
        full_render = true;
      }
      oh = this.view_state.get('outer_height');
      ow = this.view_state.get('outer_width');
      iw = this.view_state.get('inner_width');
      ih = this.view_state.get('inner_height');
      top = this.view_state.get('border_top');
      left = this.view_state.get('border_left');
      this.button_bar.width("" + ow + "px");
      this.canvas_wrapper.width("" + ow + "px").height("" + oh + "px");
      this.canvas.attr('width', ow).attr('height', oh);
      this.$el.attr("width", ow).attr('height', oh);
      this.gmap_div.attr("style", "top: " + top + "px; left: " + left + "px; position: absolute");
      this.gmap_div.width("" + iw + "px").height("" + ih + "px");
      build_map = function() {
        var map_options, mo;
        mo = _this.mget('map_options');
        map_options = {
          center: new google.maps.LatLng(mo.lat, mo.lng),
          zoom: mo.zoom,
          disableDefaultUI: true,
          mapTypeId: google.maps.MapTypeId.SATELLITE
        };
        _this.map = new google.maps.Map(_this.gmap_div[0], map_options);
        return google.maps.event.addListener(_this.map, 'bounds_changed', _this.bounds_change);
      };
      _.defer(build_map);
      this.ctx = this.canvas[0].getContext('2d');
      if (full_render) {
        return this.render();
      }
    };

    GMapPlotView.prototype.bounds_change = function() {
      var bds, ne, sw;
      bds = this.map.getBounds();
      ne = bds.getNorthEast();
      sw = bds.getSouthWest();
      this.x_range.set({
        start: sw.lng(),
        end: ne.lng(),
        silent: true
      });
      return this.y_range.set({
        start: sw.lat(),
        end: ne.lat()
      });
    };

    GMapPlotView.prototype.save_png = function() {
      var data_uri;
      this.render();
      data_uri = this.canvas[0].toDataURL();
      this.model.set('png', this.canvas[0].toDataURL());
      return base.Collections.bulksave([this.model]);
    };

    GMapPlotView.prototype.render = function(force) {
      var have_new_mapper_state, hpadding, ih, iw, k, left, level, oh, ow, pr, renderers, sx, sy, sym, th, title, top, v, xms, yms, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _ref4;
      this.requested_padding = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };
      _ref1 = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        level = _ref1[_i];
        renderers = this.levels[level];
        for (k in renderers) {
          v = renderers[k];
          if (v.padding_request != null) {
            pr = v.padding_request();
            for (k in pr) {
              v = pr[k];
              this.requested_padding[k] += v;
            }
          }
        }
      }
      title = this.mget('title');
      if (title) {
        this.title_props.set(this.ctx, {});
        th = this.ctx.measureText(this.mget('title')).ascent;
        this.requested_padding['top'] += th + this.mget('title_standoff');
      }
      sym = this.mget('border_symmetry');
      if (sym.indexOf('h') >= 0 || sym.indexOf('H') >= 0) {
        hpadding = Math.max(this.requested_padding['left'], this.requested_padding['right']);
        this.requested_padding['left'] = hpadding;
        this.requested_padding['right'] = hpadding;
      }
      if (sym.indexOf('v') >= 0 || sym.indexOf('V') >= 0) {
        hpadding = Math.max(this.requested_padding['top'], this.requested_padding['bottom']);
        this.requested_padding['top'] = hpadding;
        this.requested_padding['bottom'] = hpadding;
      }
      this.is_paused = true;
      _ref2 = this.requested_padding;
      for (k in _ref2) {
        v = _ref2[k];
        this.view_state.set("requested_border_" + k, v);
      }
      this.is_paused = false;
      oh = this.view_state.get('outer_height');
      ow = this.view_state.get('outer_width');
      iw = this.view_state.get('inner_width');
      ih = this.view_state.get('inner_height');
      top = this.view_state.get('border_top');
      left = this.view_state.get('border_left');
      this.gmap_div.attr("style", "top: " + top + "px; left: " + left + "px;");
      this.gmap_div.width("" + iw + "px").height("" + ih + "px");
      this.ctx.clearRect(0, 0, ow, oh);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(0, oh);
      this.ctx.lineTo(ow, oh);
      this.ctx.lineTo(ow, 0);
      this.ctx.lineTo(0, 0);
      this.ctx.moveTo(left, top);
      this.ctx.lineTo(left + iw, top);
      this.ctx.lineTo(left + iw, top + ih);
      this.ctx.lineTo(left, top + ih);
      this.ctx.lineTo(left, top);
      this.ctx.closePath();
      this.ctx.fillStyle = this.mget('border_fill');
      this.ctx.fill();
      have_new_mapper_state = false;
      xms = this.xmapper.get('mapper_state')[0];
      yms = this.xmapper.get('mapper_state')[0];
      if (Math.abs(this.old_mapper_state.x - xms) > 1e-8 || Math.abs(this.old_mapper_state.y - yms) > 1e-8) {
        this.old_mapper_state.x = xms;
        this.old_mapper_state.y = yms;
        have_new_mapper_state = true;
      }
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(this.view_state.get('border_left'), this.view_state.get('border_top'), this.view_state.get('inner_width'), this.view_state.get('inner_height'));
      this.ctx.clip();
      this.ctx.beginPath();
      _ref3 = ['image', 'underlay', 'glyph'];
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        level = _ref3[_j];
        renderers = this.levels[level];
        for (k in renderers) {
          v = renderers[k];
          v.render(have_new_mapper_state);
        }
      }
      this.ctx.restore();
      _ref4 = ['overlay', 'annotation', 'tool'];
      for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
        level = _ref4[_k];
        renderers = this.levels[level];
        for (k in renderers) {
          v = renderers[k];
          v.render(have_new_mapper_state);
        }
      }
      if (title) {
        sx = this.view_state.get('outer_width') / 2;
        sy = th;
        this.title_props.set(this.ctx, {});
        return this.ctx.fillText(title, sx, sy);
      }
    };

    return GMapPlotView;

  })(ContinuumView);

  GMapPlot = (function(_super) {
    __extends(GMapPlot, _super);

    function GMapPlot() {
      _ref1 = GMapPlot.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    GMapPlot.prototype.type = 'GMapPlot';

    GMapPlot.prototype.default_view = GMapPlotView;

    GMapPlot.prototype.add_renderers = function(new_renderers) {
      var renderers;
      renderers = this.get('renderers');
      renderers = renderers.concat(new_renderers);
      return this.set('renderers', renderers);
    };

    GMapPlot.prototype.parent_properties = ['border_fill', 'canvas_width', 'canvas_height', 'outer_width', 'outer_height', 'min_border', 'min_border_top', 'min_border_bottom', 'min_border_left', 'min_border_right'];

    return GMapPlot;

  })(HasParent);

  GMapPlot.prototype.defaults = _.clone(GMapPlot.prototype.defaults);

  _.extend(GMapPlot.prototype.defaults, {
    'data_sources': {},
    'renderers': [],
    'tools': [],
    'title': 'GMapPlot'
  });

  GMapPlot.prototype.display_defaults = _.clone(GMapPlot.prototype.display_defaults);

  _.extend(GMapPlot.prototype.display_defaults, {
    border_fill: "#eee",
    border_symmetry: 'h',
    min_border: 40,
    x_offset: 0,
    y_offset: 0,
    canvas_width: 300,
    canvas_height: 300,
    outer_width: 300,
    outer_height: 300,
    title_standoff: 8,
    title_text_font: "helvetica",
    title_text_font_size: "20pt",
    title_text_font_style: "normal",
    title_text_color: "#444444",
    title_text_alpha: 1.0,
    title_text_align: "center",
    title_text_baseline: "alphabetic"
  });

  GMapPlots = (function(_super) {
    __extends(GMapPlots, _super);

    function GMapPlots() {
      _ref2 = GMapPlots.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    GMapPlots.prototype.model = GMapPlot;

    return GMapPlots;

  })(Backbone.Collection);

  exports.GMapPlot = GMapPlot;

  exports.GMapPlotView = GMapPlotView;

  exports.gmapplots = new GMapPlots;

}).call(this);
}, "common/grid_plot": function(exports, require, module) {(function() {
  var ActiveToolManager, ContinuumView, GridPlot, GridPlotView, GridPlots, GridViewState, HasParent, HasProperties, PanToolView, ViewState, ZoomToolView, base, build_views, safebind, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  HasParent = base.HasParent;

  HasProperties = base.HasProperties;

  safebind = base.safebind;

  build_views = base.build_views;

  ContinuumView = require('./continuum_view').ContinuumView;

  ViewState = require('./view_state').ViewState;

  GridViewState = require('./grid_view_state').GridViewState;

  ActiveToolManager = require("../tools/active_tool_manager").ActiveToolManager;

  PanToolView = require('../tools/pan_tool').PanToolView;

  ZoomToolView = require('../tools/zoom_tool').ZoomToolView;

  GridPlotView = (function(_super) {
    __extends(GridPlotView, _super);

    function GridPlotView() {
      _ref = GridPlotView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GridPlotView.prototype.tagName = 'div';

    GridPlotView.prototype.className = "bokeh grid_plot";

    GridPlotView.prototype.default_options = {
      scale: 1.0
    };

    GridPlotView.prototype.set_child_view_states = function() {
      var row, viewstaterow, viewstates, x, _i, _len, _ref1;
      viewstates = [];
      _ref1 = this.mget('children');
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        row = _ref1[_i];
        viewstaterow = (function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
            x = row[_j];
            _results.push(this.childviews[x.id].view_state);
          }
          return _results;
        }).call(this);
        viewstates.push(viewstaterow);
      }
      return this.viewstate.set('childviewstates', viewstates);
    };

    GridPlotView.prototype.initialize = function(options) {
      GridPlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
      this.viewstate = new GridViewState();
      this.toolbar_height = 0;
      this.childviews = {};
      this.build_children();
      this.bind_bokeh_events();
      this.render();
      return this;
    };

    GridPlotView.prototype.bind_bokeh_events = function() {
      var _this = this;
      safebind(this, this.model, 'change:children', this.build_children);
      safebind(this, this.model, 'change', this.render);
      safebind(this, this.viewstate, 'change', this.render);
      return safebind(this, this.model, 'destroy', function() {
        return _this.remove();
      });
    };

    GridPlotView.prototype.b_events = {
      "change:children model": "build_children",
      "change model": "render",
      "change viewstate": "render",
      "destroy model": "remove"
    };

    GridPlotView.prototype.build_children = function() {
      var childmodels, plot, row, _i, _j, _len, _len1, _ref1;
      childmodels = [];
      _ref1 = this.mget_obj('children');
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        row = _ref1[_i];
        for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
          plot = row[_j];
          childmodels.push(plot);
        }
      }
      build_views(this.childviews, childmodels, {});
      return this.set_child_view_states();
    };

    GridPlotView.prototype.makeButton = function(eventSink, constructor, toolbar_div, button_name) {
      var all_tools, button, button_activated, specific_tools, tool_active;
      all_tools = _.flatten(_.map(_.pluck(this.childviews, 'tools'), _.values));
      specific_tools = _.where(all_tools, {
        constructor: constructor
      });
      button = $("<button class='btn btn-small'>" + button_name + "</button>");
      toolbar_div.append(button);
      tool_active = false;
      button_activated = false;
      button.click(function() {
        console.log("button clicked", button_name);
        if (button_activated) {
          return eventSink.trigger('clear_active_tool');
        } else {
          return eventSink.trigger('active_tool', button_name);
        }
      });
      eventSink.on("" + button_name + ":deactivated", function() {
        button.removeClass('active');
        button_activated = false;
        return _.each(specific_tools, function(t) {
          var t_name;
          t_name = t.evgen.toolName;
          console.log('deactivating ', t_name);
          return t.evgen.eventSink.trigger("" + t_name + ":deactivated");
        });
      });
      return eventSink.on("" + button_name + ":activated", function() {
        button.addClass('active');
        button_activated = true;
        return _.each(specific_tools, function(t) {
          var t_name;
          t_name = t.evgen.toolName;
          console.log('activating ', t_name);
          return t.evgen.eventSink.trigger("" + t_name + ":activated");
        });
      });
    };

    GridPlotView.prototype.addGridToolbar = function() {
      var all_tool_classes, all_tools, tool_name_dict,
        _this = this;
      this.button_bar = $("<div class='grid_button_bar'/>");
      this.button_bar.attr('style', "position:absolute; left:10px; top:5px; ");
      this.toolEventSink = _.extend({}, Backbone.Events);
      this.atm = new ActiveToolManager(this.toolEventSink);
      this.atm.bind_bokeh_events();
      this.$el.append(this.button_bar);
      all_tools = _.flatten(_.map(_.pluck(this.childviews, 'tools'), _.values));
      all_tool_classes = _.uniq(_.pluck(all_tools, 'constructor'));
      if (all_tool_classes.length > 0) {
        this.toolbar_height = 20;
      }
      tool_name_dict = {};
      _.each(all_tool_classes, function(klass) {
        var btext;
        btext = _.where(all_tools, {
          constructor: klass
        })[0].evgen_options.buttonText;
        return tool_name_dict[btext] = klass;
      });
      _.map(tool_name_dict, function(klass, button_text) {
        return _this.makeButton(_this.toolEventSink, klass, _this.button_bar, button_text);
      });
      return _.map(all_tools, function(t) {
        console.log(t);
        console.log(t.evgen);
        return t.evgen.hide_button();
      });
    };

    GridPlotView.prototype.render = function() {
      var add, cidx, col_widths, height, last_plot, plot_divs, plot_wrapper, plotspec, ridx, row, row_heights, total_height, view, width, x_coords, xpos, y_coords, ypos, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2;
      GridPlotView.__super__.render.call(this);
      _ref1 = _.values(this.childviews);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        view = _ref1[_i];
        view.$el.detach();
      }
      this.$el.html('');
      this.addGridToolbar();
      row_heights = this.viewstate.get('layout_heights');
      col_widths = this.viewstate.get('layout_widths');
      y_coords = [0];
      _.reduceRight(row_heights.slice(1), function(x, y) {
        var val;
        val = x + y;
        y_coords.push(val);
        return val;
      }, 0);
      y_coords.reverse();
      x_coords = [0];
      _.reduce(col_widths.slice(0), function(x, y) {
        var val;
        val = x + y;
        x_coords.push(val);
        return val;
      }, 0);
      plot_divs = [];
      last_plot = null;
      _ref2 = this.mget('children');
      for (ridx = _j = 0, _len1 = _ref2.length; _j < _len1; ridx = ++_j) {
        row = _ref2[ridx];
        for (cidx = _k = 0, _len2 = row.length; _k < _len2; cidx = ++_k) {
          plotspec = row[cidx];
          view = this.childviews[plotspec.id];
          ypos = this.viewstate.position_child_y(y_coords[ridx], view.view_state.get('outer_height') - this.toolbar_height);
          xpos = this.viewstate.position_child_x(x_coords[cidx], view.view_state.get('outer_width'));
          plot_wrapper = $("<div class='gp_plotwrapper'></div>");
          plot_wrapper.attr('style', "position: absolute; left:" + xpos + "px; top:" + ypos + "px");
          plot_wrapper.append(view.$el);
          this.$el.append(plot_wrapper);
        }
      }
      add = function(a, b) {
        return a + b;
      };
      total_height = _.reduce(row_heights, add, 0);
      height = total_height + this.toolbar_height;
      width = this.viewstate.get('outerwidth');
      this.$el.attr('style', "position:relative; height:" + height + "px;width:" + width + "px");
      return this.render_end();
    };

    return GridPlotView;

  })(ContinuumView);

  GridPlot = (function(_super) {
    __extends(GridPlot, _super);

    function GridPlot() {
      _ref1 = GridPlot.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    GridPlot.prototype.type = 'GridPlot';

    GridPlot.prototype.default_view = GridPlotView;

    return GridPlot;

  })(HasParent);

  GridPlot.prototype.defaults = _.clone(GridPlot.prototype.defaults);

  _.extend(GridPlot.prototype.defaults, {
    children: [[]],
    border_space: 0
  });

  GridPlots = (function(_super) {
    __extends(GridPlots, _super);

    function GridPlots() {
      _ref2 = GridPlots.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    GridPlots.prototype.model = GridPlot;

    return GridPlots;

  })(Backbone.Collection);

  exports.GridPlot = GridPlot;

  exports.GridPlotView = GridPlotView;

  exports.gridplots = new GridPlots;

}).call(this);
}, "common/grid_view_state": function(exports, require, module) {(function() {
  var GridViewState, ViewState, base, safebind, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  safebind = base.safebind;

  ViewState = require('./view_state').ViewState;

  GridViewState = (function(_super) {
    __extends(GridViewState, _super);

    function GridViewState() {
      this.layout_widths = __bind(this.layout_widths, this);
      this.layout_heights = __bind(this.layout_heights, this);
      this.setup_layout_properties = __bind(this.setup_layout_properties, this);
      _ref = GridViewState.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GridViewState.prototype.setup_layout_properties = function() {
      var row, viewstate, _i, _len, _ref1, _results;
      this.register_property('layout_heights', this.layout_heights, true);
      this.register_property('layout_widths', this.layout_widths, true);
      _ref1 = this.get('childviewstates');
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        row = _ref1[_i];
        _results.push((function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
            viewstate = row[_j];
            this.add_dependencies('layout_heights', viewstate, 'outer_height');
            _results1.push(this.add_dependencies('layout_widths', viewstate, 'outer_width'));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    GridViewState.prototype.initialize = function(attrs, options) {
      GridViewState.__super__.initialize.call(this, attrs, options);
      this.setup_layout_properties();
      safebind(this, this, 'change:childviewstates', this.setup_layout_properties);
      this.register_property('height', function() {
        return _.reduce(this.get('layout_heights'), (function(x, y) {
          return x + y;
        }), 0);
      }, true);
      this.add_dependencies('height', this, 'layout_heights');
      this.register_property('width', function() {
        return _.reduce(this.get('layout_widths'), (function(x, y) {
          return x + y;
        }), 0);
      }, true);
      return this.add_dependencies('width', this, 'layout_widths');
    };

    GridViewState.prototype.position_child_x = function(offset, childsize) {
      return offset;
    };

    GridViewState.prototype.position_child_y = function(offset, childsize) {
      return this.get('height') - offset - childsize;
    };

    GridViewState.prototype.maxdim = function(dim, row) {
      if (row.length === 0) {
        return 0;
      } else {
        return _.max(_.map(row, (function(x) {
          return x.get(dim);
        })));
      }
    };

    GridViewState.prototype.layout_heights = function() {
      var row, row_heights;
      row_heights = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.get('childviewstates');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          row = _ref1[_i];
          _results.push(this.maxdim('outer_height', row));
        }
        return _results;
      }).call(this);
      return row_heights;
    };

    GridViewState.prototype.layout_widths = function() {
      var col, col_widths, columns, n, num_cols, row;
      num_cols = this.get('childviewstates')[0].length;
      columns = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = _.range(num_cols);
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          n = _ref1[_i];
          _results.push((function() {
            var _j, _len1, _ref2, _results1;
            _ref2 = this.get('childviewstates');
            _results1 = [];
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
              row = _ref2[_j];
              _results1.push(row[n]);
            }
            return _results1;
          }).call(this));
        }
        return _results;
      }).call(this);
      col_widths = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = columns.length; _i < _len; _i++) {
          col = columns[_i];
          _results.push(this.maxdim('outer_width', col));
        }
        return _results;
      }).call(this);
      return col_widths;
    };

    return GridViewState;

  })(ViewState);

  GridViewState.prototype.defaults = _.clone(GridViewState.prototype.defaults);

  _.extend(GridViewState.prototype.defaults, {
    childviewstates: [[]],
    border_space: 0
  });

  exports.GridViewState = GridViewState;

}).call(this);
}, "common/plot": function(exports, require, module) {(function() {
  var ActiveToolManager, Collections, ContinuumView, GridMapper, HasParent, LEVELS, LinearMapper, PNGView, Plot, PlotView, Plots, ViewState, base, build_views, delayAnimation, properties, safebind, text_properties, throttleAnimation, _ref, _ref1, _ref2, _ref3,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  HasParent = base.HasParent;

  safebind = base.safebind;

  build_views = base.build_views;

  properties = require('../renderers/properties');

  text_properties = properties.text_properties;

  ContinuumView = require('./continuum_view').ContinuumView;

  LinearMapper = require('../mappers/1d/linear_mapper').LinearMapper;

  GridMapper = require('../mappers/2d/grid_mapper').GridMapper;

  ViewState = require('./view_state').ViewState;

  ActiveToolManager = require("../tools/active_tool_manager").ActiveToolManager;

  LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];

  delayAnimation = function(f) {
    return f();
  };

  delayAnimation = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || delayAnimation;

  throttleAnimation = function(func, wait) {
    var args, context, later, pending, previous, result, timeout, _ref;
    _ref = [null, null, null, null], context = _ref[0], args = _ref[1], timeout = _ref[2], result = _ref[3];
    previous = 0;
    pending = false;
    later = function() {
      previous = new Date;
      timeout = null;
      pending = false;
      return result = func.apply(context, args);
    };
    return function() {
      var now, remaining;
      now = new Date;
      remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 && !pending) {
        clearTimeout(timeout);
        pending = true;
        delayAnimation(later);
      } else if (!timeout) {
        timeout = setTimeout((function() {
          return delayAnimation(later);
        }), remaining);
      }
      return result;
    };
  };

  PlotView = (function(_super) {
    __extends(PlotView, _super);

    function PlotView() {
      this._mousemove = __bind(this._mousemove, this);
      this._mousedown = __bind(this._mousedown, this);
      _ref = PlotView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PlotView.prototype.className = "bokeh plotview";

    PlotView.prototype.events = {
      "mousemove .bokeh_canvas_wrapper": "_mousemove",
      "mousedown .bokeh_canvas_wrapper": "_mousedown"
    };

    PlotView.prototype.view_options = function() {
      return _.extend({
        plot_model: this.model,
        plot_view: this
      }, this.options);
    };

    PlotView.prototype._mousedown = function(e) {
      var f, _i, _len, _ref1, _results;
      _ref1 = this.mousedownCallbacks;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        f = _ref1[_i];
        _results.push(f(e, e.layerX, e.layerY));
      }
      return _results;
    };

    PlotView.prototype._mousemove = function(e) {
      var f, _i, _len, _ref1, _results;
      _ref1 = this.moveCallbacks;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        f = _ref1[_i];
        _results.push(f(e, e.layerX, e.layerY));
      }
      return _results;
    };

    PlotView.prototype.pause = function() {
      return this.is_paused = true;
    };

    PlotView.prototype.unpause = function(render_canvas) {
      if (render_canvas == null) {
        render_canvas = false;
      }
      this.is_paused = false;
      if (render_canvas) {
        return this.request_render_canvas(true);
      } else {
        return this.request_render();
      }
    };

    PlotView.prototype.request_render = function() {
      if (!this.is_paused) {
        this.throttled_render();
      }
    };

    PlotView.prototype.request_render_canvas = function(full_render) {
      if (!this.is_paused) {
        this.throttled_render_canvas(full_render);
      }
    };

    PlotView.prototype.initialize = function(options) {
      var level, _i, _len, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      PlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
      this.throttled_render = throttleAnimation(this.render, 15);
      this.throttled_render_canvas = throttleAnimation(this.render_canvas, 15);
      this.title_props = new text_properties(this, {}, 'title_');
      this.view_state = new ViewState({
        canvas_width: (_ref1 = options.canvas_width) != null ? _ref1 : this.mget('canvas_width'),
        canvas_height: (_ref2 = options.canvas_height) != null ? _ref2 : this.mget('canvas_height'),
        x_offset: (_ref3 = options.x_offset) != null ? _ref3 : this.mget('x_offset'),
        y_offset: (_ref4 = options.y_offset) != null ? _ref4 : this.mget('y_offset'),
        outer_width: (_ref5 = options.outer_width) != null ? _ref5 : this.mget('outer_width'),
        outer_height: (_ref6 = options.outer_height) != null ? _ref6 : this.mget('outer_height'),
        min_border_top: (_ref7 = (_ref8 = options.min_border_top) != null ? _ref8 : this.mget('min_border_top')) != null ? _ref7 : this.mget('min_border'),
        min_border_bottom: (_ref9 = (_ref10 = options.min_border_bottom) != null ? _ref10 : this.mget('min_border_bottom')) != null ? _ref9 : this.mget('min_border'),
        min_border_left: (_ref11 = (_ref12 = options.min_border_left) != null ? _ref12 : this.mget('min_border_left')) != null ? _ref11 : this.mget('min_border'),
        min_border_right: (_ref13 = (_ref14 = options.min_border_right) != null ? _ref14 : this.mget('min_border_right')) != null ? _ref13 : this.mget('min_border'),
        requested_border_top: 0,
        requested_border_bottom: 0,
        requested_border_left: 0,
        requested_border_right: 0
      });
      this.hidpi = (_ref15 = options.hidpi) != null ? _ref15 : this.mget('hidpi');
      this.x_range = (_ref16 = options.x_range) != null ? _ref16 : this.mget_obj('x_range');
      this.y_range = (_ref17 = options.y_range) != null ? _ref17 : this.mget_obj('y_range');
      this.xmapper = new LinearMapper({
        source_range: this.x_range,
        target_range: this.view_state.get('inner_range_horizontal')
      });
      this.ymapper = new LinearMapper({
        source_range: this.y_range,
        target_range: this.view_state.get('inner_range_vertical')
      });
      this.mapper = new GridMapper({
        domain_mapper: this.xmapper,
        codomain_mapper: this.ymapper
      });
      this.requested_padding = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };
      this.old_mapper_state = {
        x: null,
        y: null
      };
      this.am_rendering = false;
      this.renderers = {};
      this.tools = {};
      this.eventSink = _.extend({}, Backbone.Events);
      this.moveCallbacks = [];
      this.mousedownCallbacks = [];
      this.keydownCallbacks = [];
      this.render_init();
      this.render_canvas(false);
      this.atm = new ActiveToolManager(this.eventSink);
      this.levels = {};
      for (_i = 0, _len = LEVELS.length; _i < _len; _i++) {
        level = LEVELS[_i];
        this.levels[level] = {};
      }
      this.build_levels();
      this.request_render();
      this.atm.bind_bokeh_events();
      this.bind_bokeh_events();
      return this;
    };

    PlotView.prototype.map_to_screen = function(x, x_units, y, y_units, units) {
      var sx, sy, _ref1;
      if (x_units === 'screen') {
        sx = x.slice(0);
        sy = y.slice(0);
      } else {
        _ref1 = this.mapper.v_map_to_target(x, y), sx = _ref1[0], sy = _ref1[1];
      }
      sx = this.view_state.v_sx_to_device(sx);
      sy = this.view_state.v_sy_to_device(sy);
      return [sx, sy];
    };

    PlotView.prototype.map_from_screen = function(sx, sy, units) {
      var x, y, _ref1;
      sx = this.view_state.v_device_to_sx(sx.slice(0));
      sy = this.view_state.v_device_to_sy(sy.slice(0));
      if (units === 'screen') {
        x = sx;
        y = sy;
      } else {
        _ref1 = this.mapper.v_map_from_target(sx, sy), x = _ref1[0], y = _ref1[1];
      }
      return [x, y];
    };

    PlotView.prototype.update_range = function(range_info) {
      this.pause();
      this.x_range.set(range_info.xr);
      this.y_range.set(range_info.yr);
      return this.unpause();
    };

    PlotView.prototype.build_tools = function() {
      return build_views(this.tools, this.mget_obj('tools'), this.view_options());
    };

    PlotView.prototype.build_views = function() {
      return build_views(this.renderers, this.mget_obj('renderers'), this.view_options());
    };

    PlotView.prototype.build_levels = function() {
      var level, t, tools, v, views, _i, _j, _len, _len1;
      views = this.build_views();
      tools = this.build_tools();
      for (_i = 0, _len = views.length; _i < _len; _i++) {
        v = views[_i];
        level = v.mget('level');
        this.levels[level][v.model.id] = v;
        v.bind_bokeh_events();
      }
      for (_j = 0, _len1 = tools.length; _j < _len1; _j++) {
        t = tools[_j];
        level = t.mget('level');
        this.levels[level][t.model.id] = t;
        t.bind_bokeh_events();
      }
      return this;
    };

    PlotView.prototype.bind_bokeh_events = function() {
      var _this = this;
      safebind(this, this.view_state, 'change', function() {
        _this.request_render_canvas();
        return _this.request_render();
      });
      safebind(this, this.x_range, 'change', this.request_render);
      safebind(this, this.y_range, 'change', this.request_render);
      safebind(this, this.model, 'change:renderers', this.build_levels);
      safebind(this, this.model, 'change:tool', this.build_levels);
      safebind(this, this.model, 'change', this.request_render);
      return safebind(this, this.model, 'destroy', function() {
        return _this.remove();
      });
    };

    PlotView.prototype.render_init = function() {
      this.$el.append($("<div class='button_bar btn-group pull-top'/>\n<div class='plotarea'>\n<div class='bokeh_canvas_wrapper'>\n  <canvas class='bokeh_canvas'></canvas>\n</div>\n</div>"));
      this.button_bar = this.$el.find('.button_bar');
      this.canvas_wrapper = this.$el.find('.bokeh_canvas_wrapper');
      return this.canvas = this.$el.find('canvas.bokeh_canvas');
    };

    PlotView.prototype.render_canvas = function(full_render) {
      var backingStoreRatio, devicePixelRatio, oh, ow, ratio;
      if (full_render == null) {
        full_render = true;
      }
      this.ctx = this.canvas[0].getContext('2d');
      if (this.hidpi) {
        devicePixelRatio = window.devicePixelRatio || 1;
        backingStoreRatio = this.ctx.webkitBackingStorePixelRatio || this.ctx.mozBackingStorePixelRatio || this.ctx.msBackingStorePixelRatio || this.ctx.oBackingStorePixelRatio || this.ctx.backingStorePixelRatio || 1;
        ratio = devicePixelRatio / backingStoreRatio;
      } else {
        ratio = 1;
      }
      ow = this.view_state.get('outer_width');
      oh = this.view_state.get('outer_height');
      this.canvas.width = ow * ratio;
      this.canvas.height = oh * ratio;
      this.button_bar.attr('style', "width:" + ow + "px;");
      this.canvas_wrapper.attr('style', "width:" + ow + "px; height:" + oh + "px");
      this.canvas.attr('style', "width:" + ow + "px;");
      this.canvas.attr('style', "height:" + oh + "px;");
      this.canvas.attr('width', ow * ratio).attr('height', oh * ratio);
      this.$el.attr("width", ow).attr('height', oh);
      this.ctx.scale(ratio, ratio);
      this.ctx.translate(0.5, 0.5);
      if (full_render) {
        return this.render();
      }
    };

    PlotView.prototype.save_png = function() {
      var data_uri;
      this.render();
      data_uri = this.canvas[0].toDataURL();
      this.model.set('png', this.canvas[0].toDataURL());
      return base.Collections.bulksave([this.model]);
    };

    PlotView.prototype.render = function(force) {
      var have_new_mapper_state, hpadding, k, level, pr, renderers, sx, sy, sym, th, title, v, xms, yms, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _ref4;
      PlotView.__super__.render.call(this);
      this.requested_padding = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };
      _ref1 = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        level = _ref1[_i];
        renderers = this.levels[level];
        for (k in renderers) {
          v = renderers[k];
          if (v.padding_request != null) {
            pr = v.padding_request();
            for (k in pr) {
              v = pr[k];
              this.requested_padding[k] += v;
            }
          }
        }
      }
      title = this.mget('title');
      if (title) {
        this.title_props.set(this.ctx, {});
        th = this.ctx.measureText(this.mget('title')).ascent;
        this.requested_padding['top'] += th + this.mget('title_standoff');
      }
      sym = this.mget('border_symmetry');
      if (sym.indexOf('h') >= 0 || sym.indexOf('H') >= 0) {
        hpadding = Math.max(this.requested_padding['left'], this.requested_padding['right']);
        this.requested_padding['left'] = hpadding;
        this.requested_padding['right'] = hpadding;
      }
      if (sym.indexOf('v') >= 0 || sym.indexOf('V') >= 0) {
        hpadding = Math.max(this.requested_padding['top'], this.requested_padding['bottom']);
        this.requested_padding['top'] = hpadding;
        this.requested_padding['bottom'] = hpadding;
      }
      this.is_paused = true;
      _ref2 = this.requested_padding;
      for (k in _ref2) {
        v = _ref2[k];
        this.view_state.set("requested_border_" + k, v);
      }
      this.is_paused = false;
      this.ctx.fillStyle = this.mget('border_fill');
      this.ctx.fillRect(0, 0, this.view_state.get('canvas_width'), this.view_state.get('canvas_height'));
      this.ctx.fillStyle = this.mget('background_fill');
      this.ctx.fillRect(this.view_state.get('border_left'), this.view_state.get('border_top'), this.view_state.get('inner_width'), this.view_state.get('inner_height'));
      have_new_mapper_state = false;
      xms = this.xmapper.get('mapper_state')[0];
      yms = this.ymapper.get('mapper_state')[0];
      if (Math.abs(this.old_mapper_state.x - xms) > 1e-8 || Math.abs(this.old_mapper_state.y - yms) > 1e-8) {
        this.old_mapper_state.x = xms;
        this.old_mapper_state.y = yms;
        have_new_mapper_state = true;
      }
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(this.view_state.get('border_left'), this.view_state.get('border_top'), this.view_state.get('inner_width'), this.view_state.get('inner_height'));
      this.ctx.clip();
      this.ctx.beginPath();
      _ref3 = ['image', 'underlay', 'glyph'];
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        level = _ref3[_j];
        renderers = this.levels[level];
        for (k in renderers) {
          v = renderers[k];
          v.render(have_new_mapper_state);
        }
      }
      this.ctx.restore();
      _ref4 = ['overlay', 'annotation', 'tool'];
      for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
        level = _ref4[_k];
        renderers = this.levels[level];
        for (k in renderers) {
          v = renderers[k];
          v.render(have_new_mapper_state);
        }
      }
      if (title) {
        sx = this.view_state.get('outer_width') / 2;
        sy = th;
        this.title_props.set(this.ctx, {});
        return this.ctx.fillText(title, sx, sy);
      }
    };

    return PlotView;

  })(ContinuumView);

  PNGView = (function(_super) {
    __extends(PNGView, _super);

    function PNGView() {
      _ref1 = PNGView.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PNGView.prototype.initialize = function(options) {
      PNGView.__super__.initialize.call(this, options);
      this.thumb_x = options.thumb_x || 40;
      this.thumb_y = options.thumb_y || 40;
      this.render();
      return this;
    };

    PNGView.prototype.render = function() {
      var png;
      this.$el.html('');
      png = this.model.get('png');
      this.$el.append($("<p> " + (this.model.get('title')) + " </p>"));
      return this.$el.append($("<img  modeltype='" + this.model.type + "' modelid='" + (this.model.get('id')) + "' class='pngview' width='" + this.thumb_x + "'  height='" + this.thumb_y + "'  src='" + png + "'/>"));
    };

    return PNGView;

  })(ContinuumView);

  Plot = (function(_super) {
    __extends(Plot, _super);

    function Plot() {
      _ref2 = Plot.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    Plot.prototype.type = 'Plot';

    Plot.prototype.default_view = PlotView;

    Plot.prototype.add_renderers = function(new_renderers) {
      var renderers;
      renderers = this.get('renderers');
      renderers = renderers.concat(new_renderers);
      return this.set('renderers', renderers);
    };

    Plot.prototype.parent_properties = ['background_fill', 'border_fill', 'canvas_width', 'canvas_height', 'outer_width', 'outer_height', 'min_border', 'min_border_top', 'min_border_bottom', 'min_border_left', 'min_border_right'];

    return Plot;

  })(HasParent);

  Plot.prototype.defaults = _.clone(Plot.prototype.defaults);

  _.extend(Plot.prototype.defaults, {
    'data_sources': {},
    'renderers': [],
    'tools': [],
    'title': 'Plot'
  });

  Plot.prototype.display_defaults = _.clone(Plot.prototype.display_defaults);

  _.extend(Plot.prototype.display_defaults, {
    hidpi: true,
    background_fill: "#fff",
    border_fill: "#eee",
    border_symmetry: "h",
    min_border: 40,
    x_offset: 0,
    y_offset: 0,
    canvas_width: 300,
    canvas_height: 300,
    outer_width: 300,
    outer_height: 300,
    title_standoff: 8,
    title_text_font: "helvetica",
    title_text_font_size: "20pt",
    title_text_font_style: "normal",
    title_text_color: "#444444",
    title_text_alpha: 1.0,
    title_text_align: "center",
    title_text_baseline: "alphabetic"
  });

  Plots = (function(_super) {
    __extends(Plots, _super);

    function Plots() {
      _ref3 = Plots.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    Plots.prototype.model = Plot;

    return Plots;

  })(Backbone.Collection);

  exports.Plot = Plot;

  exports.PlotView = PlotView;

  exports.PNGView = PNGView;

  exports.plots = new Plots;

}).call(this);
}, "common/plot_context": function(exports, require, module) {(function() {
  var ContinuumView, HasParent, HasProperties, PNGContextView, PNGView, PlotContext, PlotContextView, PlotContextViewState, PlotContextViewWithMaximized, PlotContexts, PlotList, PlotLists, PlotView, base, build_views, safebind, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  PNGView = require("./plot").PNGView;

  PlotView = require("./plot").PlotView;

  HasParent = base.HasParent;

  HasProperties = base.HasProperties;

  safebind = base.safebind;

  build_views = base.build_views;

  ContinuumView = require('./continuum_view').ContinuumView;

  PlotContextView = (function(_super) {
    __extends(PlotContextView, _super);

    function PlotContextView() {
      this.removeplot = __bind(this.removeplot, this);
      this.closeall = __bind(this.closeall, this);
      _ref = PlotContextView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PlotContextView.prototype.initialize = function(options) {
      this.views = {};
      this.views_rendered = [false];
      this.child_models = [];
      PlotContextView.__super__.initialize.call(this, options);
      return this.render();
    };

    PlotContextView.prototype.delegateEvents = function() {
      safebind(this, this.model, 'destroy', this.remove);
      safebind(this, this.model, 'change', this.render);
      return PlotContextView.__super__.delegateEvents.call(this);
    };

    PlotContextView.prototype.build_children = function() {
      var created_views;
      created_views = build_views(this.views, this.mget_obj('children'), {});
      window.pc_created_views = created_views;
      window.pc_views = this.views;
      return null;
    };

    PlotContextView.prototype.events = {
      'click .plotclose': 'removeplot',
      'click .closeall': 'closeall'
    };

    PlotContextView.prototype.size_textarea = function(textarea) {
      var scrollHeight;
      scrollHeight = $(textarea).height(0).prop('scrollHeight');
      return $(textarea).height(scrollHeight);
    };

    PlotContextView.prototype.closeall = function(e) {
      this.mset('children', []);
      return this.model.save();
    };

    PlotContextView.prototype.removeplot = function(e) {
      var newchildren, plotnum, s_pc, view, x;
      plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'));
      s_pc = this.model.resolve_ref(this.mget('children')[plotnum]);
      view = this.views[s_pc.get('id')];
      view.remove();
      newchildren = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.mget('children');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          x = _ref1[_i];
          if (x.id !== view.model.id) {
            _results.push(x);
          }
        }
        return _results;
      }).call(this);
      this.mset('children', newchildren);
      this.model.save();
      return false;
    };

    PlotContextView.prototype.render = function() {
      var index, key, modelref, node, numplots, tab_names, to_render, val, view, _i, _len, _ref1, _ref2,
        _this = this;
      PlotContextView.__super__.render.call(this);
      this.build_children();
      _ref1 = this.views;
      for (key in _ref1) {
        if (!__hasProp.call(_ref1, key)) continue;
        val = _ref1[key];
        val.$el.detach();
      }
      this.$el.html('');
      numplots = _.keys(this.views).length;
      this.$el.append("<div>You have " + numplots + " plots</div>");
      this.$el.append("<div><a class='closeall' href='#'>Close All Plots</a></div>");
      this.$el.append("<br/>");
      to_render = [];
      tab_names = {};
      _ref2 = this.mget('children');
      for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
        modelref = _ref2[index];
        view = this.views[modelref.id];
        node = $("<div class='jsp' data-plot_num='" + index + "'></div>");
        this.$el.append(node);
        node.append($("<a class='plotclose'>[close]</a>"));
        node.append(view.el);
      }
      _.defer(function() {
        var textarea, _j, _len1, _ref3, _results;
        _ref3 = _this.$el.find('.plottitle');
        _results = [];
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          textarea = _ref3[_j];
          _results.push(_this.size_textarea($(textarea)));
        }
        return _results;
      });
      return null;
    };

    return PlotContextView;

  })(ContinuumView);

  PNGContextView = (function(_super) {
    __extends(PNGContextView, _super);

    function PNGContextView() {
      this.pngclick = __bind(this.pngclick, this);
      _ref1 = PNGContextView.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PNGContextView.prototype.initialize = function(options) {
      this.thumb_x = options.thumb_x;
      this.thumb_y = options.thumb_y;
      this.views = {};
      this.views_rendered = [false];
      this.child_models = [];
      PNGContextView.__super__.initialize.call(this, options);
      return this.render();
    };

    PNGContextView.prototype.pngclick = function(e) {
      var modelid, modeltype;
      modeltype = $(e.currentTarget).attr('modeltype');
      modelid = $(e.currentTarget).attr('modelid');
      return this.trigger('showplot', {
        type: modeltype,
        id: modelid
      });
    };

    PNGContextView.prototype.delegateEvents = function() {
      safebind(this, this.model, 'destroy', this.remove);
      safebind(this, this.model, 'change', this.render);
      return PNGContextView.__super__.delegateEvents.call(this);
    };

    PNGContextView.prototype.build_children = function() {
      var created_views, pv, view_classes, view_model, _i, _len, _ref2;
      view_classes = [];
      _ref2 = this.mget_obj('children');
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        view_model = _ref2[_i];
        if (!view_model.get('png')) {
          console.log("no png for " + view_model.id + " making one");
          pv = new view_model.default_view({
            model: view_model
          });
          pv.save_png();
        }
        view_classes.push(PNGView);
      }
      created_views = build_views(this.views, this.mget_obj('children'), {
        thumb_x: this.thumb_x,
        thumb_y: this.thumby
      }, view_classes);
      window.pc_created_views = created_views;
      window.pc_views = this.views;
      return null;
    };

    PNGContextView.prototype.events = {
      'click .plotclose': 'removeplot',
      'click .closeall': 'closeall',
      'click .pngview': 'pngclick'
    };

    return PNGContextView;

  })(PlotContextView);

  PlotContextViewState = (function(_super) {
    __extends(PlotContextViewState, _super);

    function PlotContextViewState() {
      _ref2 = PlotContextViewState.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    PlotContextViewState.prototype.defaults = {
      maxheight: 600,
      maxwidth: 600,
      selected: 0
    };

    return PlotContextViewState;

  })(HasProperties);

  PlotContextViewWithMaximized = (function(_super) {
    __extends(PlotContextViewWithMaximized, _super);

    function PlotContextViewWithMaximized() {
      _ref3 = PlotContextViewWithMaximized.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    PlotContextViewWithMaximized.prototype.initialize = function(options) {
      var _this = this;
      this.selected = 0;
      this.viewstate = new PlotContextViewState({
        maxheight: options.maxheight,
        maxwidth: options.maxwidth
      });
      PlotContextViewWithMaximized.__super__.initialize.call(this, options);
      safebind(this, this.viewstate, 'change', this.render);
      return safebind(this, this.model, 'change:children', function() {
        var selected;
        selected = _this.viewstate.get('selected');
        if (selected > _this.model.get('children') - 1) {
          return _this.viewstate.set('selected', 0);
        }
      });
    };

    PlotContextViewWithMaximized.prototype.events = {
      'click .maximize': 'maximize',
      'click .plotclose': 'removeplot',
      'click .closeall': 'closeall',
      'keydown .plottitle': 'savetitle'
    };

    PlotContextViewWithMaximized.prototype.maximize = function(e) {
      var plotnum;
      plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'));
      return this.viewstate.set('selected', plotnum);
    };

    PlotContextViewWithMaximized.prototype.render = function() {
      var index, key, main, model, modelref, node, tab_names, title, to_render, val, view, _i, _len, _ref4, _ref5,
        _this = this;
      PlotContextViewWithMaximized.__super__.render.call(this);
      this.build_children();
      _ref4 = this.views;
      for (key in _ref4) {
        if (!__hasProp.call(_ref4, key)) continue;
        val = _ref4[key];
        val.$el.detach();
      }
      this.$el.html('');
      main = $("<div class='plotsidebar'><div>");
      this.$el.append(main);
      this.$el.append("<div class='maxplot'>");
      main.append("<div><a class='closeall' href='#'>Close All Plots</a></div>");
      main.append("<br/>");
      to_render = [];
      tab_names = {};
      _ref5 = this.mget('children');
      for (index = _i = 0, _len = _ref5.length; _i < _len; index = ++_i) {
        modelref = _ref5[index];
        view = this.views[modelref.id];
        node = $("<div class='jsp' data-plot_num='" + index + "'></div>");
        main.append(node);
        title = view.model.get('title');
        node.append($("<textarea class='plottitle'>" + title + "</textarea>"));
        node.append($("<a class='maximize'>[max]</a>"));
        node.append($("<a class='plotclose'>[close]</a>"));
        node.append(view.el);
      }
      if (this.mget('children').length > 0) {
        modelref = this.mget('children')[this.viewstate.get('selected')];
        model = this.model.resolve_ref(modelref);
        this.maxview = new model.default_view({
          model: model
        });
        this.$el.find('.maxplot').append(this.maxview.$el);
      } else {
        this.maxview = null;
      }
      _.defer(function() {
        var height, heightratio, maxheight, maxwidth, newheight, newwidth, ratio, textarea, width, widthratio, _j, _len1, _ref6;
        _ref6 = main.find('.plottitle');
        for (_j = 0, _len1 = _ref6.length; _j < _len1; _j++) {
          textarea = _ref6[_j];
          _this.size_textarea($(textarea));
        }
        if (_this.maxview) {
          width = model.get('width');
          height = model.get('height');
          maxwidth = _this.viewstate.get('maxwidth');
          maxheight = _this.viewstate.get('maxheight');
          widthratio = maxwidth / width;
          heightratio = maxheight / height;
          ratio = _.min([widthratio, heightratio]);
          newwidth = ratio * width;
          newheight = ratio * height;
          _this.maxview.viewstate.set('height', newheight);
          return _this.maxview.viewstate.set('width', newwidth);
        }
      });
      return null;
    };

    return PlotContextViewWithMaximized;

  })(PlotContextView);

  PlotContext = (function(_super) {
    __extends(PlotContext, _super);

    function PlotContext() {
      _ref4 = PlotContext.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    PlotContext.prototype.type = 'PlotContext';

    PlotContext.prototype.default_view = PlotContextView;

    PlotContext.prototype.url = function() {
      return PlotContext.__super__.url.call(this);
    };

    PlotContext.prototype.defaults = {
      children: [],
      render_loop: true
    };

    return PlotContext;

  })(HasParent);

  PlotList = (function(_super) {
    __extends(PlotList, _super);

    function PlotList() {
      _ref5 = PlotList.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    PlotList.prototype.type = 'PlotList';

    return PlotList;

  })(PlotContext);

  PlotContexts = (function(_super) {
    __extends(PlotContexts, _super);

    function PlotContexts() {
      _ref6 = PlotContexts.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    PlotContexts.prototype.model = PlotContext;

    return PlotContexts;

  })(Backbone.Collection);

  PlotLists = (function(_super) {
    __extends(PlotLists, _super);

    function PlotLists() {
      _ref7 = PlotLists.__super__.constructor.apply(this, arguments);
      return _ref7;
    }

    PlotLists.prototype.model = PlotList;

    return PlotLists;

  })(PlotContexts);

  exports.PlotContext = PlotContext;

  exports.PlotContexts = PlotContexts;

  exports.PlotContextView = PlotContextView;

  exports.PlotContextViewState = PlotContextViewState;

  exports.PlotContextViewWithMaximized = PlotContextViewWithMaximized;

  exports.plotlists = new PlotLists();

  exports.plotcontexts = new PlotContexts();

  exports.PNGContextView = PNGContextView;

}).call(this);
}, "common/plot_widget": function(exports, require, module) {(function() {
  var ContinuumView, PlotWidget, base, safebind, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  safebind = base.safebind;

  ContinuumView = require("./continuum_view").ContinuumView;

  PlotWidget = (function(_super) {
    __extends(PlotWidget, _super);

    function PlotWidget() {
      _ref = PlotWidget.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PlotWidget.prototype.tagName = 'div';

    PlotWidget.prototype.initialize = function(options) {
      this.plot_model = options.plot_model;
      this.plot_view = options.plot_view;
      this._fixup_line_dash(this.plot_view.ctx);
      this._fixup_line_dash_offset(this.plot_view.ctx);
      this._fixup_image_smoothing(this.plot_view.ctx);
      this._fixup_measure_text(this.plot_view.ctx);
      return PlotWidget.__super__.initialize.call(this, options);
    };

    PlotWidget.prototype._fixup_line_dash = function(ctx) {
      if (!ctx.setLineDash) {
        ctx.setLineDash = function(dash) {
          ctx.mozDash = dash;
          return ctx.webkitLineDash = dash;
        };
      }
      if (!ctx.getLineDash) {
        return ctx.getLineDash = function() {
          return ctx.mozDash;
        };
      }
    };

    PlotWidget.prototype._fixup_line_dash_offset = function(ctx) {
      return ctx.setLineDashOffset = function(dash_offset) {
        ctx.lineDashOffset = dash_offset;
        ctx.mozDashOffset = dash_offset;
        return ctx.webkitLineDashOffset = dash_offset;
      };
    };

    PlotWidget.prototype._fixup_image_smoothing = function(ctx) {
      ctx.setImageSmoothingEnabled = function(value) {
        ctx.imageSmoothingEnabled = value;
        ctx.mozImageSmoothingEnabled = value;
        ctx.oImageSmoothingEnabled = value;
        return ctx.webkitImageSmoothingEnabled = value;
      };
      return ctx.getImageSmoothingEnabled = function() {
        var _ref1;
        return (_ref1 = ctx.imageSmoothingEnabled) != null ? _ref1 : true;
      };
    };

    PlotWidget.prototype._fixup_measure_text = function(ctx) {
      if (ctx.measureText && (ctx.html5MeasureText == null)) {
        ctx.html5MeasureText = ctx.measureText;
        return ctx.measureText = memoize(function(text) {
          var textMetrics;
          textMetrics = ctx.html5MeasureText(text);
          textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6;
          return textMetrics;
        });
      }
    };

    PlotWidget.prototype.bind_bokeh_events = function() {};

    PlotWidget.prototype.request_render = function() {
      return this.plot_view.request_render();
    };

    return PlotWidget;

  })(ContinuumView);

  exports.PlotWidget = PlotWidget;

}).call(this);
}, "common/random": function(exports, require, module) {(function() {
  var Rand;

  Rand = (function() {
    function Rand(seed) {
      this.seed = seed;
      this.multiplier = 1664525;
      this.modulo = 4294967296;
      this.offset = 1013904223;
      if (!((this.seed != null) && (0 <= seed && seed < this.modulo))) {
        this.seed = (new Date().valueOf() * new Date().getMilliseconds()) % this.modulo;
      }
    }

    Rand.prototype.seed = function(seed) {
      return this.seed = seed;
    };

    Rand.prototype.randn = function() {
      return this.seed = (this.multiplier * this.seed + this.offset) % this.modulo;
    };

    Rand.prototype.randf = function() {
      return this.randn() / this.modulo;
    };

    Rand.prototype.rand = function(n) {
      return Math.floor(this.randf() * n);
    };

    Rand.prototype.rand2 = function(min, max) {
      return min + this.rand(max - min);
    };

    return Rand;

  })();

  exports.Rand = Rand;

}).call(this);
}, "common/ranges": function(exports, require, module) {(function() {
  var DataFactorRange, DataFactorRanges, DataRange1d, DataRange1ds, FactorRange, FactorRanges, HasProperties, Range1d, Range1ds, base, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  base = require("../base");

  HasProperties = base.HasProperties;

  Range1d = (function(_super) {
    __extends(Range1d, _super);

    function Range1d() {
      _ref = Range1d.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Range1d.prototype.type = 'Range1d';

    Range1d.prototype.initialize = function(attrs, options) {
      Range1d.__super__.initialize.call(this, attrs, options);
      this.register_property('min', function() {
        return Math.min(this.get('start'), this.get('end'));
      }, true);
      this.add_dependencies('min', this, ['start', 'end']);
      this.register_property('max', function() {
        return Math.max(this.get('start'), this.get('end'));
      }, true);
      return this.add_dependencies('max', this, ['start', 'end']);
    };

    return Range1d;

  })(HasProperties);

  Range1d.prototype.defaults = _.clone(Range1d.prototype.defaults);

  _.extend(Range1d.prototype.defaults, {
    start: 0,
    end: 1
  });

  Range1ds = (function(_super) {
    __extends(Range1ds, _super);

    function Range1ds() {
      _ref1 = Range1ds.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Range1ds.prototype.model = Range1d;

    return Range1ds;

  })(Backbone.Collection);

  DataRange1d = (function(_super) {
    __extends(DataRange1d, _super);

    function DataRange1d() {
      _ref2 = DataRange1d.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    DataRange1d.prototype.type = 'DataRange1d';

    DataRange1d.prototype._get_minmax = function() {
      var center, colname, columns, i, max, maxs, min, mins, source, sourceobj, span, _i, _j, _k, _len, _len1, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      columns = [];
      _ref3 = this.get('sources');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        source = _ref3[_i];
        sourceobj = this.resolve_ref(source['ref']);
        _ref4 = source['columns'];
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          colname = _ref4[_j];
          columns.push(sourceobj.getcolumn(colname));
        }
      }
      columns = _.reduce(columns, (function(x, y) {
        return x.concat(y);
      }), []);
      columns = _.filter(columns, function(x) {
        return typeof x !== "string";
      });
      if (!_.isArray(columns[0])) {
        columns = _.reject(columns, function(x) {
          return isNaN(x);
        });
        _ref5 = [_.min(columns), _.max(columns)], min = _ref5[0], max = _ref5[1];
      } else {
        maxs = Array(columns.length);
        mins = Array(columns.length);
        for (i = _k = 0, _ref6 = columns.length - 1; 0 <= _ref6 ? _k <= _ref6 : _k >= _ref6; i = 0 <= _ref6 ? ++_k : --_k) {
          columns[i] = _.reject(columns[i], function(x) {
            return isNaN(x);
          });
          maxs[i] = _.max(columns[i]);
          mins[i] = _.min(columns[i]);
        }
        _ref7 = [_.min(mins), _.max(maxs)], min = _ref7[0], max = _ref7[1];
      }
      span = (max - min) * (1 + this.get('rangepadding'));
      center = (max + min) / 2.0;
      _ref8 = [center - span / 2.0, center + span / 2.0], min = _ref8[0], max = _ref8[1];
      return [min, max];
    };

    DataRange1d.prototype._get_start = function() {
      if (!_.isNullOrUndefined(this.get('_start'))) {
        return this.get('_start');
      } else {
        return this.get('minmax')[0];
      }
    };

    DataRange1d.prototype._set_start = function(start) {
      return this.set('_start', start);
    };

    DataRange1d.prototype._get_end = function() {
      if (!_.isNullOrUndefined(this.get('_end'))) {
        return this.get('_end');
      } else {
        return this.get('minmax')[1];
      }
    };

    DataRange1d.prototype._set_end = function(end) {
      return this.set('_end', end);
    };

    DataRange1d.prototype.dinitialize = function(attrs, options) {
      var source, _i, _len, _ref3;
      DataRange1d.__super__.dinitialize.call(this, attrs, options);
      this.register_property('minmax', this._get_minmax, true);
      this.add_dependencies('minmax', this, ['sources'], ['rangepadding']);
      _ref3 = this.get('sources');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        source = _ref3[_i];
        source = this.resolve_ref(source.ref);
        this.add_dependencies('minmax', source, 'data');
      }
      this.register_property('start', this._get_start, true);
      this.register_setter('start', this._set_start);
      this.add_dependencies('start', this, ['minmax', '_start']);
      this.register_property('end', this._get_end, true);
      this.register_setter('end', this._set_end);
      return this.add_dependencies('end', this, ['minmax', '_end']);
    };

    return DataRange1d;

  })(Range1d);

  DataRange1d.prototype.defaults = _.clone(DataRange1d.prototype.defaults);

  _.extend(DataRange1d.prototype.defaults, {
    sources: [],
    rangepadding: 0.1
  });

  DataRange1ds = (function(_super) {
    __extends(DataRange1ds, _super);

    function DataRange1ds() {
      _ref3 = DataRange1ds.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    DataRange1ds.prototype.model = DataRange1d;

    return DataRange1ds;

  })(Backbone.Collection);

  Range1ds = (function(_super) {
    __extends(Range1ds, _super);

    function Range1ds() {
      _ref4 = Range1ds.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    Range1ds.prototype.model = Range1d;

    return Range1ds;

  })(Backbone.Collection);

  FactorRange = (function(_super) {
    __extends(FactorRange, _super);

    function FactorRange() {
      _ref5 = FactorRange.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    FactorRange.prototype.type = 'FactorRange';

    return FactorRange;

  })(HasProperties);

  FactorRange.prototype.defaults = _.clone(FactorRange.prototype.defaults);

  _.extend(FactorRange.prototype.defaults, {
    values: []
  });

  DataFactorRange = (function(_super) {
    __extends(DataFactorRange, _super);

    function DataFactorRange() {
      this._get_values = __bind(this._get_values, this);
      _ref6 = DataFactorRange.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    DataFactorRange.prototype.type = 'DataFactorRange';

    DataFactorRange.prototype._get_values = function() {
      var columns, temp, uniques, val, x, _i, _len;
      columns = (function() {
        var _i, _len, _ref7, _results;
        _ref7 = this.get('columns');
        _results = [];
        for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
          x = _ref7[_i];
          _results.push(this.get_obj('data_source').getcolumn(x));
        }
        return _results;
      }).call(this);
      columns = _.reduce(columns, (function(x, y) {
        return x.concat(y);
      }), []);
      temp = {};
      for (_i = 0, _len = columns.length; _i < _len; _i++) {
        val = columns[_i];
        temp[val] = true;
      }
      uniques = _.keys(temp);
      uniques = _.sortBy(uniques, (function(x) {
        return x;
      }));
      return uniques;
    };

    DataFactorRange.prototype.dinitialize = function(attrs, options) {
      DataFactorRange.__super__.dinitialize.call(this, attrs, options);
      this.register_property;
      this.register_property('values', this._get_values, true);
      this.add_dependencies('values', this, ['data_source', 'columns']);
      return this.add_dependencies('values', this.get_obj('data_source'), ['data_source', 'columns']);
    };

    return DataFactorRange;

  })(FactorRange);

  DataFactorRange.prototype.defaults = _.clone(DataFactorRange.prototype.defaults);

  _.extend(DataFactorRange.prototype.defaults, {
    values: [],
    columns: [],
    data_source: null
  });

  DataFactorRanges = (function(_super) {
    __extends(DataFactorRanges, _super);

    function DataFactorRanges() {
      _ref7 = DataFactorRanges.__super__.constructor.apply(this, arguments);
      return _ref7;
    }

    DataFactorRanges.prototype.model = DataFactorRange;

    return DataFactorRanges;

  })(Backbone.Collection);

  FactorRanges = (function(_super) {
    __extends(FactorRanges, _super);

    function FactorRanges() {
      _ref8 = FactorRanges.__super__.constructor.apply(this, arguments);
      return _ref8;
    }

    FactorRanges.prototype.model = FactorRange;

    return FactorRanges;

  })(Backbone.Collection);

  exports.Range1d = Range1d;

  exports.range1ds = new Range1ds;

  exports.datarange1ds = new DataRange1ds;

  exports.datafactorranges = new DataFactorRanges;

}).call(this);
}, "common/svg_colors": function(exports, require, module) {(function() {
  var svg_colors;

  svg_colors = {
    indianred: "#CD5C5C",
    lightcoral: "#F08080",
    salmon: "#FA8072",
    darksalmon: "#E9967A",
    lightsalmon: "#FFA07A",
    crimson: "#DC143C",
    red: "#FF0000",
    firebrick: "#B22222",
    darkred: "#8B0000",
    pink: "#FFC0CB",
    lightpink: "#FFB6C1",
    hotpink: "#FF69B4",
    deeppink: "#FF1493",
    mediumvioletred: "#C71585",
    palevioletred: "#DB7093",
    lightsalmon: "#FFA07A",
    coral: "#FF7F50",
    tomato: "#FF6347",
    orangered: "#FF4500",
    darkorange: "#FF8C00",
    orange: "#FFA500",
    gold: "#FFD700",
    yellow: "#FFFF00",
    lightyellow: "#FFFFE0",
    lemonchiffon: "#FFFACD",
    lightgoldenrodyellow: "#FAFAD2",
    papayawhip: "#FFEFD5",
    moccasin: "#FFE4B5",
    peachpuff: "#FFDAB9",
    palegoldenrod: "#EEE8AA",
    khaki: "#F0E68C",
    darkkhaki: "#BDB76B",
    lavender: "#E6E6FA",
    thistle: "#D8BFD8",
    plum: "#DDA0DD",
    violet: "#EE82EE",
    orchid: "#DA70D6",
    fuchsia: "#FF00FF",
    magenta: "#FF00FF",
    mediumorchid: "#BA55D3",
    mediumpurple: "#9370DB",
    blueviolet: "#8A2BE2",
    darkviolet: "#9400D3",
    darkorchid: "#9932CC",
    darkmagenta: "#8B008B",
    purple: "#800080",
    indigo: "#4B0082",
    slateblue: "#6A5ACD",
    darkslateblue: "#483D8B",
    mediumslateblue: "#7B68EE",
    greenyellow: "#ADFF2F",
    chartreuse: "#7FFF00",
    lawngreen: "#7CFC00",
    lime: "#00FF00",
    limegreen: "#32CD32",
    palegreen: "#98FB98",
    lightgreen: "#90EE90",
    mediumspringgreen: "#00FA9A",
    springgreen: "#00FF7F",
    mediumseagreen: "#3CB371",
    seagreen: "#2E8B57",
    forestgreen: "#228B22",
    green: "#008000",
    darkgreen: "#006400",
    yellowgreen: "#9ACD32",
    olivedrab: "#6B8E23",
    olive: "#808000",
    darkolivegreen: "#556B2F",
    mediumaquamarine: "#66CDAA",
    darkseagreen: "#8FBC8F",
    lightseagreen: "#20B2AA",
    darkcyan: "#008B8B",
    teal: "#008080",
    aqua: "#00FFFF",
    cyan: "#00FFFF",
    lightcyan: "#E0FFFF",
    paleturquoise: "#AFEEEE",
    aquamarine: "#7FFFD4",
    turquoise: "#40E0D0",
    mediumturquoise: "#48D1CC",
    darkturquoise: "#00CED1",
    cadetblue: "#5F9EA0",
    steelblue: "#4682B4",
    lightsteelblue: "#B0C4DE",
    powderblue: "#B0E0E6",
    lightblue: "#ADD8E6",
    skyblue: "#87CEEB",
    lightskyblue: "#87CEFA",
    deepskyblue: "#00BFFF",
    dodgerblue: "#1E90FF",
    cornflowerblue: "#6495ED",
    mediumslateblue: "#7B68EE",
    royalblue: "#4169E1",
    blue: "#0000FF",
    mediumblue: "#0000CD",
    darkblue: "#00008B",
    navy: "#000080",
    midnightblue: "#191970",
    cornsilk: "#FFF8DC",
    blanchedalmond: "#FFEBCD",
    bisque: "#FFE4C4",
    navajowhite: "#FFDEAD",
    wheat: "#F5DEB3",
    burlywood: "#DEB887",
    tan: "#D2B48C",
    rosybrown: "#BC8F8F",
    sandybrown: "#F4A460",
    goldenrod: "#DAA520",
    darkgoldenrod: "#B8860B",
    peru: "#CD853F",
    chocolate: "#D2691E",
    saddlebrown: "#8B4513",
    sienna: "#A0522D",
    brown: "#A52A2A",
    maroon: "#800000",
    white: "#FFFFFF",
    snow: "#FFFAFA",
    honeydew: "#F0FFF0",
    mintcream: "#F5FFFA",
    azure: "#F0FFFF",
    aliceblue: "#F0F8FF",
    ghostwhite: "#F8F8FF",
    whitesmoke: "#F5F5F5",
    seashell: "#FFF5EE",
    beige: "#F5F5DC",
    oldlace: "#FDF5E6",
    floralwhite: "#FFFAF0",
    ivory: "#FFFFF0",
    antiquewhite: "#FAEBD7",
    linen: "#FAF0E6",
    lavenderblush: "#FFF0F5",
    mistyrose: "#FFE4E1",
    gainsboro: "#DCDCDC",
    lightgrey: "#D3D3D3",
    silver: "#C0C0C0",
    darkgray: "#A9A9A9",
    darkgrey: "#A9A9A9",
    gray: "#808080",
    grey: "#808080",
    dimgray: "#696969",
    dimgrey: "#696969",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    slategray: "#708090",
    darkslategray: "#2F4F4F",
    darkslategrey: "#2F4F4F",
    black: "#000000"
  };

  exports.svg_colors = svg_colors;

}).call(this);
}, "common/textutils": function(exports, require, module) {(function() {
  var cache, getTextHeight;

  cache = {};

  getTextHeight = function(font) {
    var block, body, div, result, text;
    if (cache[font] != null) {
      return cache[font];
    }
    text = $('<span>Hg</span>').css({
      font: font
    });
    block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');
    div = $('<div></div>');
    div.append(text, block);
    body = $('body');
    body.append(div);
    try {
      result = {};
      block.css({
        verticalAlign: 'baseline'
      });
      result.ascent = block.offset().top - text.offset().top;
      block.css({
        verticalAlign: 'bottom'
      });
      result.height = block.offset().top - text.offset().top;
      result.descent = result.height - result.ascent;
    } finally {
      div.remove();
    }
    cache[font] = result;
    return result;
  };

  exports.getTextHeight = getTextHeight;

}).call(this);
}, "common/ticking": function(exports, require, module) {(function() {
  var BasicTickFormatter, DatetimeFormatter, arange, argsort, arr_div2, arr_div3, auto_interval, auto_interval_temp, auto_ticks, float, heckbert_interval, is_base2, log10, log2, nice_10, nice_2_5_10, sprintf, tz, _array, _four_digit_year, _ms_dot_us, _strftime, _two_digit_year, _us;

  sprintf = window.sprintf;

  tz = window.tz;

  log10 = function(num) {
    "Returns the base 10 logarithm of a number.";
    if (num === 0.0) {
      num += 1.0e-16;
    }
    return Math.log(num) / Math.LN10;
  };

  log2 = function(num) {
    "Returns the base 2 logarithm of a number.";
    if (num === 0.0) {
      num += 1.0e-16;
    }
    return Math.log(num) / Math.LN2;
  };

  is_base2 = function(rng) {
    " Returns True if rng is a positive multiple of 2 ";
    var lg;
    if (rng <= 0) {
      return false;
    } else {
      lg = log2(rng);
      return (lg > 0.0) && (lg === Math.floor(lg));
    }
  };

  nice_2_5_10 = function(x, round) {
    var expv, f, nf;
    if (round == null) {
      round = false;
    }
    " if round is false, then use Math.ceil(range) ";
    expv = Math.floor(log10(x));
    f = x / Math.pow(10.0, expv);
    if (round) {
      if (f < 1.5) {
        nf = 1.0;
      } else if (f < 3.0) {
        nf = 2.0;
      } else if (f < 7.5) {
        nf = 5.0;
      } else {
        nf = 10.0;
      }
    } else {
      if (f <= 1.0) {
        nf = 1.0;
      } else if (f <= 2.0) {
        nf = 2.0;
      } else if (f <= 5.0) {
        nf = 5.0;
      } else {
        nf = 10.0;
      }
    }
    return nf * Math.pow(10, expv);
  };

  nice_10 = function(x, round) {
    var expv;
    if (round == null) {
      round = false;
    }
    expv = Math.floor(log10(x * 1.0001));
    return Math.pow(10.0, expv);
  };

  heckbert_interval = function(min, max, numticks, nice, loose) {
    var d, graphmax, graphmin, range;
    if (numticks == null) {
      numticks = 8;
    }
    if (nice == null) {
      nice = nice_2_5_10;
    }
    if (loose == null) {
      loose = false;
    }
    "Returns a \"nice\" range and interval for a given data range and a preferred\nnumber of ticks.  From Paul Heckbert's algorithm in Graphics Gems.";
    range = nice(max - min);
    d = nice(range / (numticks - 1), true);
    if (loose) {
      graphmin = Math.floor(min / d) * d;
      graphmax = Math.ceil(max / d) * d;
    } else {
      graphmin = Math.ceil(min / d) * d;
      graphmax = Math.floor(max / d) * d;
    }
    return [graphmin, graphmax, d];
  };

  arange = function(start, end, step) {
    var i, ret_arr;
    if (end == null) {
      end = false;
    }
    if (step == null) {
      step = false;
    }
    if (!end) {
      end = start;
      start = 0;
    }
    if (start > end) {
      if (step === false) {
        step = -1;
      } else if (step > 0) {
        "the loop will never terminate";
        1 / 0;
      }
    } else if (step < 0) {
      "the loop will never terminate";
      1 / 0;
    }
    if (!step) {
      step = 1;
    }
    ret_arr = [];
    i = start;
    if (start < end) {
      while (i < end) {
        ret_arr.push(i);
        i += step;
      }
    } else {
      while (i > end) {
        ret_arr.push(i);
        i += step;
      }
    }
    return ret_arr;
  };

  auto_ticks = function(data_low, data_high, bound_low, bound_high, tick_interval, use_endpoints, zero_always_nice) {
    var auto_lower, auto_upper, delta, end, i, intervals, is_auto_high, is_auto_low, lower, rng, start, tick, ticks, upper, _i, _ref, _ref1;
    if (use_endpoints == null) {
      use_endpoints = false;
    }
    if (zero_always_nice == null) {
      zero_always_nice = true;
    }
    " Finds locations for axis tick marks.\n\nCalculates the locations for tick marks on an axis. The *bound_low*,\n*bound_high*, and *tick_interval* parameters specify how the axis end\npoints and tick interval are calculated.\n\nParameters\n----------\n\ndata_low, data_high : number\n    The minimum and maximum values of the data along this axis.\n    If any of the bound settings are 'auto' or 'fit', the axis\n    bounds are calculated automatically from these values.\nbound_low, bound_high : 'auto', 'fit', or a number.\n    The lower and upper bounds of the axis. If the value is a number,\n    that value is used for the corresponding end point. If the value is\n    'auto', then the end point is calculated automatically. If the\n    value is 'fit', then the axis bound is set to the corresponding\n    *data_low* or *data_high* value.\ntick_interval : can be 'auto' or a number\n    If the value is a positive number, it specifies the length\n    of the tick interval; a negative integer specifies the\n    number of tick intervals; 'auto' specifies that the number and\n    length of the tick intervals are automatically calculated, based\n    on the range of the axis.\nuse_endpoints : Boolean\n    If True, the lower and upper bounds of the data are used as the\n    lower and upper end points of the axis. If False, the end points\n    might not fall exactly on the bounds.\nzero_always_nice : Boolean\n    If True, ticks much closer to zero than the tick interval will be\n    coerced to have a value of zero\n\nReturns\n-------\nAn array of tick mark locations. The first and last tick entries are the\naxis end points.";
    is_auto_low = bound_low === 'auto';
    is_auto_high = bound_high === 'auto';
    if (typeof bound_low === "string") {
      lower = data_low;
    } else {
      lower = bound_low;
    }
    if (typeof bound_high === "string") {
      upper = data_high;
    } else {
      upper = bound_high;
    }
    if ((tick_interval === 'auto') || (tick_interval === 0.0)) {
      rng = Math.abs(upper - lower);
      if (rng === 0.0) {
        tick_interval = 0.5;
        lower = data_low - 0.5;
        upper = data_high + 0.5;
      } else if (is_base2(rng) && is_base2(upper) && rng > 4) {
        if (rng === 2) {
          tick_interval = 1;
        } else if (rng === 4) {
          tick_interval = 4;
        } else {
          tick_interval = rng / 4;
        }
      } else {
        tick_interval = auto_interval(lower, upper);
      }
    } else if (tick_interval < 0) {
      intervals = -tick_interval;
      tick_interval = tick_intervals(lower, upper, intervals);
      if (is_auto_low && is_auto_high) {
        is_auto_low = is_auto_high = false;
        lower = tick_interval * Math.floor(lower / tick_interval);
        while ((Math.abs(lower) >= tick_interval) && ((lower + tick_interval * (intervals - 1)) >= upper)) {
          lower -= tick_interval;
        }
        upper = lower + tick_interval * intervals;
      }
    }
    if (is_auto_low || is_auto_high) {
      delta = 0.01 * tick_interval * (data_low === data_high);
      _ref = auto_bounds(data_low - delta, data_high + delta, tick_interval), auto_lower = _ref[0], auto_upper = _ref[1];
      if (is_auto_low) {
        lower = auto_lower;
      }
      if (is_auto_high) {
        upper = auto_upper;
      }
    }
    start = Math.floor(lower / tick_interval) * tick_interval;
    end = Math.floor(upper / tick_interval) * tick_interval;
    if (start === end) {
      lower = start = start - tick_interval;
      upper = end = start - tick_interval;
    }
    if (upper > end) {
      end += tick_interval;
    }
    ticks = arange(start, end + (tick_interval / 2.0), tick_interval);
    if (zero_always_nice) {
      for (i = _i = 0, _ref1 = ticks.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (Math.abs(ticks[i]) < tick_interval / 1000) {
          ticks[i] = 0;
        }
      }
    }
    if ((!is_auto_low) && use_endpoints) {
      ticks[0] = lower;
    }
    if ((!is_auto_high) && use_endpoints) {
      ticks[ticks.length - 1] = upper;
    }
    return (function() {
      var _j, _len, _results;
      _results = [];
      for (_j = 0, _len = ticks.length; _j < _len; _j++) {
        tick = ticks[_j];
        if (tick >= bound_low && tick <= bound_high) {
          _results.push(tick);
        }
      }
      return _results;
    })();
  };

  arr_div2 = function(numerator, denominators) {
    var output_arr, val, _i, _len;
    output_arr = [];
    for (_i = 0, _len = denominators.length; _i < _len; _i++) {
      val = denominators[_i];
      output_arr.push(numerator / val);
    }
    return output_arr;
  };

  arr_div3 = function(numerators, denominators) {
    var i, output_arr, val, _i, _len;
    output_arr = [];
    for (i = _i = 0, _len = denominators.length; _i < _len; i = ++_i) {
      val = denominators[i];
      output_arr.push(numerators[i] / val);
    }
    return output_arr;
  };

  argsort = function(arr) {
    var i, ret_arr, sorted_arr, y, _i, _len;
    sorted_arr = _.sortBy(arr, _.identity);
    ret_arr = [];
    for (i = _i = 0, _len = sorted_arr.length; _i < _len; i = ++_i) {
      y = sorted_arr[i];
      ret_arr[i] = arr.indexOf(y);
    }
    return ret_arr;
  };

  float = function(x) {
    return x + 0.0;
  };

  auto_interval_temp = function(data_low, data_high) {
    " Calculates the tick interval for a range.\n\nThe boundaries for the data to be plotted on the axis are::\n\n    data_bounds = (data_low,data_high)\n\nThe function chooses the number of tick marks, which can be between\n3 and 9 marks (including end points), and chooses tick intervals at\n1, 2, 2.5, 5, 10, 20, ...\n\nReturns\n-------\ninterval : float\n    tick mark interval for axis";
    var best_magics, best_mantissas, candidate_intervals, diff_arr, divisions, interval, ma, magic_index, magic_intervals, magnitude, magnitudes, mantissa_index, mantissas, mi, range, result, _i, _j, _len, _len1;
    range = float(data_high) - float(data_low);
    divisions = [8.0, 7.0, 6.0, 5.0, 4.0, 3.0];
    candidate_intervals = arr_div2(range, divisions);
    magnitudes = candidate_intervals.map(function(candidate) {
      return Math.pow(10.0, Math.floor(log10(candidate)));
    });
    mantissas = arr_div3(candidate_intervals, magnitudes);
    magic_intervals = [1.0, 2.0, 2.5, 5.0, 10.0];
    best_mantissas = [];
    best_magics = [];
    for (_i = 0, _len = magic_intervals.length; _i < _len; _i++) {
      mi = magic_intervals[_i];
      diff_arr = mantissas.map(function(x) {
        return Math.abs(mi - x);
      });
      best_magics.push(_.min(diff_arr));
    }
    for (_j = 0, _len1 = mantissas.length; _j < _len1; _j++) {
      ma = mantissas[_j];
      diff_arr = magic_intervals.map(function(x) {
        return Math.abs(ma - x);
      });
      best_mantissas.push(_.min(diff_arr));
    }
    magic_index = argsort(best_magics)[0];
    mantissa_index = argsort(best_mantissas)[0];
    interval = magic_intervals[magic_index];
    magnitude = magnitudes[mantissa_index];
    result = interval * magnitude;
    return result;
  };

  auto_interval = memoize(auto_interval_temp);

  BasicTickFormatter = (function() {
    function BasicTickFormatter(precision, use_scientific, power_limit_high, power_limit_low) {
      this.precision = precision != null ? precision : 'auto';
      this.use_scientific = use_scientific != null ? use_scientific : true;
      this.power_limit_high = power_limit_high != null ? power_limit_high : 5;
      this.power_limit_low = power_limit_low != null ? power_limit_low : -3;
      this.scientific_limit_low = Math.pow(10.0, power_limit_low);
      this.scientific_limit_high = Math.pow(10.0, power_limit_high);
      this.last_precision = 3;
    }

    BasicTickFormatter.prototype.format = function(ticks) {
      var i, is_ok, labels, need_sci, tick, tick_abs, x, zero_eps, _i, _j, _k, _l, _len, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4;
      if (ticks.length === 0) {
        return [];
      }
      zero_eps = 0;
      if (ticks.length >= 2) {
        zero_eps = Math.abs(ticks[1] - ticks[0]) / 10000;
      }
      need_sci = false;
      if (this.use_scientific) {
        for (_i = 0, _len = ticks.length; _i < _len; _i++) {
          tick = ticks[_i];
          tick_abs = Math.abs(tick);
          if (tick_abs > zero_eps && (tick_abs >= this.scientific_limit_high || tick_abs <= this.scientific_limit_low)) {
            need_sci = true;
            break;
          }
        }
      }
      if (_.isNumber(this.precision)) {
        labels = new Array(ticks.length);
        if (need_sci) {
          for (i = _j = 0, _ref = ticks.length - 1; 0 <= _ref ? _j <= _ref : _j >= _ref; i = 0 <= _ref ? ++_j : --_j) {
            labels[i] = ticks[i].toExponential(this.precision);
          }
        } else {
          for (i = _k = 0, _ref1 = ticks.length - 1; 0 <= _ref1 ? _k <= _ref1 : _k >= _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
            labels[i] = ticks[i].toPrecision(this.precision).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
          }
        }
        return labels;
      } else if (this.precision === 'auto') {
        labels = new Array(ticks.length);
        for (x = _l = _ref2 = this.last_precision; _ref2 <= 15 ? _l <= 15 : _l >= 15; x = _ref2 <= 15 ? ++_l : --_l) {
          is_ok = true;
          if (need_sci) {
            for (i = _m = 0, _ref3 = ticks.length - 1; 0 <= _ref3 ? _m <= _ref3 : _m >= _ref3; i = 0 <= _ref3 ? ++_m : --_m) {
              labels[i] = ticks[i].toExponential(x);
              if (i > 0) {
                if (labels[i] === labels[i - 1]) {
                  is_ok = false;
                  break;
                }
              }
            }
            if (is_ok) {
              break;
            }
          } else {
            for (i = _n = 0, _ref4 = ticks.length - 1; 0 <= _ref4 ? _n <= _ref4 : _n >= _ref4; i = 0 <= _ref4 ? ++_n : --_n) {
              labels[i] = ticks[i].toPrecision(x).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
              if (i > 0) {
                if (labels[i] === labels[i - 1]) {
                  is_ok = false;
                  break;
                }
              }
            }
            if (is_ok) {
              break;
            }
          }
          if (is_ok) {
            this.last_precision = x;
            return labels;
          }
        }
      }
      return labels;
    };

    return BasicTickFormatter;

  })();

  _us = function(t) {
    return sprintf("%3dus", Math.floor((t % 1) * 1000));
  };

  _ms_dot_us = function(t) {
    var ms, us;
    ms = Math.floor(((t / 1000) % 1) * 1000);
    us = Math.floor((t % 1) * 1000);
    return sprintf("%3d.%3dms", ms, us);
  };

  _two_digit_year = function(t) {
    var dt, year;
    dt = new Date(t);
    year = dt.getFullYear();
    if (dt.getMonth() >= 7) {
      year += 1;
    }
    return sprintf("'%02d", year % 100);
  };

  _four_digit_year = function(t) {
    var dt, year;
    dt = new Date(t);
    year = dt.getFullYear();
    if (dt.getMonth() >= 7) {
      year += 1;
    }
    return sprintf("%d", year);
  };

  _array = function(t) {
    return tz(t, "%Y %m %d %H %M %S").split(/\s+/).map(function(e) {
      return parseInt(e, 10);
    });
  };

  _strftime = function(t, format) {
    if (_.isFunction(format)) {
      return format(t);
    } else {
      return tz(t, format);
    }
  };

  DatetimeFormatter = (function() {
    DatetimeFormatter.prototype.format_order = ['microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years'];

    DatetimeFormatter.prototype.strip_leading_zeros = true;

    function DatetimeFormatter() {
      var fmt, fmt_name, fmt_strings, size, sizes, tmptime, _i, _len;
      this._formats = {
        'microseconds': [_us, _ms_dot_us],
        'milliseconds': ['%3Nms', '%S.%3Ns'],
        'seconds': [':%S', '%Ss'],
        'minsec': ['%M:%S'],
        'minutes': ['%Mm'],
        'hourmin': ['%H:%M'],
        'hours': ['%Hh', '%H:%M'],
        'days': ['%m/%d', '%a%d'],
        'months': ['%m/%Y', '%b%y'],
        'years': ['%Y', _two_digit_year, _four_digit_year]
      };
      this.formats = {};
      for (fmt_name in this._formats) {
        fmt_strings = this._formats[fmt_name];
        sizes = [];
        tmptime = tz(new Date());
        for (_i = 0, _len = fmt_strings.length; _i < _len; _i++) {
          fmt = fmt_strings[_i];
          size = (_strftime(tmptime, fmt)).length;
          sizes.push(size);
        }
        this.formats[fmt_name] = [sizes, fmt_strings];
      }
      return;
    }

    DatetimeFormatter.prototype._get_resolution = function(resolution, interval) {
      var r, resol, span;
      r = resolution;
      span = interval;
      if (r < 5e-4) {
        resol = "microseconds";
      } else if (r < 0.5) {
        resol = "milliseconds";
      } else if (r < 60) {
        if (span > 60) {
          resol = "minsec";
        } else {
          resol = "seconds";
        }
      } else if (r < 3600) {
        if (span > 3600) {
          resol = "hourmin";
        } else {
          resol = "minutes";
        }
      } else if (r < 24 * 3600) {
        resol = "hours";
      } else if (r < 30 * 24 * 3600) {
        resol = "days";
      } else if (r < 365 * 24 * 3600) {
        resol = "months";
      } else {
        resol = "years";
      }
      return resol;
    };

    DatetimeFormatter.prototype.format = function(ticks, num_labels, char_width, fill_ratio, ticker) {
      var dt, error, fmt, format, formats, good_formats, hybrid_handled, i, labels, next_format, next_ndx, r, resol, resol_ndx, s, span, ss, t, time_tuple_ndx_for_resol, tm, widths, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2;
      if (num_labels == null) {
        num_labels = null;
      }
      if (char_width == null) {
        char_width = null;
      }
      if (fill_ratio == null) {
        fill_ratio = 0.3;
      }
      if (ticker == null) {
        ticker = null;
      }
      if (ticks.length === 0) {
        return [];
      }
      span = Math.abs(ticks[ticks.length - 1] - ticks[0]) / 1000.0;
      if (ticker) {
        r = ticker.resolution;
      } else {
        r = span / (ticks.length - 1);
      }
      resol = this._get_resolution(r, span);
      _ref = this.formats[resol], widths = _ref[0], formats = _ref[1];
      format = formats[0];
      if (char_width) {
        good_formats = [];
        for (i = _i = 0, _ref1 = widths.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (widths[i] * ticks.length < fill_ratio * char_width) {
            good_formats.push(this.formats[i]);
          }
        }
        if (good_formats.length > 0) {
          format = good_formats[ticks.length - 1];
        }
      }
      labels = [];
      resol_ndx = this.format_order.indexOf(resol);
      time_tuple_ndx_for_resol = {};
      _ref2 = this.format_order;
      for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
        fmt = _ref2[_j];
        time_tuple_ndx_for_resol[fmt] = 0;
      }
      time_tuple_ndx_for_resol["seconds"] = 5;
      time_tuple_ndx_for_resol["minsec"] = 4;
      time_tuple_ndx_for_resol["minutes"] = 4;
      time_tuple_ndx_for_resol["hourmin"] = 3;
      time_tuple_ndx_for_resol["hours"] = 3;
      for (_k = 0, _len1 = ticks.length; _k < _len1; _k++) {
        t = ticks[_k];
        try {
          dt = Date(t);
          tm = _array(t);
          s = _strftime(t, format);
        } catch (_error) {
          error = _error;
          console.log(error);
          console.log("Unable to convert tick for timestamp " + t);
          labels.push("ERR");
          continue;
        }
        hybrid_handled = false;
        next_ndx = resol_ndx;
        while (tm[time_tuple_ndx_for_resol[this.format_order[next_ndx]]] === 0) {
          next_ndx += 1;
          if (next_ndx === this.format_order.length) {
            break;
          }
          if ((resol === "minsec" || resol === "hourmin") && !hybrid_handled) {
            if ((resol === "minsec" && tm[4] === 0 && tm[5] !== 0) || (resol === "hourmin" && tm[3] === 0 && tm[4] !== 0)) {
              next_format = this.formats[this.format_order[resol_ndx - 1]][1][0];
              s = _strftime(t, next_format);
              break;
            } else {
              hybrid_handled = true;
            }
          }
          next_format = this.formats[this.format_order[next_ndx]][1][0];
          s = _strftime(t, next_format);
        }
        if (this.strip_leading_zeros) {
          ss = s.replace(/^0+/g, "");
          if (ss !== s && (ss === '' || !isFinite(ss[0]))) {
            ss = '0' + ss;
          }
          labels.push(ss);
        } else {
          labels.push(s);
        }
      }
      return labels;
    };

    return DatetimeFormatter;

  })();

  exports.nice_2_5_10 = nice_2_5_10;

  exports.nice_10 = nice_10;

  exports.heckbert_interval = heckbert_interval;

  exports.auto_ticks = auto_ticks;

  exports.auto_interval = auto_interval;

  exports.BasicTickFormatter = BasicTickFormatter;

  exports.DatetimeFormatter = DatetimeFormatter;

}).call(this);
}, "common/view_state": function(exports, require, module) {(function() {
  var Collections, HasProperties, Range1d, ViewState, base, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Range1d = require('../common/ranges').Range1d;

  Collections = base.Collections;

  HasProperties = base.HasProperties;

  ViewState = (function(_super) {
    __extends(ViewState, _super);

    function ViewState() {
      _ref = ViewState.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ViewState.prototype.initialize = function(attrs, options) {
      var _inner_range_horizontal, _inner_range_vertical;
      ViewState.__super__.initialize.call(this, attrs, options);
      this.register_property('border_top', function() {
        return Math.max(this.get('min_border_top'), this.get('requested_border_top'));
      }, false);
      this.add_dependencies('border_top', this, ['min_border_top', 'requested_border_top']);
      this.register_property('border_bottom', function() {
        return Math.max(this.get('min_border_bottom'), this.get('requested_border_bottom'));
      }, false);
      this.add_dependencies('border_bottom', this, ['min_border_bottom', 'requested_border_bottom']);
      this.register_property('border_left', function() {
        return Math.max(this.get('min_border_left'), this.get('requested_border_left'));
      }, false);
      this.add_dependencies('border_left', this, ['min_border_left', 'requested_border_left']);
      this.register_property('border_right', function() {
        return Math.max(this.get('min_border_right'), this.get('requested_border_right'));
      }, false);
      this.add_dependencies('border_right', this, ['min_border_right', 'requested_border_right']);
      this.register_property('canvas_aspect', function() {
        return this.get('canvas_height') / this.get('canvas_width');
      }, true);
      this.add_dependencies('canvas_aspect', this, ['canvas_height', 'canvas_width']);
      this.register_property('outer_aspect', function() {
        return this.get('outer_height') / this.get('outer_width');
      }, true);
      this.add_dependencies('outer_aspect', this, ['outer_height', 'outer_width']);
      this.register_property('inner_width', function() {
        return this.get('outer_width') - this.get('border_left') - this.get('border_right');
      }, true);
      this.add_dependencies('inner_width', this, ['outer_width', 'border_left', 'border_right']);
      this.register_property('inner_height', function() {
        return this.get('outer_height') - this.get('border_top') - this.get('border_bottom');
      }, true);
      this.add_dependencies('inner_height', this, ['outer_height', 'border_top', 'border_bottom']);
      this.register_property('inner_aspect', function() {
        return this.get('inner_height') / this.get('inner_width');
      }, true);
      this.add_dependencies('inner_aspect', this, ['inner_height', 'inner_width']);
      _inner_range_horizontal = new Range1d({
        start: this.get('border_left'),
        end: this.get('border_left') + this.get('inner_width')
      });
      this.register_property('inner_range_horizontal', function() {
        _inner_range_horizontal.set('start', this.get('border_left'));
        _inner_range_horizontal.set('end', this.get('border_left') + this.get('inner_width'));
        return _inner_range_horizontal;
      }, true);
      this.add_dependencies('inner_range_horizontal', this, ['border_left', 'inner_width']);
      _inner_range_vertical = new Range1d({
        start: this.get('border_bottom'),
        end: this.get('border_bottom') + this.get('inner_height')
      });
      this.register_property('inner_range_vertical', function() {
        _inner_range_vertical.set('start', this.get('border_bottom'));
        _inner_range_vertical.set('end', this.get('border_bottom') + this.get('inner_height'));
        return _inner_range_vertical;
      }, true);
      return this.add_dependencies('inner_range_vertical', this, ['border_bottom', 'inner_height']);
    };

    ViewState.prototype.sx_to_device = function(x) {
      return x;
    };

    ViewState.prototype.sy_to_device = function(y) {
      return this.get('canvas_height') - y;
    };

    ViewState.prototype.v_sx_to_device = function(xx) {
      var idx, x, _i, _len;
      for (idx = _i = 0, _len = xx.length; _i < _len; idx = ++_i) {
        x = xx[idx];
        xx[idx] = x;
      }
      return xx;
    };

    ViewState.prototype.v_sy_to_device = function(yy) {
      var canvas_height, idx, y, _i, _len;
      canvas_height = this.get('canvas_height');
      for (idx = _i = 0, _len = yy.length; _i < _len; idx = ++_i) {
        y = yy[idx];
        yy[idx] = canvas_height - y;
      }
      return yy;
    };

    ViewState.prototype.device_to_sx = function(x) {
      return x;
    };

    ViewState.prototype.device_to_sy = function(y) {
      return this.get('canvas_height') - y;
    };

    ViewState.prototype.v_device_to_sx = function(xx) {
      var idx, x, _i, _len;
      for (idx = _i = 0, _len = xx.length; _i < _len; idx = ++_i) {
        x = xx[idx];
        xx[idx] = x;
      }
      return xx;
    };

    ViewState.prototype.v_device_to_sy = function(yy) {
      var canvas_height, idx, y, _i, _len;
      canvas_height = this.get('canvas_height');
      for (idx = _i = 0, _len = yy.length; _i < _len; idx = ++_i) {
        y = yy[idx];
        yy[idx] = y - canvas_height;
      }
      return yy;
    };

    return ViewState;

  })(HasProperties);

  exports.ViewState = ViewState;

}).call(this);
}, "mappers/1d/categorical_mapper": function(exports, require, module) {(function() {
  var CategoricalMapper, HasProperties, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  CategoricalMapper = (function(_super) {
    __extends(CategoricalMapper, _super);

    function CategoricalMapper() {
      _ref = CategoricalMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CategoricalMapper.prototype.initialize = function(attrs, options) {
      CategoricalMapper.__super__.initialize.call(this, attrs, options);
      this.register_property('mapper_state', this._scale, true);
      this.add_dependencies('mapper_state', this.get('source_range'), this.target_range);
      this.add_dependencies('mapper_state', this.get('source_range'), 'values');
      return this.add_dependencies('mapper_state', this.get('target_range'), ['start', 'end']);
    };

    CategoricalMapper.prototype.map_to_target = function(x) {
      var offset, scale_factor, values, _ref1;
      _ref1 = this.get('mapper_state'), scale_factor = _ref1[0], offset = _ref1[1];
      values = this.get('source_range').get('values');
      return scale * _.indexOf(values, x) + offset;
    };

    CategoricalMapper.prototype.v_map_to_target = function(xs) {
      var idx, offset, result, scale, values, x, _i, _len, _ref1;
      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      values = this.get('source_range').get('values');
      result = new Float32Array(xs.length);
      for (idx = _i = 0, _len = xs.length; _i < _len; idx = ++_i) {
        x = xs[idx];
        result[idx] = scale * _.indexOf(values, x) + offset;
      }
      return result;
    };

    CategoricalMapper.prototype.map_from_target = function(xprime) {
      var offset, scale, values, _ref1;
      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      values = this.get('source_range').get('values');
      return values[Math.trunc((xprime + offset) / scale)];
    };

    CategoricalMapper.prototype.v_map_from_target = function(xprimes) {
      var idx, offset, result, scale, values, xprime, _i, _len, _ref1;
      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      values = this.get('source_range').get('values');
      result = new Float32Array(xprimes.length);
      for (idx = _i = 0, _len = xprimes.length; _i < _len; idx = ++_i) {
        xprime = xprimes[idx];
        result[idx] = values[Math.trunc((xprime + offset) / scale)];
      }
      return result;
    };

    CategoricalMapper.prototype.target_bin_width = function() {
      return this.get('mapper_state')[0];
    };

    CategoricalMapper.prototype._scale = function() {
      var length, offset, scale, target_end, target_start;
      target_start = this.get('target_range').get('start');
      target_end = this.get('target_range').get('end');
      length = this.get('source_range').get('values').length;
      scale = (target_end - target_start) / length;
      offset = scale / 2;
      return [scale, offset];
    };

    return CategoricalMapper;

  })(HasProperties);

  exports.CategoricalMapper = CategoricalMapper;

}).call(this);
}, "mappers/1d/linear_mapper": function(exports, require, module) {(function() {
  var HasProperties, LinearMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  LinearMapper = (function(_super) {
    __extends(LinearMapper, _super);

    function LinearMapper() {
      _ref = LinearMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LinearMapper.prototype.initialize = function(attrs, options) {
      LinearMapper.__super__.initialize.call(this, attrs, options);
      this.register_property('mapper_state', this._mapper_state, true);
      this.add_dependencies('mapper_state', this, ['source_range', 'target_range']);
      this.add_dependencies('mapper_state', this.get('source_range'), ['start', 'end']);
      return this.add_dependencies('mapper_state', this.get('target_range'), ['start', 'end']);
    };

    LinearMapper.prototype.map_to_target = function(x) {
      var offset, scale, _ref1;
      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      return scale * x + offset;
    };

    LinearMapper.prototype.v_map_to_target = function(xs) {
      var idx, offset, result, scale, x, _i, _len, _ref1;
      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      result = new Float32Array(xs.length);
      for (idx = _i = 0, _len = xs.length; _i < _len; idx = ++_i) {
        x = xs[idx];
        result[idx] = scale * x + offset;
      }
      return result;
    };

    LinearMapper.prototype.map_from_target = function(xprime) {
      var offset, scale, _ref1;
      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      return (xprime - offset) / scale;
    };

    LinearMapper.prototype.v_map_from_target = function(xprimes) {
      var idx, offset, result, scale, xprime, _i, _len, _ref1;
      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      result = new Float32Array(xprimes.length);
      for (idx = _i = 0, _len = xprimes.length; _i < _len; idx = ++_i) {
        xprime = xprimes[idx];
        result[idx] = (xprime - offset) / scale;
      }
      return result;
    };

    LinearMapper.prototype._mapper_state = function() {
      var offset, scale, source_end, source_start, target_end, target_start;
      source_start = this.get('source_range').get('start');
      source_end = this.get('source_range').get('end');
      target_start = this.get('target_range').get('start');
      target_end = this.get('target_range').get('end');
      scale = (target_end - target_start) / (source_end - source_start);
      offset = -(scale * source_start) + target_start;
      return [scale, offset];
    };

    return LinearMapper;

  })(HasProperties);

  exports.LinearMapper = LinearMapper;

}).call(this);
}, "mappers/1d/log_mapper": function(exports, require, module) {(function() {
  var HasProperties, LogMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  LogMapper = (function(_super) {
    __extends(LogMapper, _super);

    function LogMapper() {
      _ref = LogMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LogMapper.prototype.initialize = function(attrs, options) {
      return LogMapper.__super__.initialize.call(this, attrs, options);
    };

    LogMapper.prototype.map_to_target = function(x) {};

    LogMapper.prototype.v_map_to_target = function(xs) {
      var result;
      result = new Float32Array(xs.length);
      return result;
    };

    LogMapper.prototype.map_from_target = function(xprime) {};

    LogMapper.prototype.v_map_from_target = function(xprimes) {
      var result;
      result = new Float32Array(xprimes.length);
      return result;
    };

    return LogMapper;

  })(HasProperties);

  exports.LogMapper = LogMapper;

}).call(this);
}, "mappers/2d/barycentric_mapper": function(exports, require, module) {(function() {
  var BarycentricMapper, HasProperties, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  BarycentricMapper = (function(_super) {
    __extends(BarycentricMapper, _super);

    function BarycentricMapper() {
      _ref = BarycentricMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BarycentricMapper.prototype.initialize = function(attrs, options) {
      return BarycentricMapper.__super__.initialize.call(this, attrs, options);
    };

    BarycentricMapper.prototype.map_to_target = function(x, y) {};

    BarycentricMapper.prototype.v_map_to_target = function(xs, ys) {};

    BarycentricMapper.prototype.map_from_target = function(xprime, yprime) {};

    BarycentricMapper.prototype.v_map_from_target = function(xprimes, yprimes) {};

    return BarycentricMapper;

  })(HasProperties);

  exports.BarycentricMapper = PolarMapper;

}).call(this);
}, "mappers/2d/grid_mapper": function(exports, require, module) {(function() {
  var GridMapper, HasProperties, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  GridMapper = (function(_super) {
    __extends(GridMapper, _super);

    function GridMapper() {
      _ref = GridMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GridMapper.prototype.map_to_target = function(x, y) {
      var xprime, yprime;
      xprime = this.get('domain_mapper').map_to_target(x);
      yprime = this.get('codomain_mapper').map_to_target(y);
      return [xprime, yprime];
    };

    GridMapper.prototype.v_map_to_target = function(xs, ys) {
      var xprimes, yprimes;
      xprimes = this.get('domain_mapper').v_map_to_target(xs);
      yprimes = this.get('codomain_mapper').v_map_to_target(ys);
      return [xprimes, yprimes];
    };

    GridMapper.prototype.map_from_target = function(xprime, yprime) {
      var x, y;
      x = this.get('domain_mapper').map_from_target(xprime);
      y = this.get('codomain_mapper').map_from_target(yprime);
      return [x, y];
    };

    GridMapper.prototype.v_map_from_target = function(xprimes, yprimes) {
      var xs, ys;
      xs = this.get('domain_mapper').v_map_from_target(xprimes);
      ys = this.get('codomain_mapper').v_map_from_target(yprimes);
      return [xs, ys];
    };

    return GridMapper;

  })(HasProperties);

  exports.GridMapper = GridMapper;

}).call(this);
}, "mappers/2d/polar_mapper": function(exports, require, module) {(function() {
  var HasProperties, PolarMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  PolarMapper = (function(_super) {
    __extends(PolarMapper, _super);

    function PolarMapper() {
      _ref = PolarMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PolarMapper.prototype.initialize = function(attrs, options) {
      return PolarMapper.__super__.initialize.call(this, attrs, options);
    };

    PolarMapper.prototype.map_to_target = function(x, y) {};

    PolarMapper.prototype.v_map_to_target = function(xs, ys) {};

    PolarMapper.prototype.map_from_target = function(xprime, yprime) {};

    PolarMapper.prototype.v_map_from_target = function(xprimes, yprimes) {};

    return PolarMapper;

  })(HasProperties);

  exports.PolarMapper = PolarMapper;

}).call(this);
}, "mappers/2d/ternary_mapper": function(exports, require, module) {(function() {
  var HasProperties, TernaryMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  TernaryMapper = (function(_super) {
    __extends(TernaryMapper, _super);

    function TernaryMapper() {
      _ref = TernaryMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TernaryMapper.prototype.initialize = function(attrs, options) {
      return TernaryMapper.__super__.initialize.call(this, attrs, options);
    };

    TernaryMapper.prototype.map_to_target = function(x, y) {};

    TernaryMapper.prototype.v_map_to_target = function(xs, ys) {};

    TernaryMapper.prototype.map_from_target = function(xprime, yprime) {};

    TernaryMapper.prototype.v_map_from_target = function(xprimes, yprimes) {};

    return TernaryMapper;

  })(HasProperties);

  exports.TerneryMapper = PolarMapper;

}).call(this);
}, "mappers/color/linear_color_mapper": function(exports, require, module) {(function() {
  var HasProperties, LinearColorMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  LinearColorMapper = (function(_super) {
    __extends(LinearColorMapper, _super);

    function LinearColorMapper() {
      _ref = LinearColorMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LinearColorMapper.prototype.initialize = function(attrs, options) {
      LinearColorMapper.__super__.initialize.call(this, attrs, options);
      this.low = options.low;
      this.high = options.high;
      this.palette = this._build_palette(options.palette);
      return this.little_endian = this._is_little_endian();
    };

    LinearColorMapper.prototype.v_map_screen = function(data) {
      var N, buf, color, d, high, i, low, max, min, offset, scale, value, _i, _j, _k, _ref1, _ref2, _ref3;
      buf = new ArrayBuffer(data.length * 4);
      color = new Uint32Array(buf);
      max = -Infinity;
      min = Infinity;
      value = 0;
      for (i = _i = 0, _ref1 = data.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        value = data[i];
        if (value > max) {
          max = value;
        }
        if (value < min) {
          min = value;
        }
      }
      if (this.low != null) {
        low = this.low;
      } else {
        low = min;
      }
      if (this.high != null) {
        high = this.high;
      } else {
        high = max;
      }
      N = this.palette.length - 1;
      scale = N / (high - low);
      offset = -scale * low;
      if (this.little_endian) {
        for (i = _j = 0, _ref2 = data.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          d = data[i];
          if (d > high) {
            d = high;
          }
          if (d < low) {
            d = low;
          }
          value = this.palette[Math.floor(d * scale + offset)];
          color[i] = (0xff << 24) | ((value & 0xff0000) >> 16) | (value & 0xff00) | ((value & 0xff) << 16);
        }
      } else {
        for (i = _k = 0, _ref3 = data.length - 1; 0 <= _ref3 ? _k <= _ref3 : _k >= _ref3; i = 0 <= _ref3 ? ++_k : --_k) {
          d = data[i];
          if (d > high) {
            d = high;
          }
          if (d < low) {
            d = low;
          }
          value = this.palette[Math.floor(d * scale + offset)];
          color[i] = (value << 8) | 0xff;
        }
      }
      return buf;
    };

    LinearColorMapper.prototype._is_little_endian = function() {
      var buf, buf32, buf8, little_endian;
      buf = new ArrayBuffer(4);
      buf8 = new Uint8ClampedArray(buf);
      buf32 = new Uint32Array(buf);
      buf32[1] = 0x0a0b0c0d;
      little_endian = true;
      if (buf8[4] === 0x0a && buf8[5] === 0x0b && buf8[6] === 0x0c && buf8[7] === 0x0d) {
        little_endian = false;
      }
      return little_endian;
    };

    LinearColorMapper.prototype._build_palette = function(palette) {
      var i, new_palette, _i, _ref1;
      new_palette = new Uint32Array(palette.length + 1);
      for (i = _i = 0, _ref1 = palette.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        new_palette[i] = palette[i];
      }
      new_palette[new_palette.length - 1] = palette[palette.length - 1];
      return new_palette;
    };

    return LinearColorMapper;

  })(HasProperties);

  exports.LinearColorMapper = LinearColorMapper;

}).call(this);
}, "mappers/color/log_color_mapper": function(exports, require, module) {(function() {


}).call(this);
}, "mappers/color/segment_color_mapper": function(exports, require, module) {(function() {


}).call(this);
}, "overlays/boxselectionoverlay": function(exports, require, module) {(function() {
  var BoxSelectionOverlay, BoxSelectionOverlayView, BoxSelectionOverlays, HasParent, PlotWidget, base, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  PlotWidget = require("../common/plot_widget").PlotWidget;

  HasParent = base.HasParent;

  BoxSelectionOverlayView = (function(_super) {
    __extends(BoxSelectionOverlayView, _super);

    function BoxSelectionOverlayView() {
      _ref = BoxSelectionOverlayView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BoxSelectionOverlayView.prototype.initialize = function(options) {
      this.selecting = false;
      this.xrange = [null, null];
      this.yrange = [null, null];
      BoxSelectionOverlayView.__super__.initialize.call(this, options);
      return this.plot_view.$el.find('.bokeh_canvas_wrapper').append(this.$el);
    };

    BoxSelectionOverlayView.prototype.boxselect = function(xrange, yrange) {
      this.xrange = xrange;
      this.yrange = yrange;
      return this.request_render();
    };

    BoxSelectionOverlayView.prototype.startselect = function() {
      this.selecting = true;
      this.xrange = [null, null];
      this.yrange = [null, null];
      return this.request_render();
    };

    BoxSelectionOverlayView.prototype.stopselect = function() {
      this.selecting = false;
      this.xrange = [null, null];
      this.yrange = [null, null];
      return this.request_render();
    };

    BoxSelectionOverlayView.prototype.bind_bokeh_events = function(options) {
      this.toolview = this.plot_view.tools[this.mget('tool').id];
      this.listenTo(this.toolview, 'boxselect', this.boxselect);
      this.listenTo(this.toolview, 'startselect', this.startselect);
      return this.listenTo(this.toolview, 'stopselect', this.stopselect);
    };

    BoxSelectionOverlayView.prototype.render = function() {
      var height, style_string, width, xpos, xrange, ypos, yrange;
      if (!this.selecting) {
        this.$el.removeClass('shading');
        return;
      }
      xrange = this.xrange;
      yrange = this.yrange;
      if (_.any(_.map(xrange, _.isNullOrUndefined)) || _.any(_.map(yrange, _.isNullOrUndefined))) {
        this.$el.removeClass('shading');
        return;
      }
      style_string = "";
      xpos = this.plot_view.view_state.sx_to_device(Math.min(xrange[0], xrange[1]));
      if (xrange) {
        width = Math.abs(xrange[1] - xrange[0]);
      } else {
        width = this.plot_view.view_state.get('width');
      }
      style_string += "; left:" + xpos + "px; width:" + width + "px; ";
      ypos = this.plot_view.view_state.sy_to_device(Math.max(yrange[0], yrange[1]));
      if (yrange) {
        height = yrange[1] - yrange[0];
      } else {
        height = this.plot_view.view_state.get('height');
      }
      this.$el.addClass('shading');
      style_string += "top:" + ypos + "px; height:" + height + "px";
      return this.$el.attr('style', style_string);
    };

    return BoxSelectionOverlayView;

  })(PlotWidget);

  BoxSelectionOverlay = (function(_super) {
    __extends(BoxSelectionOverlay, _super);

    function BoxSelectionOverlay() {
      _ref1 = BoxSelectionOverlay.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    BoxSelectionOverlay.prototype.type = 'BoxSelectionOverlay';

    BoxSelectionOverlay.prototype.default_view = BoxSelectionOverlayView;

    return BoxSelectionOverlay;

  })(HasParent);

  BoxSelectionOverlay.prototype.defaults = _.clone(BoxSelectionOverlay.prototype.defaults);

  _.extend(BoxSelectionOverlay.prototype.defaults, {
    tool: null,
    level: 'overlay'
  });

  BoxSelectionOverlays = (function(_super) {
    __extends(BoxSelectionOverlays, _super);

    function BoxSelectionOverlays() {
      _ref2 = BoxSelectionOverlays.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    BoxSelectionOverlays.prototype.model = BoxSelectionOverlay;

    return BoxSelectionOverlays;

  })(Backbone.Collection);

  exports.boxselectionoverlays = new BoxSelectionOverlays;

  exports.BoxSelectionOverlayView = BoxSelectionOverlayView;

  exports.BoxSelectionOverlay = BoxSelectionOverlay;

}).call(this);
}, "palettes/colorbrewer": function(exports, require, module) {(function() {
  var colorbrewer;

  colorbrewer = {
    YlGn: {
      3: [0xf7fcb9, 0xaddd8e, 0x31a354],
      4: [0xffffcc, 0xc2e699, 0x78c679, 0x238443],
      5: [0xffffcc, 0xc2e699, 0x78c679, 0x31a354, 0x006837],
      6: [0xffffcc, 0xd9f0a3, 0xaddd8e, 0x78c679, 0x31a354, 0x006837],
      7: [0xffffcc, 0xd9f0a3, 0xaddd8e, 0x78c679, 0x41ab5d, 0x238443, 0x005a32],
      8: [0xffffe5, 0xf7fcb9, 0xd9f0a3, 0xaddd8e, 0x78c679, 0x41ab5d, 0x238443, 0x005a32],
      9: [0xffffe5, 0xf7fcb9, 0xd9f0a3, 0xaddd8e, 0x78c679, 0x41ab5d, 0x238443, 0x006837, 0x004529]
    },
    YlGnBu: {
      3: [0xedf8b1, 0x7fcdbb, 0x2c7fb8],
      4: [0xffffcc, 0xa1dab4, 0x41b6c4, 0x225ea8],
      5: [0xffffcc, 0xa1dab4, 0x41b6c4, 0x2c7fb8, 0x253494],
      6: [0xffffcc, 0xc7e9b4, 0x7fcdbb, 0x41b6c4, 0x2c7fb8, 0x253494],
      7: [0xffffcc, 0xc7e9b4, 0x7fcdbb, 0x41b6c4, 0x1d91c0, 0x225ea8, 0x0c2c84],
      8: [0xffffd9, 0xedf8b1, 0xc7e9b4, 0x7fcdbb, 0x41b6c4, 0x1d91c0, 0x225ea8, 0x0c2c84],
      9: [0xffffd9, 0xedf8b1, 0xc7e9b4, 0x7fcdbb, 0x41b6c4, 0x1d91c0, 0x225ea8, 0x253494, 0x081d58]
    },
    GnBu: {
      3: [0xe0f3db, 0xa8ddb5, 0x43a2ca],
      4: [0xf0f9e8, 0xbae4bc, 0x7bccc4, 0x2b8cbe],
      5: [0xf0f9e8, 0xbae4bc, 0x7bccc4, 0x43a2ca, 0x0868ac],
      6: [0xf0f9e8, 0xccebc5, 0xa8ddb5, 0x7bccc4, 0x43a2ca, 0x0868ac],
      7: [0xf0f9e8, 0xccebc5, 0xa8ddb5, 0x7bccc4, 0x4eb3d3, 0x2b8cbe, 0x08589e],
      8: [0xf7fcf0, 0xe0f3db, 0xccebc5, 0xa8ddb5, 0x7bccc4, 0x4eb3d3, 0x2b8cbe, 0x08589e],
      9: [0xf7fcf0, 0xe0f3db, 0xccebc5, 0xa8ddb5, 0x7bccc4, 0x4eb3d3, 0x2b8cbe, 0x0868ac, 0x084081]
    },
    BuGn: {
      3: [0xe5f5f9, 0x99d8c9, 0x2ca25f],
      4: [0xedf8fb, 0xb2e2e2, 0x66c2a4, 0x238b45],
      5: [0xedf8fb, 0xb2e2e2, 0x66c2a4, 0x2ca25f, 0x006d2c],
      6: [0xedf8fb, 0xccece6, 0x99d8c9, 0x66c2a4, 0x2ca25f, 0x006d2c],
      7: [0xedf8fb, 0xccece6, 0x99d8c9, 0x66c2a4, 0x41ae76, 0x238b45, 0x005824],
      8: [0xf7fcfd, 0xe5f5f9, 0xccece6, 0x99d8c9, 0x66c2a4, 0x41ae76, 0x238b45, 0x005824],
      9: [0xf7fcfd, 0xe5f5f9, 0xccece6, 0x99d8c9, 0x66c2a4, 0x41ae76, 0x238b45, 0x006d2c, 0x00441b]
    },
    PuBuGn: {
      3: [0xece2f0, 0xa6bddb, 0x1c9099],
      4: [0xf6eff7, 0xbdc9e1, 0x67a9cf, 0x02818a],
      5: [0xf6eff7, 0xbdc9e1, 0x67a9cf, 0x1c9099, 0x016c59],
      6: [0xf6eff7, 0xd0d1e6, 0xa6bddb, 0x67a9cf, 0x1c9099, 0x016c59],
      7: [0xf6eff7, 0xd0d1e6, 0xa6bddb, 0x67a9cf, 0x3690c0, 0x02818a, 0x016450],
      8: [0xfff7fb, 0xece2f0, 0xd0d1e6, 0xa6bddb, 0x67a9cf, 0x3690c0, 0x02818a, 0x016450],
      9: [0xfff7fb, 0xece2f0, 0xd0d1e6, 0xa6bddb, 0x67a9cf, 0x3690c0, 0x02818a, 0x016c59, 0x014636]
    },
    PuBu: {
      3: [0xece7f2, 0xa6bddb, 0x2b8cbe],
      4: [0xf1eef6, 0xbdc9e1, 0x74a9cf, 0x0570b0],
      5: [0xf1eef6, 0xbdc9e1, 0x74a9cf, 0x2b8cbe, 0x045a8d],
      6: [0xf1eef6, 0xd0d1e6, 0xa6bddb, 0x74a9cf, 0x2b8cbe, 0x045a8d],
      7: [0xf1eef6, 0xd0d1e6, 0xa6bddb, 0x74a9cf, 0x3690c0, 0x0570b0, 0x034e7b],
      8: [0xfff7fb, 0xece7f2, 0xd0d1e6, 0xa6bddb, 0x74a9cf, 0x3690c0, 0x0570b0, 0x034e7b],
      9: [0xfff7fb, 0xece7f2, 0xd0d1e6, 0xa6bddb, 0x74a9cf, 0x3690c0, 0x0570b0, 0x045a8d, 0x023858]
    },
    BuPu: {
      3: [0xe0ecf4, 0x9ebcda, 0x8856a7],
      4: [0xedf8fb, 0xb3cde3, 0x8c96c6, 0x88419d],
      5: [0xedf8fb, 0xb3cde3, 0x8c96c6, 0x8856a7, 0x810f7c],
      6: [0xedf8fb, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8856a7, 0x810f7c],
      7: [0xedf8fb, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8c6bb1, 0x88419d, 0x6e016b],
      8: [0xf7fcfd, 0xe0ecf4, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8c6bb1, 0x88419d, 0x6e016b],
      9: [0xf7fcfd, 0xe0ecf4, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8c6bb1, 0x88419d, 0x810f7c, 0x4d004b]
    },
    RdPu: {
      3: [0xfde0dd, 0xfa9fb5, 0xc51b8a],
      4: [0xfeebe2, 0xfbb4b9, 0xf768a1, 0xae017e],
      5: [0xfeebe2, 0xfbb4b9, 0xf768a1, 0xc51b8a, 0x7a0177],
      6: [0xfeebe2, 0xfcc5c0, 0xfa9fb5, 0xf768a1, 0xc51b8a, 0x7a0177],
      7: [0xfeebe2, 0xfcc5c0, 0xfa9fb5, 0xf768a1, 0xdd3497, 0xae017e, 0x7a0177],
      8: [0xfff7f3, 0xfde0dd, 0xfcc5c0, 0xfa9fb5, 0xf768a1, 0xdd3497, 0xae017e, 0x7a0177],
      9: [0xfff7f3, 0xfde0dd, 0xfcc5c0, 0xfa9fb5, 0xf768a1, 0xdd3497, 0xae017e, 0x7a0177, 0x49006a]
    },
    PuRd: {
      3: [0xe7e1ef, 0xc994c7, 0xdd1c77],
      4: [0xf1eef6, 0xd7b5d8, 0xdf65b0, 0xce1256],
      5: [0xf1eef6, 0xd7b5d8, 0xdf65b0, 0xdd1c77, 0x980043],
      6: [0xf1eef6, 0xd4b9da, 0xc994c7, 0xdf65b0, 0xdd1c77, 0x980043],
      7: [0xf1eef6, 0xd4b9da, 0xc994c7, 0xdf65b0, 0xe7298a, 0xce1256, 0x91003f],
      8: [0xf7f4f9, 0xe7e1ef, 0xd4b9da, 0xc994c7, 0xdf65b0, 0xe7298a, 0xce1256, 0x91003f],
      9: [0xf7f4f9, 0xe7e1ef, 0xd4b9da, 0xc994c7, 0xdf65b0, 0xe7298a, 0xce1256, 0x980043, 0x67001f]
    },
    OrRd: {
      3: [0xfee8c8, 0xfdbb84, 0xe34a33],
      4: [0xfef0d9, 0xfdcc8a, 0xfc8d59, 0xd7301f],
      5: [0xfef0d9, 0xfdcc8a, 0xfc8d59, 0xe34a33, 0xb30000],
      6: [0xfef0d9, 0xfdd49e, 0xfdbb84, 0xfc8d59, 0xe34a33, 0xb30000],
      7: [0xfef0d9, 0xfdd49e, 0xfdbb84, 0xfc8d59, 0xef6548, 0xd7301f, 0x990000],
      8: [0xfff7ec, 0xfee8c8, 0xfdd49e, 0xfdbb84, 0xfc8d59, 0xef6548, 0xd7301f, 0x990000],
      9: [0xfff7ec, 0xfee8c8, 0xfdd49e, 0xfdbb84, 0xfc8d59, 0xef6548, 0xd7301f, 0xb30000, 0x7f0000]
    },
    YlOrRd: {
      3: [0xffeda0, 0xfeb24c, 0xf03b20],
      4: [0xffffb2, 0xfecc5c, 0xfd8d3c, 0xe31a1c],
      5: [0xffffb2, 0xfecc5c, 0xfd8d3c, 0xf03b20, 0xbd0026],
      6: [0xffffb2, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xf03b20, 0xbd0026],
      7: [0xffffb2, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xfc4e2a, 0xe31a1c, 0xb10026],
      8: [0xffffcc, 0xffeda0, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xfc4e2a, 0xe31a1c, 0xb10026],
      9: [0xffffcc, 0xffeda0, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xfc4e2a, 0xe31a1c, 0xbd0026, 0x800026]
    },
    YlOrBr: {
      3: [0xfff7bc, 0xfec44f, 0xd95f0e],
      4: [0xffffd4, 0xfed98e, 0xfe9929, 0xcc4c02],
      5: [0xffffd4, 0xfed98e, 0xfe9929, 0xd95f0e, 0x993404],
      6: [0xffffd4, 0xfee391, 0xfec44f, 0xfe9929, 0xd95f0e, 0x993404],
      7: [0xffffd4, 0xfee391, 0xfec44f, 0xfe9929, 0xec7014, 0xcc4c02, 0x8c2d04],
      8: [0xffffe5, 0xfff7bc, 0xfee391, 0xfec44f, 0xfe9929, 0xec7014, 0xcc4c02, 0x8c2d04],
      9: [0xffffe5, 0xfff7bc, 0xfee391, 0xfec44f, 0xfe9929, 0xec7014, 0xcc4c02, 0x993404, 0x662506]
    },
    Purples: {
      3: [0xefedf5, 0xbcbddc, 0x756bb1],
      4: [0xf2f0f7, 0xcbc9e2, 0x9e9ac8, 0x6a51a3],
      5: [0xf2f0f7, 0xcbc9e2, 0x9e9ac8, 0x756bb1, 0x54278f],
      6: [0xf2f0f7, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x756bb1, 0x54278f],
      7: [0xf2f0f7, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x807dba, 0x6a51a3, 0x4a1486],
      8: [0xfcfbfd, 0xefedf5, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x807dba, 0x6a51a3, 0x4a1486],
      9: [0xfcfbfd, 0xefedf5, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x807dba, 0x6a51a3, 0x54278f, 0x3f007d]
    },
    Blues: {
      3: [0xdeebf7, 0x9ecae1, 0x3182bd],
      4: [0xeff3ff, 0xbdd7e7, 0x6baed6, 0x2171b5],
      5: [0xeff3ff, 0xbdd7e7, 0x6baed6, 0x3182bd, 0x08519c],
      6: [0xeff3ff, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x3182bd, 0x08519c],
      7: [0xeff3ff, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x4292c6, 0x2171b5, 0x084594],
      8: [0xf7fbff, 0xdeebf7, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x4292c6, 0x2171b5, 0x084594],
      9: [0xf7fbff, 0xdeebf7, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x4292c6, 0x2171b5, 0x08519c, 0x08306b]
    },
    Greens: {
      3: [0xe5f5e0, 0xa1d99b, 0x31a354],
      4: [0xedf8e9, 0xbae4b3, 0x74c476, 0x238b45],
      5: [0xedf8e9, 0xbae4b3, 0x74c476, 0x31a354, 0x006d2c],
      6: [0xedf8e9, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x31a354, 0x006d2c],
      7: [0xedf8e9, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x41ab5d, 0x238b45, 0x005a32],
      8: [0xf7fcf5, 0xe5f5e0, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x41ab5d, 0x238b45, 0x005a32],
      9: [0xf7fcf5, 0xe5f5e0, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x41ab5d, 0x238b45, 0x006d2c, 0x00441b]
    },
    Oranges: {
      3: [0xfee6ce, 0xfdae6b, 0xe6550d],
      4: [0xfeedde, 0xfdbe85, 0xfd8d3c, 0xd94701],
      5: [0xfeedde, 0xfdbe85, 0xfd8d3c, 0xe6550d, 0xa63603],
      6: [0xfeedde, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xe6550d, 0xa63603],
      7: [0xfeedde, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xf16913, 0xd94801, 0x8c2d04],
      8: [0xfff5eb, 0xfee6ce, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xf16913, 0xd94801, 0x8c2d04],
      9: [0xfff5eb, 0xfee6ce, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xf16913, 0xd94801, 0xa63603, 0x7f2704]
    },
    Reds: {
      3: [0xfee0d2, 0xfc9272, 0xde2d26],
      4: [0xfee5d9, 0xfcae91, 0xfb6a4a, 0xcb181d],
      5: [0xfee5d9, 0xfcae91, 0xfb6a4a, 0xde2d26, 0xa50f15],
      6: [0xfee5d9, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xde2d26, 0xa50f15],
      7: [0xfee5d9, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xef3b2c, 0xcb181d, 0x99000d],
      8: [0xfff5f0, 0xfee0d2, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xef3b2c, 0xcb181d, 0x99000d],
      9: [0xfff5f0, 0xfee0d2, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xef3b2c, 0xcb181d, 0xa50f15, 0x67000d]
    },
    Greys: {
      3: [0xf0f0f0, 0xbdbdbd, 0x636363],
      4: [0xf7f7f7, 0xcccccc, 0x969696, 0x525252],
      5: [0xf7f7f7, 0xcccccc, 0x969696, 0x636363, 0x252525],
      6: [0xf7f7f7, 0xd9d9d9, 0xbdbdbd, 0x969696, 0x636363, 0x252525],
      7: [0xf7f7f7, 0xd9d9d9, 0xbdbdbd, 0x969696, 0x737373, 0x525252, 0x252525],
      8: [0xffffff, 0xf0f0f0, 0xd9d9d9, 0xbdbdbd, 0x969696, 0x737373, 0x525252, 0x252525],
      9: [0xffffff, 0xf0f0f0, 0xd9d9d9, 0xbdbdbd, 0x969696, 0x737373, 0x525252, 0x252525, 0x000000]
    },
    PuOr: {
      3: [0xf1a340, 0xf7f7f7, 0x998ec3],
      4: [0xe66101, 0xfdb863, 0xb2abd2, 0x5e3c99],
      5: [0xe66101, 0xfdb863, 0xf7f7f7, 0xb2abd2, 0x5e3c99],
      6: [0xb35806, 0xf1a340, 0xfee0b6, 0xd8daeb, 0x998ec3, 0x542788],
      7: [0xb35806, 0xf1a340, 0xfee0b6, 0xf7f7f7, 0xd8daeb, 0x998ec3, 0x542788],
      8: [0xb35806, 0xe08214, 0xfdb863, 0xfee0b6, 0xd8daeb, 0xb2abd2, 0x8073ac, 0x542788],
      9: [0xb35806, 0xe08214, 0xfdb863, 0xfee0b6, 0xf7f7f7, 0xd8daeb, 0xb2abd2, 0x8073ac, 0x542788],
      10: [0x7f3b08, 0xb35806, 0xe08214, 0xfdb863, 0xfee0b6, 0xd8daeb, 0xb2abd2, 0x8073ac, 0x542788, 0x2d004b],
      11: [0x7f3b08, 0xb35806, 0xe08214, 0xfdb863, 0xfee0b6, 0xf7f7f7, 0xd8daeb, 0xb2abd2, 0x8073ac, 0x542788, 0x2d004b]
    },
    BrBG: {
      3: [0xd8b365, 0xf5f5f5, 0x5ab4ac],
      4: [0xa6611a, 0xdfc27d, 0x80cdc1, 0x018571],
      5: [0xa6611a, 0xdfc27d, 0xf5f5f5, 0x80cdc1, 0x018571],
      6: [0x8c510a, 0xd8b365, 0xf6e8c3, 0xc7eae5, 0x5ab4ac, 0x01665e],
      7: [0x8c510a, 0xd8b365, 0xf6e8c3, 0xf5f5f5, 0xc7eae5, 0x5ab4ac, 0x01665e],
      8: [0x8c510a, 0xbf812d, 0xdfc27d, 0xf6e8c3, 0xc7eae5, 0x80cdc1, 0x35978f, 0x01665e],
      9: [0x8c510a, 0xbf812d, 0xdfc27d, 0xf6e8c3, 0xf5f5f5, 0xc7eae5, 0x80cdc1, 0x35978f, 0x01665e],
      10: [0x543005, 0x8c510a, 0xbf812d, 0xdfc27d, 0xf6e8c3, 0xc7eae5, 0x80cdc1, 0x35978f, 0x01665e, 0x003c30],
      11: [0x543005, 0x8c510a, 0xbf812d, 0xdfc27d, 0xf6e8c3, 0xf5f5f5, 0xc7eae5, 0x80cdc1, 0x35978f, 0x01665e, 0x003c30]
    },
    PRGn: {
      3: [0xaf8dc3, 0xf7f7f7, 0x7fbf7b],
      4: [0x7b3294, 0xc2a5cf, 0xa6dba0, 0x008837],
      5: [0x7b3294, 0xc2a5cf, 0xf7f7f7, 0xa6dba0, 0x008837],
      6: [0x762a83, 0xaf8dc3, 0xe7d4e8, 0xd9f0d3, 0x7fbf7b, 0x1b7837],
      7: [0x762a83, 0xaf8dc3, 0xe7d4e8, 0xf7f7f7, 0xd9f0d3, 0x7fbf7b, 0x1b7837],
      8: [0x762a83, 0x9970ab, 0xc2a5cf, 0xe7d4e8, 0xd9f0d3, 0xa6dba0, 0x5aae61, 0x1b7837],
      9: [0x762a83, 0x9970ab, 0xc2a5cf, 0xe7d4e8, 0xf7f7f7, 0xd9f0d3, 0xa6dba0, 0x5aae61, 0x1b7837],
      10: [0x40004b, 0x762a83, 0x9970ab, 0xc2a5cf, 0xe7d4e8, 0xd9f0d3, 0xa6dba0, 0x5aae61, 0x1b7837, 0x00441b],
      11: [0x40004b, 0x762a83, 0x9970ab, 0xc2a5cf, 0xe7d4e8, 0xf7f7f7, 0xd9f0d3, 0xa6dba0, 0x5aae61, 0x1b7837, 0x00441b]
    },
    PiYG: {
      3: [0xe9a3c9, 0xf7f7f7, 0xa1d76a],
      4: [0xd01c8b, 0xf1b6da, 0xb8e186, 0x4dac26],
      5: [0xd01c8b, 0xf1b6da, 0xf7f7f7, 0xb8e186, 0x4dac26],
      6: [0xc51b7d, 0xe9a3c9, 0xfde0ef, 0xe6f5d0, 0xa1d76a, 0x4d9221],
      7: [0xc51b7d, 0xe9a3c9, 0xfde0ef, 0xf7f7f7, 0xe6f5d0, 0xa1d76a, 0x4d9221],
      8: [0xc51b7d, 0xde77ae, 0xf1b6da, 0xfde0ef, 0xe6f5d0, 0xb8e186, 0x7fbc41, 0x4d9221],
      9: [0xc51b7d, 0xde77ae, 0xf1b6da, 0xfde0ef, 0xf7f7f7, 0xe6f5d0, 0xb8e186, 0x7fbc41, 0x4d9221],
      10: [0x8e0152, 0xc51b7d, 0xde77ae, 0xf1b6da, 0xfde0ef, 0xe6f5d0, 0xb8e186, 0x7fbc41, 0x4d9221, 0x276419],
      11: [0x8e0152, 0xc51b7d, 0xde77ae, 0xf1b6da, 0xfde0ef, 0xf7f7f7, 0xe6f5d0, 0xb8e186, 0x7fbc41, 0x4d9221, 0x276419]
    },
    RdBu: {
      3: [0xef8a62, 0xf7f7f7, 0x67a9cf],
      4: [0xca0020, 0xf4a582, 0x92c5de, 0x0571b0],
      5: [0xca0020, 0xf4a582, 0xf7f7f7, 0x92c5de, 0x0571b0],
      6: [0xb2182b, 0xef8a62, 0xfddbc7, 0xd1e5f0, 0x67a9cf, 0x2166ac],
      7: [0xb2182b, 0xef8a62, 0xfddbc7, 0xf7f7f7, 0xd1e5f0, 0x67a9cf, 0x2166ac],
      8: [0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xd1e5f0, 0x92c5de, 0x4393c3, 0x2166ac],
      9: [0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xf7f7f7, 0xd1e5f0, 0x92c5de, 0x4393c3, 0x2166ac],
      10: [0x67001f, 0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xd1e5f0, 0x92c5de, 0x4393c3, 0x2166ac, 0x053061],
      11: [0x67001f, 0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xf7f7f7, 0xd1e5f0, 0x92c5de, 0x4393c3, 0x2166ac, 0x053061]
    },
    RdGy: {
      3: [0xef8a62, 0xffffff, 0x999999],
      4: [0xca0020, 0xf4a582, 0xbababa, 0x404040],
      5: [0xca0020, 0xf4a582, 0xffffff, 0xbababa, 0x404040],
      6: [0xb2182b, 0xef8a62, 0xfddbc7, 0xe0e0e0, 0x999999, 0x4d4d4d],
      7: [0xb2182b, 0xef8a62, 0xfddbc7, 0xffffff, 0xe0e0e0, 0x999999, 0x4d4d4d],
      8: [0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xe0e0e0, 0xbababa, 0x878787, 0x4d4d4d],
      9: [0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xffffff, 0xe0e0e0, 0xbababa, 0x878787, 0x4d4d4d],
      10: [0x67001f, 0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xe0e0e0, 0xbababa, 0x878787, 0x4d4d4d, 0x1a1a1a],
      11: [0x67001f, 0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xffffff, 0xe0e0e0, 0xbababa, 0x878787, 0x4d4d4d, 0x1a1a1a]
    },
    RdYlBu: {
      3: [0xfc8d59, 0xffffbf, 0x91bfdb],
      4: [0xd7191c, 0xfdae61, 0xabd9e9, 0x2c7bb6],
      5: [0xd7191c, 0xfdae61, 0xffffbf, 0xabd9e9, 0x2c7bb6],
      6: [0xd73027, 0xfc8d59, 0xfee090, 0xe0f3f8, 0x91bfdb, 0x4575b4],
      7: [0xd73027, 0xfc8d59, 0xfee090, 0xffffbf, 0xe0f3f8, 0x91bfdb, 0x4575b4],
      8: [0xd73027, 0xf46d43, 0xfdae61, 0xfee090, 0xe0f3f8, 0xabd9e9, 0x74add1, 0x4575b4],
      9: [0xd73027, 0xf46d43, 0xfdae61, 0xfee090, 0xffffbf, 0xe0f3f8, 0xabd9e9, 0x74add1, 0x4575b4],
      10: [0xa50026, 0xd73027, 0xf46d43, 0xfdae61, 0xfee090, 0xe0f3f8, 0xabd9e9, 0x74add1, 0x4575b4, 0x313695],
      11: [0xa50026, 0xd73027, 0xf46d43, 0xfdae61, 0xfee090, 0xffffbf, 0xe0f3f8, 0xabd9e9, 0x74add1, 0x4575b4, 0x313695]
    },
    Spectral: {
      3: [0xfc8d59, 0xffffbf, 0x99d594],
      4: [0xd7191c, 0xfdae61, 0xabdda4, 0x2b83ba],
      5: [0xd7191c, 0xfdae61, 0xffffbf, 0xabdda4, 0x2b83ba],
      6: [0xd53e4f, 0xfc8d59, 0xfee08b, 0xe6f598, 0x99d594, 0x3288bd],
      7: [0xd53e4f, 0xfc8d59, 0xfee08b, 0xffffbf, 0xe6f598, 0x99d594, 0x3288bd],
      8: [0xd53e4f, 0xf46d43, 0xfdae61, 0xfee08b, 0xe6f598, 0xabdda4, 0x66c2a5, 0x3288bd],
      9: [0xd53e4f, 0xf46d43, 0xfdae61, 0xfee08b, 0xffffbf, 0xe6f598, 0xabdda4, 0x66c2a5, 0x3288bd],
      10: [0x9e0142, 0xd53e4f, 0xf46d43, 0xfdae61, 0xfee08b, 0xe6f598, 0xabdda4, 0x66c2a5, 0x3288bd, 0x5e4fa2],
      11: [0x9e0142, 0xd53e4f, 0xf46d43, 0xfdae61, 0xfee08b, 0xffffbf, 0xe6f598, 0xabdda4, 0x66c2a5, 0x3288bd, 0x5e4fa2]
    },
    RdYlGn: {
      3: [0xfc8d59, 0xffffbf, 0x91cf60],
      4: [0xd7191c, 0xfdae61, 0xa6d96a, 0x1a9641],
      5: [0xd7191c, 0xfdae61, 0xffffbf, 0xa6d96a, 0x1a9641],
      6: [0xd73027, 0xfc8d59, 0xfee08b, 0xd9ef8b, 0x91cf60, 0x1a9850],
      7: [0xd73027, 0xfc8d59, 0xfee08b, 0xffffbf, 0xd9ef8b, 0x91cf60, 0x1a9850],
      8: [0xd73027, 0xf46d43, 0xfdae61, 0xfee08b, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850],
      9: [0xd73027, 0xf46d43, 0xfdae61, 0xfee08b, 0xffffbf, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850],
      10: [0xa50026, 0xd73027, 0xf46d43, 0xfdae61, 0xfee08b, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850, 0x006837],
      11: [0xa50026, 0xd73027, 0xf46d43, 0xfdae61, 0xfee08b, 0xffffbf, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850, 0x006837]
    }
  };

  exports.colorbrewer = colorbrewer;

}).call(this);
}, "palettes/palettes": function(exports, require, module) {(function() {
  var all_palettes, colorbrewer, items, name, num, pal;

  colorbrewer = require('./colorbrewer').colorbrewer;

  all_palettes = {};

  for (name in colorbrewer) {
    items = colorbrewer[name];
    for (num in items) {
      pal = items[num];
      all_palettes["" + name + "-" + num] = pal.reverse();
    }
  }

  exports.all_palettes = all_palettes;

}).call(this);
}, "pandas/pandas": function(exports, require, module) {(function() {
  var Collection, ContinuumView, ENTER, HasParent, HasProperties, IPythonRemoteData, PandasPivotTable, PandasPivotView, PandasPlotSource, PandasPlotSources, base, coll, datasource, _ref, _ref1, _ref2, _ref3, _ref4,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  base = require("../base");

  datasource = require("../common/datasource");

  ContinuumView = require("../common/continuum_view").ContinuumView;

  HasParent = base.HasParent;

  HasProperties = base.HasProperties;

  Collection = Backbone.Collection;

  IPythonRemoteData = (function(_super) {
    __extends(IPythonRemoteData, _super);

    function IPythonRemoteData() {
      _ref = IPythonRemoteData.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    IPythonRemoteData.prototype.type = 'IPythonRemoteData';

    IPythonRemoteData.prototype.defaults = {
      computed_columns: []
    };

    return IPythonRemoteData;

  })(HasProperties);

  coll = Collection.extend({
    model: IPythonRemoteData
  });

  exports.ipythonremotedatas = new coll();

  ENTER = 13;

  PandasPlotSource = (function(_super) {
    __extends(PandasPlotSource, _super);

    function PandasPlotSource() {
      _ref1 = PandasPlotSource.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PandasPlotSource.prototype.type = 'PandasPlotSource';

    return PandasPlotSource;

  })(datasource.ColumnDataSource);

  coll = Collection.extend({
    model: PandasPlotSource
  });

  exports.pandasplotsources = new coll();

  PandasPlotSources = (function(_super) {
    __extends(PandasPlotSources, _super);

    function PandasPlotSources() {
      _ref2 = PandasPlotSources.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    PandasPlotSources.prototype.model = PandasPlotSource;

    return PandasPlotSources;

  })(Backbone.Collection);

  PandasPivotView = (function(_super) {
    __extends(PandasPivotView, _super);

    function PandasPivotView() {
      this.colors = __bind(this.colors, this);
      this.pandasend = __bind(this.pandasend, this);
      this.pandasnext = __bind(this.pandasnext, this);
      this.pandasback = __bind(this.pandasback, this);
      this.pandasbeginning = __bind(this.pandasbeginning, this);
      this.toggle_more_controls = __bind(this.toggle_more_controls, this);
      this.sort = __bind(this.sort, this);
      this.rowclick = __bind(this.rowclick, this);
      this.toggle_filterselected = __bind(this.toggle_filterselected, this);
      this.clearselected = __bind(this.clearselected, this);
      this.computedtxtbox = __bind(this.computedtxtbox, this);
      this.column_del = __bind(this.column_del, this);
      this.search = __bind(this.search, this);
      _ref3 = PandasPivotView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    PandasPivotView.prototype.template = require("./pandaspivot");

    PandasPivotView.prototype.initialize = function(options) {
      PandasPivotView.__super__.initialize.call(this, options);
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(this.model, 'change', this.render);
      return this.render();
    };

    PandasPivotView.prototype.events = {
      "keyup .pandasgroup": 'pandasgroup',
      "keyup .pandasoffset": 'pandasoffset',
      "keyup .pandassize": 'pandassize',
      "change .pandasagg": 'pandasagg',
      "change .tablecontrolstate": 'tablecontrolstate',
      "click .pandasbeginning": 'pandasbeginning',
      "click .pandasback": 'pandasback',
      "click .pandasnext": 'pandasnext',
      "click .pandasend": 'pandasend',
      "click .controlsmore": 'toggle_more_controls',
      "click .pandascolumn": 'sort',
      "click .pandasrow": 'rowclick',
      "click .filterselected": 'toggle_filterselected',
      "click .clearselected": 'clearselected',
      "keyup .computedtxtbox": 'computedtxtbox',
      "click .column_del": "column_del",
      "keyup .search": 'search'
    };

    PandasPivotView.prototype.search = function(e) {
      var code, source;
      if (e.keyCode === ENTER) {
        code = $(e.currentTarget).val();
        source = this.model.get_obj('source');
        source.rpc('search', [code]);
        return e.preventDefault();
      }
    };

    PandasPivotView.prototype.column_del = function(e) {
      var computed_columns, name, old, source;
      source = this.model.get_obj('source');
      old = source.get('computed_columns');
      name = $(e.currentTarget).attr('name');
      computed_columns = _.filter(old, function(x) {
        return x.name !== name;
      });
      return source.rpc('set_computed_columns', [computed_columns]);
    };

    PandasPivotView.prototype.computedtxtbox = function(e) {
      var code, name, old, source;
      if (e.keyCode === ENTER) {
        name = this.$('.computedname').val();
        code = this.$('.computedtxtbox').val();
        source = this.model.get_obj('source');
        old = source.get('computed_columns');
        old.push({
          name: name,
          code: code
        });
        source.rpc('set_computed_columns', [old]);
        return e.preventDefault();
      }
    };

    PandasPivotView.prototype.clearselected = function(e) {
      return this.model.rpc('setselect', [[]]);
    };

    PandasPivotView.prototype.toggle_filterselected = function(e) {
      var checked;
      checked = this.$('.filterselected').is(":checked");
      this.mset('filterselected', checked);
      return this.model.save();
    };

    PandasPivotView.prototype.rowclick = function(e) {
      var count, counts, idx, index, ratio, ratios, resp, rownum, select, selected;
      counts = this.counts();
      selected = this.selected();
      ratios = (function() {
        var _i, _len, _ref4, _ref5, _results;
        _ref4 = _.zip(selected, counts);
        _results = [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          _ref5 = _ref4[_i], select = _ref5[0], count = _ref5[1];
          _results.push(select / count);
        }
        return _results;
      })();
      selected = (function() {
        var _i, _len, _results;
        _results = [];
        for (idx = _i = 0, _len = ratios.length; _i < _len; idx = ++_i) {
          ratio = ratios[idx];
          if (ratio > 0.5) {
            _results.push(idx);
          }
        }
        return _results;
      })();
      rownum = Number($(e.currentTarget).attr('rownum'));
      index = selected.indexOf(rownum);
      if (index === -1) {
        resp = this.model.rpc('select', [[rownum]]);
      } else {
        resp = this.model.rpc('deselect', [[rownum]]);
      }
      return null;
    };

    PandasPivotView.prototype.sort = function(e) {
      var colname;
      colname = $(e.currentTarget).text();
      return this.model.toggle_column_sort(colname);
    };

    PandasPivotView.prototype.toggle_more_controls = function() {
      if (this.controls_hide) {
        this.controls_hide = false;
      } else {
        this.controls_hide = true;
      }
      return this.render();
    };

    PandasPivotView.prototype.pandasbeginning = function() {
      return this.model.go_beginning();
    };

    PandasPivotView.prototype.pandasback = function() {
      return this.model.go_back();
    };

    PandasPivotView.prototype.pandasnext = function() {
      return this.model.go_forward();
    };

    PandasPivotView.prototype.pandasend = function() {
      return this.model.go_end();
    };

    PandasPivotView.prototype.pandasoffset = function(e) {
      var offset;
      if (e.keyCode === ENTER) {
        offset = this.$el.find('.pandasoffset').val();
        offset = Number(offset);
        if (_.isNaN(offset)) {
          offset = this.model.defaults.offset;
        }
        this.model.save('offset', offset, {
          wait: true
        });
        return e.preventDefault();
      }
    };

    PandasPivotView.prototype.pandassize = function(e) {
      var size, sizetxt;
      if (e.keyCode === ENTER) {
        sizetxt = this.$el.find('.pandassize').val();
        size = Number(sizetxt);
        if (_.isNaN(size) || sizetxt === "") {
          size = this.model.defaults.length;
        }
        if (size + this.mget('offset') > this.mget('maxlength')) {
          size = this.mget('maxlength') - this.mget('offset');
        }
        this.model.save('length', size, {
          wait: true
        });
        return e.preventDefault();
      }
    };

    PandasPivotView.prototype.tablecontrolstate = function() {
      return this.mset('tablecontrolstate', this.$('.tablecontrolstate').val());
    };

    PandasPivotView.prototype.pandasagg = function() {
      return this.model.save('agg', this.$el.find('.pandasagg').val(), {
        'wait': true
      });
    };

    PandasPivotView.prototype.fromcsv = function(str) {
      if (!str) {
        return [];
      }
      return _.map(str.split(","), function(x) {
        return x.trim();
      });
    };

    PandasPivotView.prototype.pandasgroup = function(e) {
      if (e.keyCode === ENTER) {
        this.model.set({
          group: this.fromcsv(this.$el.find(".pandasgroup").val()),
          offset: 0
        });
        this.model.save();
        e.preventDefault();
        return false;
      }
    };

    PandasPivotView.prototype.counts = function() {
      return this.mget('tabledata').data._counts;
    };

    PandasPivotView.prototype.selected = function() {
      return this.mget('tabledata').data._selected;
    };

    PandasPivotView.prototype.colors = function() {
      var counts, selected;
      counts = this.counts();
      selected = this.selected();
      if (counts && selected) {
        return _.map(_.zip(counts, selected), function(temp) {
          var alpha, count;
          count = temp[0], selected = temp[1];
          alpha = 0.3 * selected / count;
          return "rgba(0,0,255," + alpha + ")";
        });
      } else {
        return null;
      }
    };

    PandasPivotView.prototype.render = function() {
      var colors, group, html, obj, sort, sort_ascendings, source, template_data, _i, _len, _ref4;
      group = this.mget('group');
      if (_.isArray(group)) {
        group = group.join(",");
      }
      sort = this.mget('sort');
      if (_.isArray(sort)) {
        sort = sort.join(",");
      }
      colors = this.colors();
      sort_ascendings = {};
      _ref4 = this.mget('sort');
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        obj = _ref4[_i];
        sort_ascendings[obj['column']] = obj['ascending'];
      }
      source = this.mget_obj('source');
      template_data = {
        skip: {
          _counts: true,
          _selected: true,
          index: true
        },
        tablecontrolstate: this.mget('tablecontrolstate'),
        computed_columns: this.mget_obj('source').get('computed_columns'),
        columns: this.mget('tabledata').column_names,
        data: this.mget('tabledata').data,
        group: group,
        sort_ascendings: sort_ascendings,
        height: this.mget('height'),
        width: this.mget('width'),
        offset: this.mget('offset'),
        length: this.model.length(),
        filterselected: this.mget('filterselected'),
        totallength: this.mget('totallength'),
        counts: this.mget('tabledata').data._counts,
        selected: this.mget('tabledata').data._selected,
        controls_hide: this.controls_hide,
        colors: colors,
        index: this.mget('tabledata').data.index
      };
      this.$el.empty();
      html = this.template(template_data);
      this.$el.html(html);
      this.$(".pandasagg").find("option[value=\"" + (this.mget('agg')) + "\"]").attr('selected', 'selected');
      this.$(".tablecontrolstate").find("option[value=\"" + (this.mget('tablecontrolstate')) + "\"]").attr('selected', 'selected');
      return this.$el.addClass("bokehtable");
    };

    return PandasPivotView;

  })(ContinuumView);

  PandasPivotTable = (function(_super) {
    __extends(PandasPivotTable, _super);

    function PandasPivotTable() {
      this.toggle_column_sort = __bind(this.toggle_column_sort, this);
      this.dinitialize = __bind(this.dinitialize, this);
      _ref4 = PandasPivotTable.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    PandasPivotTable.prototype.type = 'PandasPivotTable';

    PandasPivotTable.prototype.initialize = function(attrs, options) {
      var _this = this;
      PandasPivotTable.__super__.initialize.call(this, attrs, options);
      return this.throttled_fetch = _.throttle((function() {
        return _this.fetch();
      }), 500);
    };

    PandasPivotTable.prototype.dinitialize = function(attrs, options) {
      return PandasPivotTable.__super__.dinitialize.call(this, attrs, options);
    };

    PandasPivotTable.prototype.fetch = function(options) {
      return PandasPivotTable.__super__.fetch.call(this, options);
    };

    PandasPivotTable.prototype.length = function() {
      return _.values(this.get('tabledata').data)[0].length;
    };

    PandasPivotTable.prototype.toggle_column_sort = function(colname) {
      var sort, sorting;
      sorting = this.get('sort');
      this.unset('sort', {
        'silent': true
      });
      sort = _.filter(sorting, function(x) {
        return x['column'] === colname;
      });
      if (sort.length > 0) {
        sort = sort[0];
      } else {
        sorting = _.clone(sorting);
        sorting.push({
          column: colname,
          ascending: true
        });
        this.save('sort', sorting, {
          'wait': true
        });
        return;
      }
      if (sort['ascending']) {
        sort['ascending'] = false;
        this.save('sort', sorting, {
          'wait': true
        });
      } else {
        sorting = _.filter(sorting, function(x) {
          return x['column'] !== colname;
        });
        this.save('sort', sorting, {
          'wait': true
        });
      }
    };

    PandasPivotTable.prototype.go_beginning = function() {
      this.set('offset', 0);
      return this.save();
    };

    PandasPivotTable.prototype.go_back = function() {
      var offset;
      offset = this.get('offset');
      offset = offset - this.length();
      if (offset < 0) {
        offset = 0;
      }
      this.set('offset', offset);
      return this.save();
    };

    PandasPivotTable.prototype.go_forward = function() {
      var maxoffset, offset;
      offset = this.get('offset');
      offset = offset + this.length();
      maxoffset = this.get('maxlength') - this.length();
      if (offset > maxoffset) {
        offset = maxoffset;
      }
      this.set('offset', offset);
      return this.save();
    };

    PandasPivotTable.prototype.go_end = function() {
      var maxoffset;
      maxoffset = this.get('maxlength') - this.length();
      this.set('offset', maxoffset);
      return this.save();
    };

    PandasPivotTable.prototype.defaults = {
      sort: [],
      group: [],
      agg: 'sum',
      offset: 0,
      length: 100,
      maxlength: 1000,
      tabledata: null,
      columns_names: [],
      width: null,
      tablecontrolstate: 'groupby'
    };

    PandasPivotTable.prototype.default_view = PandasPivotView;

    return PandasPivotTable;

  })(HasParent);

  coll = Collection.extend({
    model: PandasPivotTable
  });

  exports.pandaspivottables = new coll();

}).call(this);
}, "pandas/pandaspivot": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var column, computed_column, idx, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
    
      __out.push('<form class="form-inline tablecontrolform">\n<label>Transform </label>:  <select class="tablecontrolstate">\n    <option value="groupby" selected="selected">Group By</option>\n    <option value="filtering">Filtering</option>\n    <option value="computed">Computed Columns</option>\n  </select>\n  <br/>\n  ');
    
      if (this.tablecontrolstate === 'groupby') {
        __out.push('\n  <label>GroupBy </label>\n  <input type="text" class="pandasgroup" value="');
        __out.push(__sanitize(this.group));
        __out.push('"/>\n  <label>Aggregation</label>\n  <select class="pandasagg">\n    <option value="sum">sum</option>\n    <option value="mean">mean</option>\n    <option value="std">std</option>\n    <option value="max">max</option>\n    <option value="min">min</option>\n  </select>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.tablecontrolstate === 'filtering') {
        __out.push('\n  <label class="checkbox" >\n    ');
        if (this.filterselected) {
          __out.push('\n    <input type="checkbox" class="filterselected" checked="checked"/>\n    ');
        } else {
          __out.push('\n    <input type="checkbox" class="filterselected"/>\n    ');
        }
        __out.push('\n    Filter Selection\n  </label>\n  <input type="button" class="clearselected btn btn-mini" value="Clear Selection"/>\n  <label>\n    Search\n  </label>\n  <input type="text" class="search input-large"/>\n  ');
      }
    
      __out.push('\n  \n  ');
    
      if (this.tablecontrolstate === 'computed') {
        __out.push('\n  <table class="table">\n    <thead>\n      <th>\n        Name\n      </th>\n      <th>\n        Value\n      </th>\n      <th>\n      </th>\n    </thead>\n    ');
        _ref = this.computed_columns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          computed_column = _ref[_i];
          __out.push('\n    <tr>\n      <td>\n        ');
          __out.push(__sanitize(computed_column.name));
          __out.push('\n      </td>\n      <td>\n        ');
          __out.push(__sanitize(computed_column.code));
          __out.push('\n      </td>\n      <td>\n        <a class="column_del" \n           name="');
          __out.push(__sanitize(computed_column.name));
          __out.push('" href="#">[delete]</a>\n      </td>\n    </tr>\n    ');
        }
        __out.push('\n    <tr>\n      <td>\n        <input type="text" class="computedname input-mini"/>\n      </td>\n      <td>\n        <input type="text" class="computedtxtbox input-medium"/>\n      </td>\n      <td>\n      </td>\n    </tr>\n  </table>\n  ');
      }
    
      __out.push('\n  \n</form>\n\n<table class="bokehdatatable table table-bordered"\n');
    
      if (this.width) {
        __out.push('\n       style="max-height:');
        __out.push(__sanitize(this.height));
        __out.push('px;max-width:');
        __out.push(__sanitize(this.width));
        __out.push('px"\n');
      } else {
        __out.push('\n       style="max-height:');
        __out.push(__sanitize(this.height));
        __out.push('px"\n');
      }
    
      __out.push('\n       >\n  <thead>\n    ');
    
      if (this.counts) {
        __out.push('\n    <th>counts</th>\n    ');
      }
    
      __out.push('\n    <th>index</th>\n    ');
    
      _ref1 = this.columns;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        column = _ref1[_j];
        __out.push('\n    ');
        if (!this.skip[column]) {
          __out.push('\n    <th><a class="pandascolumn">');
          __out.push(__sanitize(column));
          __out.push('</a>\n      \n      ');
          if (this.sort_ascendings[column] === true) {
            __out.push('\n      <i class="icon-caret-up"></i>\n      ');
          } else if (this.sort_ascendings[column] === false) {
            __out.push('\n      <i class="icon-caret-down"></i>\n      ');
          }
          __out.push('\n      \n      ');
        }
        __out.push('\n    </th>\n    ');
      }
    
      __out.push('\n  </thead>\n  ');
    
      _ref2 = _.range(this.length);
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        idx = _ref2[_k];
        __out.push('\n  <tr class="pandasrow" rownum="');
        __out.push(__sanitize(idx));
        __out.push('">\n    ');
        if (this.selected && this.selected[idx]) {
          __out.push('\n      <td style="background-color:');
          __out.push(__sanitize(this.colors[idx]));
          __out.push('"> \n        ');
          __out.push(__sanitize(this.selected[idx]));
          __out.push('/');
          __out.push(__sanitize(this.counts[idx]));
          __out.push('\n      </td>      \n    ');
        } else {
          __out.push('\n      <td> ');
          __out.push(__sanitize(this.counts[idx]));
          __out.push(' </td>\n    ');
        }
        __out.push('\n    <td> ');
        __out.push(__sanitize(this.index[idx]));
        __out.push(' </td>\n    ');
        _ref3 = this.columns;
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          column = _ref3[_l];
          __out.push('\n      ');
          if (!this.skip[column]) {
            __out.push('    \n      <td> ');
            __out.push(__sanitize(this.data[column][idx]));
            __out.push(' </td>\n      ');
          }
          __out.push('\n    ');
        }
        __out.push('\n  </tr>\n  ');
      }
    
      __out.push('\n</table>\n<form>\n  <center>\n    <div class="btn-group pagination">\n      <button class="btn btn-mini">First</button>\n      <button class="btn btn-mini">Previous</button>\n      <button class="btn btn-mini">Next</button>\n      <button class="btn btn-mini">Last</button>  \n    </div>\n    <div class="paginatedisplay">\n      Show <input type="text" class="pandassize" value="');
    
      __out.push(__sanitize(this.length));
    
      __out.push('"> records\n      From <input type="text" class="pandasoffset" value="');
    
      __out.push(__sanitize(this.offset));
    
      __out.push('">\n      to ');
    
      __out.push(__sanitize(this.length + this.offset));
    
      __out.push(' - \n      Total : ');
    
      __out.push(__sanitize(this.totallength));
    
      __out.push('\n    </div>\n  </center>\n</form>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "renderers/annotation/legend": function(exports, require, module) {(function() {
  var HasParent, Legend, LegendView, PlotWidget, base, line_properties, properties, text_properties, textutils, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../../base');

  HasParent = base.HasParent;

  PlotWidget = require('../../common/plot_widget').PlotWidget;

  properties = require('../properties');

  textutils = require('../../common/textutils');

  line_properties = properties.line_properties;

  text_properties = properties.text_properties;

  "Legends:\n\nlegend_padding is the boundary between the legend and the edge of the plot\nlegend_spacing goes between each legend entry and the edge of the legend,\nas well as between 2 adjacent legend entries.  It is also the space between\nthe legend label, and the legend glyph.\n\nA legend in the top right corner looks like this\n\nplotborder\npadding\nlegendborder\nspacing\nlegendborder|spacing|label|spacing|glyph|spacing|legendborder|padding|plotborder\nspacing\nlegendborder|spacing|label|spacing|glyph|spacing|legendborder|padding|plotborder\nspacing\nborder\n";

  LegendView = (function(_super) {
    __extends(LegendView, _super);

    function LegendView() {
      _ref = LegendView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LegendView.prototype.initialize = function(options) {
      LegendView.__super__.initialize.call(this, options);
      return this.change_annotationspec();
    };

    LegendView.prototype.delegateEvents = function(events) {
      LegendView.__super__.delegateEvents.call(this, events);
      this.listenTo(this.model, 'change:annotationspec', this.change_annotationspec);
      return this.listenTo(this.plot_view.view_state, 'change', this.calc_dims);
    };

    LegendView.prototype.change_annotationspec = function() {
      this.annotationspec = this.mget('annotationspec');
      this.label_props = new text_properties(this, this.annotationspec, 'label_');
      this.border_props = new line_properties(this, this.annotationspec, 'border_');
      if (this.annotationspec.legend_names) {
        this.legend_names = this.annotationspec.legend_names;
      } else {
        this.legend_names = _.keys(this.annotationspec.legends);
      }
      return this.calc_dims();
    };

    LegendView.prototype.calc_dims = function(options) {
      var ctx, h_range, label_height, label_width, legend_padding, legend_spacing, orientation, text_width, text_widths, v_range, x, y, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      label_height = (_ref1 = this.annotationspec.label_height) != null ? _ref1 : this.mget('label_height');
      this.glyph_height = (_ref2 = this.annotationspec.glyph_height) != null ? _ref2 : this.mget('glyph_height');
      label_width = (_ref3 = this.annotationspec.label_width) != null ? _ref3 : this.mget('label_width');
      this.glyph_width = (_ref4 = this.annotationspec.glyph_width) != null ? _ref4 : this.mget('glyph_width');
      legend_spacing = (_ref5 = this.annotationspec.legend_spacing) != null ? _ref5 : this.mget('legend_spacing');
      this.label_height = _.max([textutils.getTextHeight(this.label_props.font(this)), label_height, this.glyph_height]);
      this.legend_height = this.label_height;
      this.legend_height = this.legend_names.length * this.legend_height + (1 + this.legend_names.length) * legend_spacing;
      ctx = this.plot_view.ctx;
      ctx.save();
      this.label_props.set(ctx, this);
      text_widths = _.map(this.legend_names, function(txt) {
        return ctx.measureText(txt).width;
      });
      ctx.restore();
      text_width = _.max(text_widths);
      this.label_width = _.max([text_width, label_width]);
      this.legend_width = this.label_width + this.glyph_width + 3 * legend_spacing;
      orientation = (_ref6 = this.annotationspec.orientation) != null ? _ref6 : this.mget('orientation');
      legend_padding = (_ref7 = this.annotationspec.legend_padding) != null ? _ref7 : this.mget('legend_padding');
      h_range = this.plot_view.view_state.get('inner_range_horizontal');
      v_range = this.plot_view.view_state.get('inner_range_vertical');
      if (orientation === "top_right") {
        x = h_range.get('end') - legend_padding - this.legend_width;
        y = v_range.get('end') - legend_padding;
      } else if (orientation === "top_left") {
        x = h_range.get('start') + legend_padding;
        y = v_range.get('end') - legend_padding;
      } else if (orientation === "bottom_left") {
        x = h_range.get('start') + legend_padding;
        y = v_range.get('start') + legend_padding + this.legend_height;
      } else if (orientation === "bottom_right") {
        x = h_range.get('end') - legend_padding - this.legend_width;
        y = v_range.get('start') + legend_padding + this.legend_height;
      } else if (orientation === "absolute") {
        _ref8 = this.annotationspec.absolute_coords, x = _ref8[0], y = _ref8[1];
      }
      x = this.plot_view.view_state.sx_to_device(x);
      y = this.plot_view.view_state.sy_to_device(y);
      return this.box_coords = [x, y];
    };

    LegendView.prototype.render = function() {
      var ctx, idx, legend_name, legend_spacing, renderer, view, x, x1, x2, y, y1, y2, yoffset, yspacing, _i, _j, _len, _len1, _ref1, _ref2, _ref3;
      ctx = this.plot_view.ctx;
      ctx.save();
      ctx.fillStyle = this.plot_model.get('background_fill');
      this.border_props.set(ctx, this);
      ctx.beginPath();
      ctx.rect(this.box_coords[0], this.box_coords[1], this.legend_width, this.legend_height);
      ctx.fill();
      ctx.stroke();
      this.label_props.set(ctx, this);
      legend_spacing = (_ref1 = this.annotationspec.legend_spacing) != null ? _ref1 : this.mget('legend_spacing');
      _ref2 = this.legend_names;
      for (idx = _i = 0, _len = _ref2.length; _i < _len; idx = ++_i) {
        legend_name = _ref2[idx];
        yoffset = idx * this.label_height;
        yspacing = (1 + idx) * legend_spacing;
        y = this.box_coords[1] + this.label_height / 2.0 + yoffset + yspacing;
        x = this.box_coords[0] + legend_spacing;
        x1 = this.box_coords[0] + 2 * legend_spacing + this.label_width;
        x2 = x1 + this.glyph_width;
        y1 = this.box_coords[1] + yoffset + yspacing;
        y2 = y1 + this.glyph_height;
        ctx.fillText(legend_name, x, y);
        _ref3 = this.model.resolve_ref(this.annotationspec.legends[legend_name]);
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          renderer = _ref3[_j];
          view = this.plot_view.renderers[renderer.id];
          view.draw_legend(ctx, x1, x2, y1, y2);
        }
      }
      return ctx.restore();
    };

    return LegendView;

  })(PlotWidget);

  Legend = (function(_super) {
    __extends(Legend, _super);

    function Legend() {
      _ref1 = Legend.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Legend.prototype.default_view = LegendView;

    Legend.prototype.type = 'AnnotationRenderer';

    return Legend;

  })(HasParent);

  Legend.prototype.defaults = _.clone(Legend.prototype.defaults);

  Legend.prototype.display_defaults = _.clone(Legend.prototype.display_defaults);

  _.extend(Legend.prototype.display_defaults, {
    level: 'overlay',
    border_line_color: 'black',
    border_line_width: 1,
    border_line_alpha: 1.0,
    border_line_join: 'miter',
    border_line_cap: 'butt',
    border_line_dash: [],
    border_line_dash_offset: 0,
    label_standoff: 15,
    label_text_font: "helvetica",
    label_text_font_size: "10pt",
    label_text_font_style: "normal",
    label_text_color: "#444444",
    label_text_alpha: 1.0,
    label_text_align: "center",
    label_text_baseline: "middle",
    glyph_height: 20,
    glyph_width: 20,
    label_height: 20,
    label_width: 50,
    legend_padding: 10,
    legend_spacing: 3,
    orientation: "top_right",
    label_text_align: "left",
    label_text_baseline: "middle",
    datapoint: null
  });

  exports.Legend = Legend;

}).call(this);
}, "renderers/annotation/title": function(exports, require, module) {(function() {


}).call(this);
}, "renderers/annotation_renderer": function(exports, require, module) {(function() {
  var AnnotationRenderers, Collections, annotations, base, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  annotations = require('./annotations');

  AnnotationRenderers = (function(_super) {
    __extends(AnnotationRenderers, _super);

    function AnnotationRenderers() {
      _ref = AnnotationRenderers.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AnnotationRenderers.prototype.model = function(attrs, options) {
      var model, type, _ref1;
      if (((_ref1 = attrs.annotationspec) != null ? _ref1.type : void 0) == null) {
        console.log("missing annotation type");
        return;
      }
      type = attrs.annotationspec.type;
      if (!(type in annotations)) {
        console.log("unknown annotation type '" + type + "'");
        return;
      }
      model = annotations[type];
      return new model(attrs, options);
    };

    return AnnotationRenderers;

  })(Backbone.Collection);

  exports.annotationrenderers = new AnnotationRenderers;

}).call(this);
}, "renderers/annotations": function(exports, require, module) {(function() {
  var legend;

  legend = require("./annotation/legend");

  exports.legend = legend.Legend;

}).call(this);
}, "renderers/glyph/annular_wedge": function(exports, require, module) {(function() {
  var AnnularWedge, AnnularWedgeView, Glyph, GlyphView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  AnnularWedgeView = (function(_super) {
    __extends(AnnularWedgeView, _super);

    function AnnularWedgeView() {
      _ref = AnnularWedgeView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AnnularWedgeView.prototype.initialize = function(options) {
      var spec;
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return AnnularWedgeView.__super__.initialize.call(this, options);
    };

    AnnularWedgeView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;
      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction:string'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    AnnularWedgeView.prototype._set_data = function(data) {
      var angle, dir, end_angle, i, start_angle, _i, _j, _k, _ref1, _ref2, _ref3, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      start_angle = this.glyph_props.v_select('start_angle', data);
      this.start_angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = start_angle.length; _i < _len; _i++) {
          angle = start_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      end_angle = this.glyph_props.v_select('end_angle', data);
      this.end_angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = end_angle.length; _i < _len; _i++) {
          angle = end_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.angle = new Float32Array(this.start_angle.length);
      for (i = _i = 0, _ref1 = this.start_angle.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        this.angle[i] = this.end_angle[i] - this.start_angle[i];
      }
      this.direction = new Uint8Array(this.data.length);
      for (i = _j = 0, _ref2 = this.data.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
        dir = this.glyph_props.select('direction', data[i]);
        if (dir === 'clock') {
          this.direction[i] = false;
        } else if (dir === 'anticlock') {
          this.direction[i] = true;
        } else {
          this.direction[i] = NaN;
        }
      }
      this.selected_mask = new Uint8Array(data.length);
      _results = [];
      for (i = _k = 0, _ref3 = this.selected_mask.length - 1; 0 <= _ref3 ? _k <= _ref3 : _k >= _ref3; i = 0 <= _ref3 ? ++_k : --_k) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    AnnularWedgeView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len, _ref1;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.inner_radius = this.distance(this.data, 'x', 'inner_radius', 'edge');
      this.outer_radius = this.distance(this.data, 'x', 'outer_radius', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, 'selected');
          this._full_path(ctx, this.nonselection_glyphprops, 'unselected');
        } else {
          this._full_path(ctx);
        }
      }
      return ctx.restore();
    };

    AnnularWedgeView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2;
      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i] + this.start_angle[i] + this.end_angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.start_angle[i]);
          ctx.moveTo(this.outer_radius[i], 0);
          ctx.beginPath();
          ctx.arc(0, 0, this.outer_radius[i], 0, this.angle[i], this.direction[i]);
          ctx.rotate(this.angle[i]);
          ctx.lineTo(this.inner_radius[i], 0);
          ctx.arc(0, 0, this.inner_radius[i], 0, -this.angle[i], !this.direction[i]);
          ctx.closePath();
          ctx.fill();
          ctx.rotate(-this.angle[i] - this.start_angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i] + this.start_angle[i] + this.end_angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.start_angle[i]);
          ctx.moveTo(this.outer_radius[i], 0);
          ctx.arc(0, 0, this.outer_radius[i], 0, this.angle[i], this.direction[i]);
          ctx.rotate(this.angle[i]);
          ctx.lineTo(this.inner_radius[i], 0);
          ctx.arc(0, 0, this.inner_radius[i], 0, -this.angle[i], !this.direction[i]);
          ctx.closePath();
          ctx.rotate(-this.angle[i] - this.start_angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
        return ctx.stroke();
      }
    };

    AnnularWedgeView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;
      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i] + this.start_angle[i] + this.end_angle[i])) {
          continue;
        }
        if (use_selection === 'selected' && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === 'unselected' && this.selected_mask[i]) {
          continue;
        }
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.start_angle[i]);
        ctx.moveTo(this.outer_radius[i], 0);
        ctx.beginPath();
        ctx.arc(0, 0, this.outer_radius[i], 0, this.angle[i], this.direction[i]);
        ctx.rotate(this.angle[i]);
        ctx.lineTo(this.inner_radius[i], 0);
        ctx.arc(0, 0, this.inner_radius[i], 0, -this.angle[i], !this.direction[i]);
        ctx.closePath();
        ctx.rotate(-this.angle[i] - this.start_angle[i]);
        ctx.translate(-this.sx[i], -this.sy[i]);
        if (this.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AnnularWedgeView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var angle, border, d, direction, end_angle, fill_props, glyph_props, glyph_settings, inner_radius, line_props, outer_radius, r, ratio, reference_point, start_angle, sx, sy;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        outer_radius = this.distance([reference_point], 'x', 'outer_radius', 'edge');
        outer_radius = outer_radius[0];
        inner_radius = this.distance([reference_point], 'x', 'inner_radius', 'edge');
        inner_radius = inner_radius[0];
        start_angle = -this.glyph_props.select('start_angle', reference_point);
        end_angle = -this.glyph_props.select('end_angle', reference_point);
      } else {
        glyph_settings = glyph_props;
        start_angle = -0.1;
        end_angle = -3.9;
      }
      angle = end_angle - start_angle;
      direction = this.glyph_props.select('direction', glyph_settings);
      direction = direction === "clock" ? false : true;
      border = line_props.select(line_props.line_width_name, glyph_settings);
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if ((outer_radius != null) || (inner_radius != null)) {
        ratio = r / outer_radius;
        outer_radius = r;
        inner_radius = inner_radius * ratio;
      } else {
        outer_radius = r;
        inner_radius = r / 2;
      }
      sx = (x1 + x2) / 2.0;
      sy = (y1 + y2) / 2.0;
      ctx.translate(sx, sy);
      ctx.rotate(start_angle);
      ctx.moveTo(outer_radius, 0);
      ctx.beginPath();
      ctx.arc(0, 0, outer_radius, 0, angle, direction);
      ctx.rotate(angle);
      ctx.lineTo(inner_radius, 0);
      ctx.arc(0, 0, inner_radius, 0, -angle, !direction);
      ctx.closePath();
      if (fill_props.do_fill) {
        fill_props.set(ctx, glyph_settings);
        ctx.fill();
      }
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    AnnularWedgeView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;
      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return AnnularWedgeView;

  })(GlyphView);

  AnnularWedge = (function(_super) {
    __extends(AnnularWedge, _super);

    function AnnularWedge() {
      _ref1 = AnnularWedge.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    AnnularWedge.prototype.default_view = AnnularWedgeView;

    AnnularWedge.prototype.type = 'GlyphRenderer';

    return AnnularWedge;

  })(Glyph);

  AnnularWedge.prototype.display_defaults = _.clone(AnnularWedge.prototype.display_defaults);

  _.extend(AnnularWedge.prototype.display_defaults, {
    direction: 'anticlock',
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.AnnularWedge = AnnularWedge;

  exports.AnnularWedgeView = AnnularWedgeView;

}).call(this);
}, "renderers/glyph/annulus": function(exports, require, module) {(function() {
  var Annulus, AnnulusView, Glyph, GlyphView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  AnnulusView = (function(_super) {
    __extends(AnnulusView, _super);

    function AnnulusView() {
      _ref = AnnulusView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AnnulusView.prototype.initialize = function(options) {
      var spec;
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return AnnulusView.__super__.initialize.call(this, options);
    };

    AnnulusView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;
      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'inner_radius', 'outer_radius'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    AnnulusView.prototype._set_data = function(data) {
      var i, _i, _ref1, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      this.selected_mask = new Uint8Array(data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.selected_mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    AnnulusView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len, _ref1;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.inner_radius = this.distance(this.data, 'x', 'inner_radius', 'edge');
      this.outer_radius = this.distance(this.data, 'x', 'outer_radius', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      if (this.glyph_props.fast_path) {
        return this._fast_path(ctx);
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, 'selected');
          this._full_path(ctx, this.nonselection_glyphprops, 'unselected');
        } else {
          this._full_path(ctx);
        }
        return ctx.restore();
      }
    };

    AnnulusView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2, _results;
      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.inner_radius[i], 0, 2 * Math.PI * 2, false);
          ctx.arc(this.sx[i], this.sy[i], this.outer_radius[i], 0, 2 * Math.PI * 2, true);
          ctx.fill();
        }
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        _results = [];
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.inner_radius[i], 0, 2 * Math.PI * 2, false);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.outer_radius[i], 0, 2 * Math.PI * 2, true);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    AnnulusView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;
      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i])) {
          continue;
        }
        if (use_selection === 'selected' && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === 'unselected' && this.selected_mask[i]) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(this.sx[i], this.sy[i], this.inner_radius[i], 0, 2 * Math.PI * 2, false);
        ctx.moveTo(this.sx[i] + this.outer_radius[i], this.sy[i]);
        ctx.arc(this.sx[i], this.sy[i], this.outer_radius[i], 0, 2 * Math.PI * 2, true);
        if (this.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AnnulusView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, d, fill_props, glyph_props, glyph_settings, inner_radius, line_props, outer_radius, r, ratio, reference_point, sx, sy;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        outer_radius = this.distance([reference_point], 'x', 'outer_radius', 'edge');
        outer_radius = outer_radius[0];
        inner_radius = this.distance([reference_point], 'x', 'inner_radius', 'edge');
        inner_radius = inner_radius[0];
      } else {
        glyph_settings = glyph_props;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if ((outer_radius != null) || (inner_radius != null)) {
        ratio = r / outer_radius;
        outer_radius = r;
        inner_radius = inner_radius * ratio;
      } else {
        outer_radius = r;
        inner_radius = r / 2;
      }
      sx = (x1 + x2) / 2.0;
      sy = (y1 + y2) / 2.0;
      ctx.beginPath();
      ctx.arc(sx, sy, inner_radius, 0, 2 * Math.PI * 2, false);
      ctx.moveTo(sx + outer_radius, sy);
      ctx.arc(sx, sy, outer_radius, 0, 2 * Math.PI * 2, true);
      if (fill_props.do_fill) {
        fill_props.set(ctx, glyph_settings);
        ctx.fill();
      }
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    AnnulusView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;
      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return AnnulusView;

  })(GlyphView);

  Annulus = (function(_super) {
    __extends(Annulus, _super);

    function Annulus() {
      _ref1 = Annulus.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Annulus.prototype.default_view = AnnulusView;

    Annulus.prototype.type = 'GlyphRenderer';

    return Annulus;

  })(Glyph);

  Annulus.prototype.display_defaults = _.clone(Annulus.prototype.display_defaults);

  _.extend(Annulus.prototype.display_defaults, {
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Annulus = Annulus;

  exports.AnnulusView = AnnulusView;

}).call(this);
}, "renderers/glyph/arc": function(exports, require, module) {(function() {
  var Arc, ArcView, Glyph, GlyphView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  ArcView = (function(_super) {
    __extends(ArcView, _super);

    function ArcView() {
      _ref = ArcView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ArcView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return ArcView.__super__.initialize.call(this, options);
    };

    ArcView.prototype._set_data = function(data) {
      var angle, dir, end_angle, i, start_angle, _i, _ref1, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      start_angle = this.glyph_props.v_select('start_angle', data);
      this.start_angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = start_angle.length; _i < _len; _i++) {
          angle = start_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      end_angle = this.glyph_props.v_select('end_angle', data);
      this.end_angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = end_angle.length; _i < _len; _i++) {
          angle = end_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.direction = new Uint8Array(this.data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.data.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        dir = this.glyph_props.select('direction', data[i]);
        if (dir === 'clock') {
          _results.push(this.direction[i] = false);
        } else if (dir === 'anticlock') {
          _results.push(this.direction[i] = true);
        } else {
          _results.push(this.direction[i] = NaN);
        }
      }
      return _results;
    };

    ArcView.prototype._render = function() {
      var ctx, _ref1;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.radius = this.distance(this.data, 'x', 'radius', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    ArcView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1, _results;
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        _results = [];
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    ArcView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;
      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    ArcView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, d, data_r, direction, end_angle, glyph_props, glyph_settings, line_props, r, reference_point, start_angle;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_r = this.distance([reference_point], 'x', 'radius', 'edge')[0];
        start_angle = -this.glyph_props.select('start_angle', reference_point);
        end_angle = -this.glyph_props.select('end_angle', reference_point);
      } else {
        glyph_settings = glyph_props;
        start_angle = -0.1;
        end_angle = -3.9;
      }
      direction = this.glyph_props.select('direction', glyph_settings);
      direction = direction === "clock" ? false : true;
      border = line_props.select(line_props.line_width_name, glyph_settings);
      ctx.beginPath();
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if (data_r != null) {
        r = data_r > r ? r : data_r;
      }
      ctx.arc((x1 + x2) / 2.0, (y1 + y2) / 2.0, r, start_angle, end_angle, direction);
      line_props.set(ctx, glyph_settings);
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    return ArcView;

  })(GlyphView);

  Arc = (function(_super) {
    __extends(Arc, _super);

    function Arc() {
      _ref1 = Arc.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Arc.prototype.default_view = ArcView;

    Arc.prototype.type = 'GlyphRenderer';

    return Arc;

  })(Glyph);

  Arc.prototype.display_defaults = _.clone(Arc.prototype.display_defaults);

  _.extend(Arc.prototype.display_defaults, {
    direction: 'anticlock',
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Arc = Arc;

  exports.ArcView = ArcView;

}).call(this);
}, "renderers/glyph/bezier": function(exports, require, module) {(function() {
  var Bezier, BezierView, Glyph, GlyphView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  BezierView = (function(_super) {
    __extends(BezierView, _super);

    function BezierView() {
      _ref = BezierView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BezierView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return BezierView.__super__.initialize.call(this, options);
    };

    BezierView.prototype._set_data = function(data) {
      this.data = data;
      this.x0 = this.glyph_props.v_select('x0', data);
      this.y0 = this.glyph_props.v_select('y0', data);
      this.x1 = this.glyph_props.v_select('x1', data);
      this.y1 = this.glyph_props.v_select('y1', data);
      this.cx0 = this.glyph_props.v_select('cx0', data);
      this.cy0 = this.glyph_props.v_select('cy0', data);
      this.cx1 = this.glyph_props.v_select('cx1', data);
      return this.cy1 = this.glyph_props.v_select('cy1', data);
    };

    BezierView.prototype._render = function() {
      var ctx, _ref1, _ref2, _ref3, _ref4;
      _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
      _ref3 = this.plot_view.map_to_screen(this.cx0, this.glyph_props.cx0.units, this.cy0, this.glyph_props.cy0.units), this.scx0 = _ref3[0], this.scy0 = _ref3[1];
      _ref4 = this.plot_view.map_to_screen(this.cx1, this.glyph_props.cx1.units, this.cy1, this.glyph_props.cy1.units), this.scx1 = _ref4[0], this.scy1 = _ref4[1];
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    BezierView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1;
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx0[i] + this.scy0[i] + this.scx1[i] + this.scy1[i])) {
            continue;
          }
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.bezierCurveTo(this.scx0[i], this.scy0[i], this.scx1[i], this.scy1[i], this.sx1[i], this.sy1[i]);
        }
        return ctx.stroke();
      }
    };

    BezierView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;
      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx0[i] + this.scy0[i] + this.scx1[i] + this.scy1[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.bezierCurveTo(this.scx0[i], this.scy0[i], this.scx1[i], this.scy1[i], this.sx1[i], this.sy1[i]);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    return BezierView;

  })(GlyphView);

  Bezier = (function(_super) {
    __extends(Bezier, _super);

    function Bezier() {
      _ref1 = Bezier.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Bezier.prototype.default_view = BezierView;

    Bezier.prototype.type = 'GlyphRenderer';

    return Bezier;

  })(Glyph);

  Bezier.prototype.display_defaults = _.clone(Bezier.prototype.display_defaults);

  _.extend(Bezier.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Bezier = Bezier;

  exports.BezierView = BezierView;

}).call(this);
}, "renderers/glyph/circle": function(exports, require, module) {(function() {
  var Circle, CircleView, Glyph, GlyphView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  CircleView = (function(_super) {
    __extends(CircleView, _super);

    function CircleView() {
      _ref = CircleView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CircleView.prototype.initialize = function(options) {
      var spec;
      CircleView.__super__.initialize.call(this, options);
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      return this.have_new_data = false;
    };

    CircleView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;
      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'radius'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    CircleView.prototype._set_data = function(data) {
      var i, _i, _ref1;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      this.mask = new Uint8Array(data.length);
      this.selected_mask = new Uint8Array(data.length);
      for (i = _i = 0, _ref1 = this.mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        this.mask[i] = true;
        this.selected_mask[i] = false;
      }
      return this.have_new_data = true;
    };

    CircleView.prototype._render = function(plot_view, have_new_mapper_state) {
      var ctx, i, idx, oh, ow, props, selected, _i, _j, _len, _ref1, _ref2;
      if (have_new_mapper_state == null) {
        have_new_mapper_state = true;
      }
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      ow = this.plot_view.view_state.get('outer_width');
      oh = this.plot_view.view_state.get('outer_height');
      if (this.have_new_data || have_new_mapper_state) {
        this.radius = this.distance(this.data, 'x', 'radius', 'edge');
        this.have_new_data = false;
      }
      ow = this.plot_view.view_state.get('outer_width');
      oh = this.plot_view.view_state.get('outer_height');
      for (i = _i = 0, _ref2 = this.mask.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if ((this.sx[i] + this.radius[i]) < 0 || (this.sx[i] - this.radius[i]) > ow || (this.sy[i] + this.radius[i]) < 0 || (this.sy[i] - this.radius[i]) > oh) {
          this.mask[i] = false;
        } else {
          this.mask[i] = true;
        }
      }
      selected = this.mget_obj('data_source').get('selected');
      for (_j = 0, _len = selected.length; _j < _len; _j++) {
        idx = selected[_j];
        this.selected_mask[idx] = true;
      }
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._fast_path(ctx, props, true);
          this._fast_path(ctx, this.nonselection_glyphprops, false);
        } else {
          this._fast_path(ctx);
        }
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, true);
          this._full_path(ctx, this.nonselection_glyphprops, false);
        } else {
          this._full_path(ctx);
        }
      }
      return ctx.restore();
    };

    CircleView.prototype._fast_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _j, _ref1, _ref2, _results;
      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      if (glyph_props.fill_properties.do_fill) {
        glyph_props.fill_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i]) || !this.mask[i]) {
            continue;
          }
          if (use_selection && !this.selected_mask[i]) {
            continue;
          }
          if (use_selection === false && this.selected_mask[i]) {
            continue;
          }
          ctx.moveTo(this.sx[i], this.sy[i]);
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], 0, 2 * Math.PI, false);
        }
        ctx.fill();
      }
      if (glyph_props.line_properties.do_stroke) {
        glyph_props.line_properties.set(ctx, this.glyph_props);
        _results = [];
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i]) || !this.mask[i]) {
            continue;
          }
          if (use_selection && !this.selected_mask[i]) {
            continue;
          }
          if (use_selection === false && this.selected_mask[i]) {
            continue;
          }
          ctx.moveTo(this.sx[i], this.sy[i]);
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], 0, 2 * Math.PI, false);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    CircleView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;
      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.radius[i]) || !this.mask[i]) {
          continue;
        }
        if (use_selection && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === false && this.selected_mask[i]) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(this.sx[i], this.sy[i], this.radius[i], 0, 2 * Math.PI, false);
        if (glyph_props.fill_properties.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (glyph_props.line_properties.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    CircleView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;
      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    CircleView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, d, data_r, fill_props, glyph_props, glyph_settings, line_props, r, reference_point;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_r = this.distance([reference_point], 'x', 'radius', 'edge')[0];
      } else {
        glyph_settings = glyph_props;
        data_r = glyph_props.select('radius', glyph_props)["default"];
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      ctx.beginPath();
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if (data_r != null) {
        r = data_r > r ? r : data_r;
      }
      ctx.arc((x1 + x2) / 2.0, (y1 + y2) / 2.0, r, 2 * Math.PI, false);
      if (fill_props.do_fill) {
        fill_props.set(ctx, glyph_settings);
        ctx.fill();
      }
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    return CircleView;

  })(GlyphView);

  Circle = (function(_super) {
    __extends(Circle, _super);

    function Circle() {
      _ref1 = Circle.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Circle.prototype.default_view = CircleView;

    Circle.prototype.type = 'GlyphRenderer';

    return Circle;

  })(Glyph);

  Circle.prototype.display_defaults = _.clone(Circle.prototype.display_defaults);

  _.extend(Circle.prototype.display_defaults, {
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Circle = Circle;

  exports.CircleView = CircleView;

}).call(this);
}, "renderers/glyph/glyph": function(exports, require, module) {(function() {
  var Glyph, GlyphView, HasParent, PlotWidget, base, safebind, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../../base');

  HasParent = base.HasParent;

  safebind = base.safebind;

  PlotWidget = require('../../common/plot_widget').PlotWidget;

  GlyphView = (function(_super) {
    __extends(GlyphView, _super);

    function GlyphView() {
      _ref = GlyphView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GlyphView.prototype.initialize = function(options) {
      GlyphView.__super__.initialize.call(this, options);
      return this.need_set_data = true;
    };

    GlyphView.prototype.set_data = function(request_render) {
      var data, source;
      if (request_render == null) {
        request_render = true;
      }
      source = this.mget_obj('data_source');
      if (source.type === 'ObjectArrayDataSource') {
        data = source.get('data');
      } else if (source.type === 'ColumnDataSource') {
        data = source.datapoints();
      } else if (source.type === 'PandasPlotSource') {
        data = source.datapoints();
      } else {
        console.log('Unknown data source type: ' + source.type);
      }
      this._set_data(data);
      if (request_render) {
        return this.request_render();
      }
    };

    GlyphView.prototype.render = function(have_new_mapper_state) {
      if (have_new_mapper_state == null) {
        have_new_mapper_state = true;
      }
      if (this.need_set_data) {
        this.set_data(false);
        this.need_set_data = false;
      }
      return this._render(this.plot_view, have_new_mapper_state);
    };

    GlyphView.prototype.select = function() {
      return 'pass';
    };

    GlyphView.prototype.xrange = function() {
      return this.plot_view.x_range;
    };

    GlyphView.prototype.yrange = function() {
      return this.plot_view.y_range;
    };

    GlyphView.prototype.bind_bokeh_events = function() {
      this.listenTo(this.model, 'change', this.request_render);
      return this.listenTo(this.mget_obj('data_source'), 'change', this.set_data);
    };

    GlyphView.prototype.distance = function(data, pt, span, position) {
      var d, halfspan, i, mapper, pt0, pt1, pt_units, ptc, span_units, spt0, spt1;
      pt_units = this.glyph_props[pt].units;
      span_units = this.glyph_props[span].units;
      if (pt === 'x') {
        mapper = this.plot_view.xmapper;
      } else if (pt === 'y') {
        mapper = this.plot_view.ymapper;
      }
      span = this.glyph_props.v_select(span, data);
      if (span_units === 'screen') {
        return span;
      }
      if (position === 'center') {
        halfspan = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = span.length; _i < _len; _i++) {
            d = span[_i];
            _results.push(d / 2);
          }
          return _results;
        })();
        ptc = this.glyph_props.v_select(pt, data);
        if (pt_units === 'screen') {
          ptc = mapper.v_map_from_target(ptc);
        }
        pt0 = (function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = ptc.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push(ptc[i] - halfspan[i]);
          }
          return _results;
        })();
        pt1 = (function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = ptc.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push(ptc[i] + halfspan[i]);
          }
          return _results;
        })();
      } else {
        pt0 = this.glyph_props.v_select(pt, data);
        if (pt_units === 'screen') {
          pt0 = mapper.v_map_from_target(pt0);
        }
        pt1 = (function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = pt0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push(pt0[i] + span[i]);
          }
          return _results;
        })();
      }
      spt0 = mapper.v_map_to_target(pt0);
      spt1 = mapper.v_map_to_target(pt1);
      return (function() {
        var _i, _ref1, _results;
        _results = [];
        for (i = _i = 0, _ref1 = spt0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          _results.push(spt1[i] - spt0[i]);
        }
        return _results;
      })();
    };

    GlyphView.prototype.get_reference_point = function() {
      var reference_point;
      reference_point = this.mget('reference_point');
      if (_.isNumber(reference_point)) {
        return this.data[reference_point];
      } else {
        return reference_point;
      }
    };

    GlyphView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {};

    return GlyphView;

  })(PlotWidget);

  Glyph = (function(_super) {
    __extends(Glyph, _super);

    function Glyph() {
      _ref1 = Glyph.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return Glyph;

  })(HasParent);

  Glyph.prototype.defaults = _.clone(Glyph.prototype.defaults);

  _.extend(Glyph.prototype.defaults, {
    data_source: null
  });

  Glyph.prototype.display_defaults = _.clone(Glyph.prototype.display_defaults);

  _.extend(Glyph.prototype.display_defaults, {
    level: 'glyph',
    radius_units: 'screen',
    length_units: 'screen',
    angle_units: 'deg',
    start_angle_units: 'deg',
    end_angle_units: 'deg'
  });

  exports.GlyphView = GlyphView;

  exports.Glyph = Glyph;

}).call(this);
}, "renderers/glyph/image": function(exports, require, module) {(function() {
  var ColorMapper, Glyph, GlyphView, ImageGlyph, ImageView, all_palettes, glyph, glyph_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  all_palettes = require('../../palettes/palettes').all_palettes;

  ColorMapper = require('../../mappers/color/linear_color_mapper').LinearColorMapper;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  ImageView = (function(_super) {
    __extends(ImageView, _super);

    function ImageView() {
      _ref = ImageView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImageView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['image:array', 'width', 'height', 'x', 'y', 'dw', 'dh', 'palette:string'], []);
      return ImageView.__super__.initialize.call(this, options);
    };

    ImageView.prototype._set_data = function(data) {
      var buf, buf8, canvas, cmap, ctx, h, height, i, image_data, img, obj, width, _i, _j, _ref1, _ref2, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      h = this.glyph_props.v_select('dh', data);
      for (i = _i = 0, _ref1 = this.y.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        this.y[i] += h[i];
      }
      this.pal = this.glyph_props.v_select('palette', data);
      width = this.glyph_props.v_select('width', data);
      height = this.glyph_props.v_select('height', data);
      img = (function() {
        var _j, _len, _results;
        _results = [];
        for (_j = 0, _len = data.length; _j < _len; _j++) {
          obj = data[_j];
          _results.push(this.glyph_props.select('image', obj));
        }
        return _results;
      }).call(this);
      this.image_data = new Array(data.length);
      _results = [];
      for (i = _j = 0, _ref2 = data.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
        canvas = document.createElement('canvas');
        canvas.width = width[i];
        canvas.height = height[i];
        ctx = canvas.getContext('2d');
        image_data = ctx.getImageData(0, 0, width[i], height[i]);
        cmap = new ColorMapper({}, {
          palette: all_palettes[this.pal[i]]
        });
        buf = cmap.v_map_screen(img[i]);
        buf8 = new Uint8ClampedArray(buf);
        image_data.data.set(buf8);
        ctx.putImageData(image_data, 0, 0);
        _results.push(this.image_data[i] = canvas);
      }
      return _results;
    };

    ImageView.prototype._render = function() {
      var ctx, i, old_smoothing, y_offset, _i, _ref1, _ref2;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'dw', 'edge');
      this.sh = this.distance(this.data, 'y', 'dh', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      old_smoothing = ctx.getImageSmoothingEnabled();
      ctx.setImageSmoothingEnabled(false);
      for (i = _i = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i])) {
          continue;
        }
        y_offset = this.sy[i] + this.sh[i] / 2;
        ctx.translate(0, y_offset);
        ctx.scale(1, -1);
        ctx.translate(0, -y_offset);
        ctx.drawImage(this.image_data[i], this.sx[i] | 0, this.sy[i] | 0, this.sw[i], this.sh[i]);
        ctx.translate(0, y_offset);
        ctx.scale(1, -1);
        ctx.translate(0, -y_offset);
      }
      ctx.setImageSmoothingEnabled(old_smoothing);
      return ctx.restore();
    };

    return ImageView;

  })(GlyphView);

  ImageGlyph = (function(_super) {
    __extends(ImageGlyph, _super);

    function ImageGlyph() {
      _ref1 = ImageGlyph.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ImageGlyph.prototype.default_view = ImageView;

    ImageGlyph.prototype.type = 'GlyphRenderer';

    return ImageGlyph;

  })(Glyph);

  ImageGlyph.prototype.display_defaults = _.clone(ImageGlyph.prototype.display_defaults);

  _.extend(ImageGlyph.prototype.display_defaults, {
    level: 'underlay'
  });

  exports.Image = ImageGlyph;

  exports.ImageView = ImageView;

}).call(this);
}, "renderers/glyph/image_rgba": function(exports, require, module) {(function() {
  var Glyph, GlyphView, ImageRGBAGlyph, ImageRGBAView, glyph, glyph_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  ImageRGBAView = (function(_super) {
    __extends(ImageRGBAView, _super);

    function ImageRGBAView() {
      _ref = ImageRGBAView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImageRGBAView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['image:array', 'width', 'height', 'x', 'y', 'dw', 'dh'], []);
      return ImageRGBAView.__super__.initialize.call(this, options);
    };

    ImageRGBAView.prototype._set_data = function(data) {
      var ctx, h, height, i, img, obj, width, _i, _j, _ref1, _ref2, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      h = this.glyph_props.v_select('dh', data);
      for (i = _i = 0, _ref1 = this.y.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        this.y[i] += h[i];
      }
      width = this.glyph_props.v_select('width', data);
      height = this.glyph_props.v_select('height', data);
      img = (function() {
        var _j, _len, _results;
        _results = [];
        for (_j = 0, _len = data.length; _j < _len; _j++) {
          obj = data[_j];
          _results.push(this.glyph_props.select('image', obj));
        }
        return _results;
      }).call(this);
      if ((this.image_data == null) || this.image_data.length !== data.length) {
        this.image_data = new Array(data.length);
      }
      if ((this.image_canvas == null) || this.image_canvas.length !== data.length) {
        this.image_canvas = new Array(data.length);
      }
      _results = [];
      for (i = _j = 0, _ref2 = data.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
        if ((this.image_canvas[i] == null) || (this.image_canvas[i].width !== width[i] || this.image_canvas[i].height !== height[i])) {
          this.image_canvas[i] = document.createElement('canvas');
          this.image_canvas[i].width = width[i];
          this.image_canvas[i].height = height[i];
          ctx = this.image_canvas[i].getContext('2d');
          this.image_data[i] = ctx.createImageData(width[i], height[i]);
        }
        ctx = this.image_canvas[i].getContext('2d');
        this.image_data[i].data.set(new Uint8ClampedArray(img[i]));
        _results.push(ctx.putImageData(this.image_data[i], 0, 0));
      }
      return _results;
    };

    ImageRGBAView.prototype._render = function() {
      var ctx, i, old_smoothing, y_offset, _i, _ref1, _ref2;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'dw', 'edge');
      this.sh = this.distance(this.data, 'y', 'dh', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      old_smoothing = ctx.getImageSmoothingEnabled();
      ctx.setImageSmoothingEnabled(false);
      for (i = _i = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i])) {
          continue;
        }
        y_offset = this.sy[i] + this.sh[i] / 2;
        ctx.translate(0, y_offset);
        ctx.scale(1, -1);
        ctx.translate(0, -y_offset);
        ctx.drawImage(this.image_canvas[i], this.sx[i] | 0, this.sy[i] | 0, this.sw[i], this.sh[i]);
        ctx.translate(0, y_offset);
        ctx.scale(1, -1);
        ctx.translate(0, -y_offset);
      }
      ctx.setImageSmoothingEnabled(old_smoothing);
      return ctx.restore();
    };

    return ImageRGBAView;

  })(GlyphView);

  ImageRGBAGlyph = (function(_super) {
    __extends(ImageRGBAGlyph, _super);

    function ImageRGBAGlyph() {
      _ref1 = ImageRGBAGlyph.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ImageRGBAGlyph.prototype.default_view = ImageRGBAView;

    ImageRGBAGlyph.prototype.type = 'GlyphRenderer';

    return ImageRGBAGlyph;

  })(Glyph);

  ImageRGBAGlyph.prototype.display_defaults = _.clone(ImageRGBAGlyph.prototype.display_defaults);

  _.extend(ImageRGBAGlyph.prototype.display_defaults, {
    level: 'underlay'
  });

  exports.ImageRGBA = ImageRGBAGlyph;

  exports.ImageRGBAView = ImageRGBAView;

}).call(this);
}, "renderers/glyph/image_uri": function(exports, require, module) {(function() {
  var Glyph, GlyphView, ImageURIGlyph, ImageURIView, glyph, glyph_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  ImageURIView = (function(_super) {
    __extends(ImageURIView, _super);

    function ImageURIView() {
      _ref = ImageURIView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImageURIView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['url:string', 'x', 'y', 'angle'], []);
      return ImageURIView.__super__.initialize.call(this, options);
    };

    ImageURIView.prototype._set_data = function(data) {
      var angle, angles, img, obj;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      this.url = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('url', obj));
        }
        return _results;
      }).call(this);
      angles = this.glyph_props.v_select('angle', data);
      this.angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.image = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.url;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          img = _ref1[_i];
          _results.push(null);
        }
        return _results;
      }).call(this);
      this.need_load = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.url;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          img = _ref1[_i];
          _results.push(true);
        }
        return _results;
      }).call(this);
      return this.loaded = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.url;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          img = _ref1[_i];
          _results.push(false);
        }
        return _results;
      }).call(this);
    };

    ImageURIView.prototype._render = function() {
      var ctx, i, img, vs, _i, _ref1, _ref2,
        _this = this;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      ctx = this.plot_view.ctx;
      vs = this.plot_view.view_state;
      ctx.save();
      for (i = _i = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.angle[i])) {
          continue;
        }
        if (this.need_load[i]) {
          img = new Image();
          img.onload = (function(img, i) {
            return function() {
              _this.loaded[i] = true;
              _this.image[i] = img;
              ctx.save();
              ctx.beginPath();
              ctx.rect(vs.get('border_left') + 1, vs.get('border_top') + 1, vs.get('inner_width') - 2, vs.get('inner_height') - 2);
              ctx.clip();
              _this._render_image(ctx, vs, i, img);
              return ctx.restore();
            };
          })(img, i);
          img.src = this.url[i];
          this.need_load[i] = false;
        } else if (this.loaded[i]) {
          this._render_image(ctx, vs, i, this.image[i]);
        }
      }
      return ctx.restore();
    };

    ImageURIView.prototype._render_image = function(ctx, vs, i, img) {
      if (this.angle[i]) {
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.angle[i]);
        ctx.drawImage(img, 0, 0);
        ctx.rotate(-this.angle[i]);
        return ctx.translate(-this.sx[i], -this.sy[i]);
      } else {
        return ctx.drawImage(img, this.sx[i], this.sy[i]);
      }
    };

    return ImageURIView;

  })(GlyphView);

  ImageURIGlyph = (function(_super) {
    __extends(ImageURIGlyph, _super);

    function ImageURIGlyph() {
      _ref1 = ImageURIGlyph.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ImageURIGlyph.prototype.default_view = ImageURIView;

    ImageURIGlyph.prototype.type = 'GlyphRenderer';

    return ImageURIGlyph;

  })(Glyph);

  ImageURIGlyph.prototype.display_defaults = _.clone(ImageURIGlyph.prototype.display_defaults);

  _.extend(ImageURIGlyph.prototype.display_defaults, {
    level: 'underlay'
  });

  exports.ImageURI = ImageURIGlyph;

  exports.ImageURIView = ImageURIView;

}).call(this);
}, "renderers/glyph/line": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Line, LineView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  LineView = (function(_super) {
    __extends(LineView, _super);

    function LineView() {
      _ref = LineView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LineView.prototype.initialize = function(options) {
      var spec;
      LineView.__super__.initialize.call(this, options);
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      return this.do_stroke = this.glyph_props.line_properties.do_stroke;
    };

    LineView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;
      glyph_props = new glyph_properties(this, glyphspec, ['x:number', 'y:number'], [new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    LineView.prototype._set_data = function(data) {
      var i, _i, _ref1, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      this.selected_mask = new Uint8Array(data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.selected_mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    LineView.prototype._map_data = function() {
      var _ref1;
      return _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
    };

    LineView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len;
      if (!this.do_stroke) {
        return;
      }
      this._map_data();
      ctx = this.plot_view.ctx;
      ctx.save();
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      if (selected && selected.length && this.nonselection_glyphprops) {
        if (this.selection_glyphprops) {
          props = this.selection_glyphprops;
        } else {
          props = this.glyph_props;
        }
        this._draw_path(ctx, this.nonselection_glyphprops, false);
        this._draw_path(ctx, props, true);
      } else {
        this._draw_path(ctx);
      }
      return ctx.restore();
    };

    LineView.prototype._draw_path = function(ctx, glyph_props, draw_selected) {
      var drawing, i, selected_mask, sx, sy, _i, _ref1;
      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      glyph_props.line_properties.set(ctx, glyph_props);
      sx = this.sx;
      sy = this.sy;
      selected_mask = this.selected_mask;
      drawing = false;
      for (i = _i = 0, _ref1 = sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(sx[i] + sy[i]) || (draw_selected && !selected_mask[i]) || (!draw_selected && selected_mask[i])) {
          if (drawing) {
            ctx.stroke();
          }
          drawing = false;
          continue;
        }
        if (!drawing) {
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i]);
          drawing = true;
        } else {
          ctx.lineTo(sx[i], sy[i]);
        }
      }
      if (drawing) {
        return ctx.stroke();
      }
    };

    LineView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var glyph_props, glyph_settings, line_props, reference_point;
      ctx.save();
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      line_props.set(ctx, glyph_settings);
      ctx.beginPath();
      ctx.moveTo(x1, (y1 + y2) / 2);
      ctx.lineTo(x2, (y1 + y2) / 2);
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    LineView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;
      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return LineView;

  })(GlyphView);

  Line = (function(_super) {
    __extends(Line, _super);

    function Line() {
      _ref1 = Line.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Line.prototype.default_view = LineView;

    Line.prototype.type = 'GlyphRenderer';

    return Line;

  })(Glyph);

  Line.prototype.display_defaults = _.clone(Line.prototype.display_defaults);

  _.extend(Line.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Line = Line;

  exports.LineView = LineView;

}).call(this);
}, "renderers/glyph/multi_line": function(exports, require, module) {(function() {
  var Glyph, GlyphView, MultiLine, MultiLineView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  MultiLineView = (function(_super) {
    __extends(MultiLineView, _super);

    function MultiLineView() {
      _ref = MultiLineView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    MultiLineView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['xs:array', 'ys:array'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return MultiLineView.__super__.initialize.call(this, options);
    };

    MultiLineView.prototype._set_data = function(data) {
      this.data = data;
    };

    MultiLineView.prototype._render = function() {
      var ctx;
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    MultiLineView.prototype._fast_path = function(ctx) {
      var i, pt, sx, sy, x, y, _i, _j, _len, _ref1, _ref2, _ref3, _results;
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        _ref1 = this.data;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          pt = _ref1[_i];
          x = this.glyph_props.select('xs', pt);
          y = this.glyph_props.select('ys', pt);
          _ref2 = this.plot_view.map_to_screen(x, this.glyph_props.xs.units, y, this.glyph_props.ys.units), sx = _ref2[0], sy = _ref2[1];
          for (i = _j = 0, _ref3 = sx.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[i], sy[i]);
              continue;
            } else if (isNaN(sx[i]) || isNaN(sy[i])) {
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[i], sy[i]);
            }
          }
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    MultiLineView.prototype._full_path = function(ctx) {
      var i, pt, sx, sy, x, y, _i, _j, _len, _ref1, _ref2, _ref3, _results;
      if (this.do_stroke) {
        _ref1 = this.data;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          pt = _ref1[_i];
          x = this.glyph_props.select('xs', pt);
          y = this.glyph_props.select('ys', pt);
          _ref2 = this.plot_view.map_to_screen(x, this.glyph_props.xs.units, y, this.glyph_props.ys.units), sx = _ref2[0], sy = _ref2[1];
          this.glyph_props.line_properties.set(ctx, pt);
          for (i = _j = 0, _ref3 = sx.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[i], sy[i]);
              continue;
            } else if (isNaN(sx[i]) || isNaN(sy[i])) {
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[i], sy[i]);
            }
          }
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    MultiLineView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var glyph_props, glyph_settings, line_props, reference_point;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      ctx.beginPath();
      ctx.moveTo(x1, (y1 + y2) / 2);
      ctx.lineTo(x2, (y1 + y2) / 2);
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    return MultiLineView;

  })(GlyphView);

  MultiLine = (function(_super) {
    __extends(MultiLine, _super);

    function MultiLine() {
      _ref1 = MultiLine.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    MultiLine.prototype.default_view = MultiLineView;

    MultiLine.prototype.type = 'GlyphRenderer';

    return MultiLine;

  })(Glyph);

  MultiLine.prototype.display_defaults = _.clone(MultiLine.prototype.display_defaults);

  _.extend(MultiLine.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.MultiLine = MultiLine;

  exports.MultiLineView = MultiLineView;

}).call(this);
}, "renderers/glyph/oval": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Oval, OvalView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  OvalView = (function(_super) {
    __extends(OvalView, _super);

    function OvalView() {
      _ref = OvalView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    OvalView.prototype.initialize = function(options) {
      var spec;
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return OvalView.__super__.initialize.call(this, options);
    };

    OvalView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;
      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'width', 'height', 'angle'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    OvalView.prototype._set_data = function(data) {
      var angle, angles, i, _i, _ref1, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      angles = this.glyph_props.v_select('angle', data);
      this.angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.selected_mask = new Uint8Array(data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.selected_mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    OvalView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len, _ref1;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'width', 'center');
      this.sh = this.distance(this.data, 'y', 'height', 'center');
      ctx = this.plot_view.ctx;
      ctx.save();
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, 'selected');
          this._full_path(ctx, this.nonselection_glyphprops, 'unselected');
        } else {
          this._full_path(ctx);
        }
      }
      return ctx.restore();
    };

    OvalView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2;
      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.beginPath();
          ctx.moveTo(0, -this.sh[i] / 2);
          ctx.bezierCurveTo(this.sw[i] / 2, -this.sh[i] / 2, this.sw[i] / 2, this.sh[i] / 2, 0, this.sh[i] / 2);
          ctx.bezierCurveTo(-this.sw[i] / 2, this.sh[i] / 2, -this.sw[i] / 2, -this.sh[i] / 2, 0, -this.sh[i] / 2);
          ctx.closePath();
          ctx.fill();
          ctx.rotate(-this.angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
      }
      if (this.do_fill) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.moveTo(0, -this.sh[i] / 2);
          ctx.bezierCurveTo(this.sw[i] / 2, -this.sh[i] / 2, this.sw[i] / 2, this.sh[i] / 2, 0, this.sh[i] / 2);
          ctx.bezierCurveTo(-this.sw[i] / 2, this.sh[i] / 2, -this.sw[i] / 2, -this.sh[i] / 2, 0, -this.sh[i] / 2);
          ctx.rotate(-this.angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
        return ctx.stroke();
      }
    };

    OvalView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;
      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
          continue;
        }
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
          continue;
        }
        if (use_selection === 'selected' && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === 'unselected' && this.selected_mask[i]) {
          continue;
        }
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.angle[i]);
        ctx.beginPath();
        ctx.moveTo(0, -this.sh[i] / 2);
        ctx.bezierCurveTo(this.sw[i] / 2, -this.sh[i] / 2, this.sw[i] / 2, this.sh[i] / 2, 0, this.sh[i] / 2);
        ctx.bezierCurveTo(-this.sw[i] / 2, this.sh[i] / 2, -this.sw[i] / 2, -this.sh[i] / 2, 0, -this.sh[i] / 2);
        ctx.closePath();
        if (this.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          ctx.stroke();
        }
        ctx.rotate(-this.angle[i]);
        _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
      }
      return _results;
    };

    OvalView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, fill_props, glyph_props, glyph_settings, h, line_props, ratio, ratio1, ratio2, reference_point, sh, sw, w;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        sw = this.distance([reference_point], 'x', 'width', 'center')[0];
        sh = this.distance([refrence_point], 'y', 'height', 'center')[0];
      } else {
        glyph_settings = glyph_props;
        sw = 1.0;
        sh = 2.0;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      w = Math.abs(x2 - x1);
      h = Math.abs(y2 - y1);
      w = w - 2 * border;
      h = h - 2 * border;
      ratio1 = h / sh;
      ratio2 = w / sw;
      ratio = _.min([ratio1, ratio2]);
      h = sh * ratio;
      w = sw * ratio;
      ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.bezierCurveTo(w / 2, -h / 2, w / 2, h / 2, 0, h / 2);
      ctx.bezierCurveTo(-w / 2, h / 2, -w / 2, -h / 2, 0, -h / 2);
      ctx.closePath();
      if (fill_props.do_fill) {
        fill_props.set(ctx, glyph_settings);
        ctx.fill();
      }
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    OvalView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;
      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return OvalView;

  })(GlyphView);

  Oval = (function(_super) {
    __extends(Oval, _super);

    function Oval() {
      _ref1 = Oval.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Oval.prototype.default_view = OvalView;

    Oval.prototype.type = 'GlyphRenderer';

    return Oval;

  })(Glyph);

  Oval.prototype.display_defaults = _.clone(Oval.prototype.display_defaults);

  _.extend(Oval.prototype.display_defaults, {
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0,
    angle: 0.0
  });

  exports.Oval = Oval;

  exports.OvalView = OvalView;

}).call(this);
}, "renderers/glyph/patch": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Patch, PatchView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  PatchView = (function(_super) {
    __extends(PatchView, _super);

    function PatchView() {
      _ref = PatchView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PatchView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x:number', 'y:number'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return PatchView.__super__.initialize.call(this, options);
    };

    PatchView.prototype._set_data = function(data) {
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      return this.y = this.glyph_props.v_select('y', data);
    };

    PatchView.prototype._render = function() {
      var ctx, i, sx, sy, _i, _j, _ref1, _ref2, _ref3;
      ctx = this.plot_view.ctx;
      ctx.save();
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), sx = _ref1[0], sy = _ref1[1];
      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref2 = sx.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          if (i === 0) {
            ctx.beginPath();
            ctx.moveTo(sx[i], sy[i]);
            continue;
          } else if (isNaN(sx[i] + sy[i])) {
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            continue;
          } else {
            ctx.lineTo(sx[i], sy[i]);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        for (i = _j = 0, _ref3 = sx.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
          if (i === 0) {
            ctx.beginPath();
            ctx.moveTo(sx[i], sy[i]);
            continue;
          } else if (isNaN(sx[i] + sy[i])) {
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            continue;
          } else {
            ctx.lineTo(sx[i], sy[i]);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
      return ctx.restore();
    };

    return PatchView;

  })(GlyphView);

  Patch = (function(_super) {
    __extends(Patch, _super);

    function Patch() {
      _ref1 = Patch.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Patch.prototype.default_view = PatchView;

    Patch.prototype.type = 'GlyphRenderer';

    return Patch;

  })(Glyph);

  Patch.prototype.display_defaults = _.clone(Patch.prototype.display_defaults);

  _.extend(Patch.prototype.display_defaults, {
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Patch = Patch;

  exports.PatchView = PatchView;

}).call(this);
}, "renderers/glyph/patches": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Patches, PatchesView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  PatchesView = (function(_super) {
    __extends(PatchesView, _super);

    function PatchesView() {
      _ref = PatchesView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PatchesView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['xs:array', 'ys:array'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return PatchesView.__super__.initialize.call(this, options);
    };

    PatchesView.prototype._set_data = function(data) {
      this.data = data;
    };

    PatchesView.prototype._render = function() {
      var ctx, i, pt, sx, sy, x, y, _i, _j, _k, _len, _ref1, _ref2, _ref3, _ref4;
      ctx = this.plot_view.ctx;
      ctx.save();
      _ref1 = this.data;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pt = _ref1[_i];
        x = this.glyph_props.select('xs', pt);
        y = this.glyph_props.select('ys', pt);
        _ref2 = this.plot_view.map_to_screen(x, this.glyph_props.xs.units, y, this.glyph_props.ys.units), sx = _ref2[0], sy = _ref2[1];
        if (this.do_fill) {
          this.glyph_props.fill_properties.set(ctx, pt);
          for (i = _j = 0, _ref3 = sx.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[i], sy[i]);
              continue;
            } else if (isNaN(sx[i] + sy[i])) {
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[i], sy[i]);
            }
          }
          ctx.closePath();
          ctx.fill();
        }
        if (this.do_stroke) {
          this.glyph_props.line_properties.set(ctx, pt);
          for (i = _k = 0, _ref4 = sx.length - 1; 0 <= _ref4 ? _k <= _ref4 : _k >= _ref4; i = 0 <= _ref4 ? ++_k : --_k) {
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[i], sy[i]);
              continue;
            } else if (isNaN(sx[i] + sy[i])) {
              ctx.closePath();
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[i], sy[i]);
            }
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      return ctx.restore();
    };

    return PatchesView;

  })(GlyphView);

  Patches = (function(_super) {
    __extends(Patches, _super);

    function Patches() {
      _ref1 = Patches.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Patches.prototype.default_view = PatchesView;

    Patches.prototype.type = 'GlyphRenderer';

    return Patches;

  })(Glyph);

  Patches.prototype.display_defaults = _.clone(Patches.prototype.display_defaults);

  _.extend(Patches.prototype.display_defaults, {
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Patches = Patches;

  exports.PatchesView = PatchesView;

}).call(this);
}, "renderers/glyph/quad": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Quad, QuadView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  QuadView = (function(_super) {
    __extends(QuadView, _super);

    function QuadView() {
      _ref = QuadView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    QuadView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['right', 'left', 'bottom', 'top'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return QuadView.__super__.initialize.call(this, options);
    };

    QuadView.prototype._set_data = function(data) {
      var i, _i, _ref1, _results;
      this.data = data;
      this.left = this.glyph_props.v_select('left', data);
      this.top = this.glyph_props.v_select('top', data);
      this.right = this.glyph_props.v_select('right', data);
      this.bottom = this.glyph_props.v_select('bottom', data);
      this.mask = new Uint8Array(data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.mask[i] = true);
      }
      return _results;
    };

    QuadView.prototype._render = function() {
      var ctx, i, oh, ow, _i, _ref1, _ref2, _ref3;
      _ref1 = this.plot_view.map_to_screen(this.left, this.glyph_props.left.units, this.top, this.glyph_props.top.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(this.right, this.glyph_props.right.units, this.bottom, this.glyph_props.bottom.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
      ow = this.plot_view.view_state.get('outer_width');
      oh = this.plot_view.view_state.get('outer_height');
      for (i = _i = 0, _ref3 = this.mask.length - 1; 0 <= _ref3 ? _i <= _ref3 : _i >= _ref3; i = 0 <= _ref3 ? ++_i : --_i) {
        if ((this.sx0[i] < 0 && this.sx1[i] < 0) || (this.sx0[i] > ow && this.sx1[i] > ow) || (this.sy0[i] < 0 && this.sy1[i] < 0) || (this.sy0[i] > oh && this.sy1[i] > oh)) {
          this.mask[i] = false;
        } else {
          this.mask[i] = true;
        }
      }
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    QuadView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2;
      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i]) || !this.mask[i]) {
            continue;
          }
          ctx.rect(this.sx0[i], this.sy0[i], this.sx1[i] - this.sx0[i], this.sy1[i] - this.sy0[i]);
        }
        ctx.fill();
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx0.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i]) || !this.mask[i]) {
            continue;
          }
          ctx.rect(this.sx0[i], this.sy0[i], this.sx1[i] - this.sx0[i], this.sy1[i] - this.sy0[i]);
        }
        return ctx.stroke();
      }
    };

    QuadView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;
      _results = [];
      for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i]) || !this.mask[i]) {
          continue;
        }
        ctx.beginPath();
        ctx.rect(this.sx0[i], this.sy0[i], this.sx1[i] - this.sx0[i], this.sy1[i] - this.sy0[i]);
        if (this.do_fill) {
          this.glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    QuadView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, bottom, data_h, data_w, fill_props, glyph_props, glyph_settings, h, left, line_props, ratio, ratio1, ratio2, reference_point, right, sx0, sx1, sy0, sy1, top, w, x, y, _ref1, _ref2;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        left = this.glyph_props.select('left', glyph_settings);
        top = this.glyph_props.select('top', glyph_settings);
        right = this.glyph_props.select('right', glyph_settings);
        bottom = this.glyph_props.select('bottom', glyph_settings);
        _ref1 = this.plot_view.map_to_screen([left], this.glyph_props.left.units, [top], this.glyph_props.top.units), sx0 = _ref1[0], sy0 = _ref1[1];
        _ref2 = this.plot_view.map_to_screen([right], this.glyph_props.right.units, [bottom], this.glyph_props.bottom.units), sx1 = _ref2[0], sy1 = _ref2[1];
        data_w = sx1[0] - sx0[0];
        data_h = sy1[0] - sy0[0];
      } else {
        glyph_settings = glyph_props;
        data_w = 1;
        data_h = 1;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      data_w = data_w - 2 * border;
      data_h = data_h - 2 * border;
      w = Math.abs(x2 - x1);
      h = Math.abs(y2 - y1);
      ratio1 = w / data_w;
      ratio2 = h / data_h;
      ratio = _.min([ratio1, ratio2]);
      w = ratio * data_w;
      h = ratio * data_h;
      x = (x1 + x2) / 2 - (w / 2);
      y = (y1 + y2) / 2 - (h / 2);
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      if (fill_props.do_fill) {
        fill_props.set(ctx, glyph_settings);
        ctx.fill();
      }
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    return QuadView;

  })(GlyphView);

  Quad = (function(_super) {
    __extends(Quad, _super);

    function Quad() {
      _ref1 = Quad.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Quad.prototype.default_view = QuadView;

    Quad.prototype.type = 'GlyphRenderer';

    return Quad;

  })(Glyph);

  Quad.prototype.display_defaults = _.clone(Quad.prototype.display_defaults);

  _.extend(Quad.prototype.display_defaults, {
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Quad = Quad;

  exports.QuadView = QuadView;

}).call(this);
}, "renderers/glyph/quadratic": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Quadratic, QuadraticView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  QuadraticView = (function(_super) {
    __extends(QuadraticView, _super);

    function QuadraticView() {
      _ref = QuadraticView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    QuadraticView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x0', 'y0', 'x1', 'y1', 'cx', 'cy'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return QuadraticView.__super__.initialize.call(this, options);
    };

    QuadraticView.prototype._set_data = function(data) {
      this.data = data;
      this.x0 = this.glyph_props.v_select('x0', data);
      this.y0 = this.glyph_props.v_select('y0', data);
      this.x1 = this.glyph_props.v_select('x1', data);
      this.y1 = this.glyph_props.v_select('y1', data);
      this.cx = this.glyph_props.v_select('cx', data);
      return this.cy = this.glyph_props.v_select('cy', data);
    };

    QuadraticView.prototype._render = function() {
      var ctx, _ref1, _ref2, _ref3;
      _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
      _ref3 = this.plot_view.map_to_screen(this.cx, this.glyph_props.cx.units, this.cy, this.glyph_props.cy.units), this.scx = _ref3[0], this.scy = _ref3[1];
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    QuadraticView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1;
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx[i] + this.scy[i])) {
            continue;
          }
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.quadraticCurveTo(this.scx[i], this.scy[i], this.sx1[i], this.sy1[i]);
        }
        return ctx.stroke();
      }
    };

    QuadraticView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;
      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx[i] + this.scy[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.quadraticCurveTo(this.scx[i], this.scy[i], this.sx1[i], this.sy1[i]);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    return QuadraticView;

  })(GlyphView);

  Quadratic = (function(_super) {
    __extends(Quadratic, _super);

    function Quadratic() {
      _ref1 = Quadratic.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Quadratic.prototype.default_view = QuadraticView;

    Quadratic.prototype.type = 'GlyphRenderer';

    return Quadratic;

  })(Glyph);

  Quadratic.prototype.display_defaults = _.clone(Quadratic.prototype.display_defaults);

  _.extend(Quadratic.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Quadratic = Quadratic;

  exports.QuadraticView = QuadraticView;

}).call(this);
}, "renderers/glyph/ray": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Ray, RayView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  RayView = (function(_super) {
    __extends(RayView, _super);

    function RayView() {
      _ref = RayView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RayView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'angle', 'length'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return RayView.__super__.initialize.call(this, options);
    };

    RayView.prototype._set_data = function(data) {
      var angle, angles, obj;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      angles = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('angle', obj));
        }
        return _results;
      }).call(this);
      this.angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      return this.length = this.glyph_props.v_select('length', data);
    };

    RayView.prototype._render = function() {
      var ctx, height, i, inf_len, width, _i, _ref1, _ref2;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      width = this.plot_view.view_state.get('width');
      height = this.plot_view.view_state.get('height');
      inf_len = 2 * (width + height);
      for (i = _i = 0, _ref2 = this.length.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if (this.length[i] === 0) {
          this.length[i] = inf_len;
        }
      }
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    RayView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1;
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.angle[i] + this.length[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.moveTo(0, 0);
          ctx.lineTo(this.length[i], 0);
          ctx.rotate(-this.angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
        return ctx.stroke();
      }
    };

    RayView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;
      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.angle[i] + this.length[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(this.length[i], 0);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          ctx.stroke();
          ctx.rotate(-this.angle[i]);
          _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
        }
        return _results;
      }
    };

    RayView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var angle, glyph_props, glyph_settings, line_props, r, reference_point, sx, sy;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      angle = -this.glyph_props.select('angle', glyph_settings);
      r = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]) / 2;
      sx = (x1 + x2) / 2;
      sy = (y1 + y2) / 2;
      ctx.beginPath();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.rotate(-angle);
      ctx.translate(-sx, -sy);
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    return RayView;

  })(GlyphView);

  Ray = (function(_super) {
    __extends(Ray, _super);

    function Ray() {
      _ref1 = Ray.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Ray.prototype.default_view = RayView;

    Ray.prototype.type = 'GlyphRenderer';

    return Ray;

  })(Glyph);

  Ray.prototype.display_defaults = _.clone(Ray.prototype.display_defaults);

  _.extend(Ray.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Ray = Ray;

  exports.RayView = RayView;

}).call(this);
}, "renderers/glyph/rect": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Rect, RectView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  RectView = (function(_super) {
    __extends(RectView, _super);

    function RectView() {
      _ref = RectView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RectView.prototype.initialize = function(options) {
      var spec;
      RectView.__super__.initialize.call(this, options);
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      return this.do_stroke = this.glyph_props.line_properties.do_stroke;
    };

    RectView.prototype.init_glyph = function(glyphspec) {
      var fill_props, glyph_props, line_props;
      fill_props = new fill_properties(this, glyphspec);
      line_props = new line_properties(this, glyphspec);
      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'width', 'height', 'angle'], [line_props, fill_props]);
      return glyph_props;
    };

    RectView.prototype._set_data = function(data) {
      var angle, angles, i, _i, _ref1, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      angles = this.glyph_props.v_select('angle', data);
      this.angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.selected_mask = new Uint8Array(data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.selected_mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    RectView.prototype._map_data = function() {
      var i, sxi, syi, _i, _ref1, _ref2, _results;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), sxi = _ref1[0], syi = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'width', 'center');
      this.sh = this.distance(this.data, 'y', 'height', 'center');
      this.sx = new Array(sxi.length);
      this.sy = new Array(sxi.length);
      _results = [];
      for (i = _i = 0, _ref2 = sxi.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if (Math.abs(sxi[i] - this.sw[i]) < 2) {
          this.sx[i] = Math.round(sxi[i]);
        } else {
          this.sx[i] = sxi[i];
        }
        if (Math.abs(syi[i] - this.sh[i]) < 2) {
          _results.push(this.sy[i] = Math.round(syi[i]));
        } else {
          _results.push(this.sy[i] = syi[i]);
        }
      }
      return _results;
    };

    RectView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len;
      this._map_data();
      ctx = this.plot_view.ctx;
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, 'selected');
          this._full_path(ctx, this.nonselection_glyphprops, 'unselected');
        } else {
          this._full_path(ctx);
        }
      }
      return ctx.restore();
    };

    RectView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2;
      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
            continue;
          }
          if (this.angle[i]) {
            ctx.translate(this.sx[i], this.sy[i]);
            ctx.rotate(this.angle[i]);
            ctx.rect(-this.sw[i] / 2, -this.sh[i] / 2, this.sw[i], this.sh[i]);
            ctx.rotate(-this.angle[i]);
            ctx.translate(-this.sx[i], -this.sy[i]);
          } else {
            ctx.rect(this.sx[i] - this.sw[i] / 2, this.sy[i] - this.sh[i] / 2, this.sw[i], this.sh[i]);
          }
        }
        ctx.fill();
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
            continue;
          }
          if (this.angle[i]) {
            ctx.translate(this.sx[i], this.sy[i]);
            ctx.rotate(this.angle[i]);
            ctx.rect(-this.sw[i] / 2, -this.sh[i] / 2, this.sw[i], this.sh[i]);
            ctx.rotate(-this.angle[i]);
            ctx.translate(-this.sx[i], -this.sy[i]);
          } else {
            ctx.rect(this.sx[i] - this.sw[i] / 2, this.sy[i] - this.sh[i] / 2, this.sw[i], this.sh[i]);
          }
        }
        return ctx.stroke();
      }
    };

    RectView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, data_h, data_w, fill_props, glyph_props, glyph_settings, h, line_props, reference_point, w, x, y;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_w = this.distance([reference_point], 'x', 'width', 'center')[0];
        data_h = this.distance([reference_point], 'y', 'height', 'center')[0];
      } else {
        glyph_settings = glyph_props;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      ctx.beginPath();
      w = Math.abs(x2 - x1);
      h = Math.abs(y2 - y1);
      w = w - 2 * border;
      h = h - 2 * border;
      if (data_w != null) {
        w = data_w > w ? w : data_w;
      }
      if (data_h != null) {
        h = data_h > h ? h : data_h;
      }
      x = (x1 + x2) / 2 - (w / 2);
      y = (y1 + y2) / 2 - (h / 2);
      ctx.rect(x, y, w, h);
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    RectView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;
      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
          continue;
        }
        if (use_selection === 'selected' && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === 'unselected' && this.selected_mask[i]) {
          continue;
        }
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.angle[i]);
        ctx.beginPath();
        ctx.rect(-this.sw[i] / 2, -this.sh[i] / 2, this.sw[i], this.sh[i]);
        if (this.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          ctx.stroke();
        }
        ctx.rotate(-this.angle[i]);
        _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
      }
      return _results;
    };

    RectView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;
      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return RectView;

  })(GlyphView);

  Rect = (function(_super) {
    __extends(Rect, _super);

    function Rect() {
      _ref1 = Rect.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Rect.prototype.default_view = RectView;

    Rect.prototype.type = 'GlyphRenderer';

    return Rect;

  })(Glyph);

  Rect.prototype.display_defaults = _.clone(Rect.prototype.display_defaults);

  _.extend(Rect.prototype.display_defaults, {
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0,
    angle: 0.0
  });

  exports.Rect = Rect;

  exports.RectView = RectView;

}).call(this);
}, "renderers/glyph/segment": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Segment, SegmentView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  SegmentView = (function(_super) {
    __extends(SegmentView, _super);

    function SegmentView() {
      _ref = SegmentView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SegmentView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x0', 'y0', 'x1', 'y1'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return SegmentView.__super__.initialize.call(this, options);
    };

    SegmentView.prototype._set_data = function(data) {
      this.data = data;
      this.x0 = this.glyph_props.v_select('x0', data);
      this.y0 = this.glyph_props.v_select('y0', data);
      this.x1 = this.glyph_props.v_select('x1', data);
      return this.y1 = this.glyph_props.v_select('y1', data);
    };

    SegmentView.prototype._render = function() {
      var ctx, _ref1, _ref2;
      _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    SegmentView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1;
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i])) {
            continue;
          }
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.lineTo(this.sx1[i], this.sy1[i]);
        }
        return ctx.stroke();
      }
    };

    SegmentView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;
      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.lineTo(this.sx1[i], this.sy1[i]);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    SegmentView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var glyph_props, glyph_settings, line_props, reference_point;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      line_props.set(ctx, glyph_settings);
      ctx.beginPath();
      ctx.moveTo(x1, (y1 + y2) / 2);
      ctx.lineTo(x2, (y1 + y2) / 2);
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    return SegmentView;

  })(GlyphView);

  Segment = (function(_super) {
    __extends(Segment, _super);

    function Segment() {
      _ref1 = Segment.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Segment.prototype.default_view = SegmentView;

    Segment.prototype.type = 'GlyphRenderer';

    return Segment;

  })(Glyph);

  Segment.prototype.display_defaults = _.clone(Segment.prototype.display_defaults);

  _.extend(Segment.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Segment = Segment;

  exports.SegmentView = SegmentView;

}).call(this);
}, "renderers/glyph/square": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Square, SquareView, fill_properties, glyph, glyph_properties, line_properties, properties, rect, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  rect = require("./rect");

  SquareView = (function(_super) {
    __extends(SquareView, _super);

    function SquareView() {
      _ref = SquareView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SquareView.prototype.initialize = function(options) {
      var spec;
      SquareView.__super__.initialize.call(this, options);
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      return this.do_stroke = this.glyph_props.line_properties.do_stroke;
    };

    SquareView.prototype.init_glyph = function(glyphspec) {
      var fill_props, glyph_props, line_props;
      fill_props = new fill_properties(this, glyphspec);
      line_props = new line_properties(this, glyphspec);
      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'size', 'angle'], [line_props, fill_props]);
      return glyph_props;
    };

    SquareView.prototype._map_data = function() {
      var _ref1;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'size', 'center');
      return this.sh = this.sw;
    };

    SquareView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, data_h, data_w, fill_props, glyph_props, glyph_settings, h, line_props, reference_point, w, x, y;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_w = this.distance([reference_point], 'x', 'size', 'center')[0];
        data_h = data_w;
      } else {
        glyph_settings = glyph_props;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      ctx.beginPath();
      w = Math.abs(x2 - x1);
      h = Math.abs(y2 - y1);
      w = w - 2 * border;
      h = h - 2 * border;
      if (data_w != null) {
        w = data_w > w ? w : data_w;
      }
      if (data_h != null) {
        h = data_h > h ? h : data_h;
      }
      x = (x1 + x2) / 2 - (w / 2);
      y = (y1 + y2) / 2 - (h / 2);
      ctx.rect(x, y, w, h);
      if (fill_props.do_fill) {
        fill_props.set(ctx, glyph_settings);
        ctx.fill();
      }
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    return SquareView;

  })(rect.RectView);

  Square = (function(_super) {
    __extends(Square, _super);

    function Square() {
      _ref1 = Square.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Square.prototype.default_view = SquareView;

    Square.prototype.type = 'GlyphRenderer';

    return Square;

  })(rect.Rect);

  exports.Square = Square;

  exports.SquareView = SquareView;

}).call(this);
}, "renderers/glyph/text": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Text, TextView, glyph, glyph_properties, properties, text_properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  text_properties = properties.text_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  TextView = (function(_super) {
    __extends(TextView, _super);

    function TextView() {
      _ref = TextView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TextView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'angle', 'text:string'], [new text_properties(this, glyphspec)]);
      return TextView.__super__.initialize.call(this, options);
    };

    TextView.prototype._set_data = function(data) {
      var angle, angles, obj;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      angles = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select("angle", obj));
        }
        return _results;
      }).call(this);
      this.angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      return this.text = this.glyph_props.v_select("text", data);
    };

    TextView.prototype._render = function() {
      var ctx, _ref1;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    TextView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1, _results;
      this.glyph_props.text_properties.set(ctx, this.glyph_props);
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.angle[i])) {
          continue;
        }
        if (angle[i]) {
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.fillText(this.text[i], 0, 0);
          ctx.rotate(-this.angle[i]);
          _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
        } else {
          _results.push(ctx.fillText(text[i], this.sx[i], this.sy[i]));
        }
      }
      return _results;
    };

    TextView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.angle[i])) {
          continue;
        }
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.angle[i]);
        this.glyph_props.text_properties.set(ctx, this.data[i]);
        ctx.fillText(this.text[i], 0, 0);
        ctx.rotate(-this.angle[i]);
        _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
      }
      return _results;
    };

    TextView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var glyph_props, glyph_settings, reference_point, text_props;
      glyph_props = this.glyph_props;
      text_props = glyph_props.text_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      text_props.set(ctx, glyph_settings);
      ctx.font = text_props.font(12);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("txt", x2, (y1 + y2) / 2);
      return ctx.restore();
    };

    return TextView;

  })(GlyphView);

  Text = (function(_super) {
    __extends(Text, _super);

    function Text() {
      _ref1 = Text.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Text.prototype.default_view = TextView;

    Text.prototype.type = 'GlyphRenderer';

    return Text;

  })(Glyph);

  Text.prototype.display_defaults = _.clone(Text.prototype.display_defaults);

  _.extend(Text.prototype.display_defaults, {
    text_font: "helvetica",
    text_font_size: "12pt",
    text_font_style: "normal",
    text_color: "#444444",
    text_alpha: 1.0,
    text_align: "left",
    text_baseline: "bottom"
  });

  exports.Text = Text;

  exports.TextView = TextView;

}).call(this);
}, "renderers/glyph/wedge": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Wedge, WedgeView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  WedgeView = (function(_super) {
    __extends(WedgeView, _super);

    function WedgeView() {
      _ref = WedgeView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    WedgeView.prototype.initialize = function(options) {
      var glyphspec;
      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return WedgeView.__super__.initialize.call(this, options);
    };

    WedgeView.prototype._set_data = function(data) {
      var angle, dir, end_angle, i, start_angle, _i, _ref1, _results;
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      start_angle = this.glyph_props.v_select('start_angle', data);
      this.start_angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = start_angle.length; _i < _len; _i++) {
          angle = start_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      end_angle = this.glyph_props.v_select('end_angle', data);
      this.end_angle = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = end_angle.length; _i < _len; _i++) {
          angle = end_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.direction = new Uint8Array(this.data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.data.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        dir = this.glyph_props.select('direction', data[i]);
        if (dir === 'clock') {
          _results.push(this.direction[i] = false);
        } else if (dir === 'anticlock') {
          _results.push(this.direction[i] = true);
        } else {
          _results.push(this.direction[i] = NaN);
        }
      }
      return _results;
    };

    WedgeView.prototype._render = function() {
      var ctx, _ref1;
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.radius = this.distance(this.data, 'x', 'radius', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    WedgeView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2, _results;
      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          ctx.lineTo(this.sx[i], this.sy[i]);
          ctx.closePath();
          ctx.fill();
        }
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        _results = [];
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          ctx.lineTo(this.sx[i], this.sy[i]);
          ctx.closePath();
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    WedgeView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
        ctx.lineTo(this.sx[i], this.sy[i]);
        ctx.closePath();
        if (this.do_fill) {
          this.glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    WedgeView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var angle, border, d, data_r, direction, end_angle, fill_props, glyph_props, glyph_settings, line_props, r, reference_point, start_angle, sx, sy;
      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_r = this.distance([reference_point], 'x', 'radius', 'edge')[0];
        start_angle = -this.glyph_props.select('start_angle', reference_point);
        end_angle = -this.glyph_props.select('end_angle', reference_point);
      } else {
        glyph_settings = glyph_props;
        start_angle = -0.1;
        end_angle = -3.9;
      }
      angle = end_angle - start_angle;
      direction = this.glyph_props.select('direction', glyph_settings);
      direction = direction === "clock" ? false : true;
      border = line_props.select(line_props.line_width_name, glyph_settings);
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if (data_r != null) {
        r = data_r > r ? r : data_r;
      }
      ctx.beginPath();
      sx = (x1 + x2) / 2.0;
      sy = (y1 + y2) / 2.0;
      ctx.arc(sx, sy, r, start_angle, end_angle, direction);
      ctx.lineTo(sx, sy);
      ctx.closePath();
      if (fill_props.do_fill) {
        fill_props.set(ctx, glyph_settings);
        ctx.fill();
      }
      if (line_props.do_stroke) {
        line_props.set(ctx, glyph_settings);
        ctx.stroke();
      }
      return ctx.restore();
    };

    return WedgeView;

  })(GlyphView);

  Wedge = (function(_super) {
    __extends(Wedge, _super);

    function Wedge() {
      _ref1 = Wedge.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Wedge.prototype.default_view = WedgeView;

    Wedge.prototype.type = 'GlyphRenderer';

    return Wedge;

  })(Glyph);

  Wedge.prototype.display_defaults = _.clone(Wedge.prototype.display_defaults);

  _.extend(Wedge.prototype.display_defaults, {
    direction: 'anticlock',
    fill_color: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Wedge = Wedge;

  exports.WedgeView = WedgeView;

}).call(this);
}, "renderers/glyph_renderer": function(exports, require, module) {(function() {
  var Collections, GlyphRenderers, base, glyphs, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  glyphs = require('./glyphs');

  GlyphRenderers = (function(_super) {
    __extends(GlyphRenderers, _super);

    function GlyphRenderers() {
      _ref = GlyphRenderers.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GlyphRenderers.prototype.model = function(attrs, options) {
      var model, type, _ref1;
      if (((_ref1 = attrs.glyphspec) != null ? _ref1.type : void 0) == null) {
        console.log("missing glyph type");
        return;
      }
      type = attrs.glyphspec.type;
      if (!(type in glyphs)) {
        console.log("unknown glyph type '" + type + "'");
        return;
      }
      model = glyphs[type];
      return new model(attrs, options);
    };

    return GlyphRenderers;

  })(Backbone.Collection);

  exports.glyphrenderers = new GlyphRenderers;

}).call(this);
}, "renderers/glyphs": function(exports, require, module) {(function() {
  var annular_wedge, annulus, arc, bezier, circle, image, image_rgba, image_uri, line, multi_line, oval, patch, patches, quad, quadratic, ray, rect, segment, square, text, wedge;

  annular_wedge = require("./glyph/annular_wedge");

  annulus = require("./glyph/annulus");

  arc = require("./glyph/arc");

  bezier = require("./glyph/bezier");

  circle = require("./glyph/circle");

  image = require("./glyph/image");

  image_rgba = require("./glyph/image_rgba");

  image_uri = require("./glyph/image_uri");

  line = require("./glyph/line");

  multi_line = require("./glyph/multi_line");

  oval = require("./glyph/oval");

  patch = require("./glyph/patch");

  patches = require("./glyph/patches");

  quad = require("./glyph/quad");

  quadratic = require("./glyph/quadratic");

  ray = require("./glyph/ray");

  rect = require("./glyph/rect");

  square = require("./glyph/square");

  segment = require("./glyph/segment");

  text = require("./glyph/text");

  wedge = require("./glyph/wedge");

  exports.annular_wedge = annular_wedge.AnnularWedge;

  exports.annulus = annulus.Annulus;

  exports.arc = arc.Arc;

  exports.bezier = bezier.Bezier;

  exports.circle = circle.Circle;

  exports.image = image.Image;

  exports.image_rgba = image_rgba.ImageRGBA;

  exports.image_uri = image_uri.ImageURI;

  exports.line = line.Line;

  exports.multi_line = multi_line.MultiLine;

  exports.oval = oval.Oval;

  exports.patch = patch.Patch;

  exports.patches = patches.Patches;

  exports.quad = quad.Quad;

  exports.quadratic = quadratic.Quadratic;

  exports.ray = ray.Ray;

  exports.square = square.Square;

  exports.rect = rect.Rect;

  exports.segment = segment.Segment;

  exports.text = text.Text;

  exports.wedge = wedge.Wedge;

}).call(this);
}, "renderers/guide/datetime_axis": function(exports, require, module) {(function() {
  var DatetimeAxes, DatetimeAxis, DatetimeAxisView, linear_axis, ticking, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  linear_axis = require('./linear_axis');

  ticking = require('../../common/ticking');

  DatetimeAxisView = (function(_super) {
    __extends(DatetimeAxisView, _super);

    function DatetimeAxisView() {
      _ref = DatetimeAxisView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    DatetimeAxisView.prototype.initialize = function(attrs, options) {
      DatetimeAxisView.__super__.initialize.call(this, attrs, options);
      return this.formatter = new ticking.DatetimeFormatter();
    };

    return DatetimeAxisView;

  })(linear_axis.LinearAxisView);

  DatetimeAxis = (function(_super) {
    __extends(DatetimeAxis, _super);

    function DatetimeAxis() {
      _ref1 = DatetimeAxis.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    DatetimeAxis.prototype.default_view = DatetimeAxisView;

    DatetimeAxis.prototype.type = 'GuideRenderer';

    DatetimeAxis.prototype.initialize = function(attrs, options) {
      return DatetimeAxis.__super__.initialize.call(this, attrs, options);
    };

    return DatetimeAxis;

  })(linear_axis.LinearAxis);

  DatetimeAxes = (function(_super) {
    __extends(DatetimeAxes, _super);

    function DatetimeAxes() {
      _ref2 = DatetimeAxes.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    DatetimeAxes.prototype.model = DatetimeAxis;

    return DatetimeAxes;

  })(Backbone.Collection);

  exports.datetimeaxes = new DatetimeAxes();

  exports.DatetimeAxis = DatetimeAxis;

  exports.DatetimeAxisView = DatetimeAxisView;

}).call(this);
}, "renderers/guide/grid": function(exports, require, module) {(function() {
  var Grid, GridView, Grids, HasParent, PlotWidget, base, line_properties, properties, safebind, ticking, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../../base');

  HasParent = base.HasParent;

  safebind = base.safebind;

  properties = require('../properties');

  line_properties = properties.line_properties;

  PlotWidget = require('../../common/plot_widget').PlotWidget;

  ticking = require('../../common/ticking');

  GridView = (function(_super) {
    __extends(GridView, _super);

    function GridView() {
      _ref = GridView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GridView.prototype.initialize = function(attrs, options) {
      GridView.__super__.initialize.call(this, attrs, options);
      return this.grid_props = new line_properties(this, null, 'grid_');
    };

    GridView.prototype.render = function() {
      var ctx;
      ctx = this.plot_view.ctx;
      ctx.save();
      this._draw_grids(ctx);
      return ctx.restore();
    };

    GridView.prototype.bind_bokeh_events = function() {
      return safebind(this, this.model, 'change', this.request_render);
    };

    GridView.prototype._draw_grids = function(ctx) {
      var i, sx, sy, xs, ys, _i, _j, _ref1, _ref2, _ref3, _ref4;
      if (!this.grid_props.do_stroke) {
        return;
      }
      _ref1 = this.mget('grid_coords'), xs = _ref1[0], ys = _ref1[1];
      this.grid_props.set(ctx, this);
      for (i = _i = 0, _ref2 = xs.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        _ref3 = this.plot_view.map_to_screen(xs[i], "data", ys[i], "data"), sx = _ref3[0], sy = _ref3[1];
        ctx.beginPath();
        ctx.moveTo(Math.round(sx[0]), Math.round(sy[0]));
        for (i = _j = 1, _ref4 = sx.length - 1; 1 <= _ref4 ? _j <= _ref4 : _j >= _ref4; i = 1 <= _ref4 ? ++_j : --_j) {
          ctx.lineTo(Math.round(sx[i]), Math.round(sy[i]));
        }
        ctx.stroke();
      }
    };

    return GridView;

  })(PlotWidget);

  Grid = (function(_super) {
    __extends(Grid, _super);

    function Grid() {
      _ref1 = Grid.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Grid.prototype.default_view = GridView;

    Grid.prototype.type = 'GuideRenderer';

    Grid.prototype.initialize = function(attrs, options) {
      Grid.__super__.initialize.call(this, attrs, options);
      this.register_property('computed_bounds', this._bounds, false);
      this.add_dependencies('computed_bounds', this, ['bounds']);
      this.register_property('grid_coords', this._grid_coords, false);
      return this.add_dependencies('grid_coords', this, ['computed_bounds', 'dimension']);
    };

    Grid.prototype._bounds = function() {
      var end, i, j, range_bounds, ranges, start, user_bounds, _ref2;
      i = this.get('dimension');
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      user_bounds = (_ref2 = this.get('bounds')) != null ? _ref2 : 'auto';
      range_bounds = [ranges[i].get('min'), ranges[i].get('max')];
      if (_.isArray(user_bounds)) {
        start = Math.min(user_bounds[0], user_bounds[1]);
        end = Math.max(user_bounds[0], user_bounds[1]);
        if (start < range_bounds[0]) {
          start = range_bounds[0];
        } else if (start > range_bounds[1]) {
          start = null;
        }
        if (end > range_bounds[1]) {
          end = range_bounds[1];
        } else if (end < range_bounds[0]) {
          end = null;
        }
      } else {
        start = range_bounds[0], end = range_bounds[1];
      }
      return [start, end];
    };

    Grid.prototype._grid_coords = function() {
      var N, cmax, cmin, coords, cross_range, dim_i, dim_j, end, i, ii, interval, j, loc, max, min, n, range, ranges, start, ticks, tmp, _i, _j, _ref2, _ref3, _ref4;
      i = this.get('dimension');
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      range = ranges[i];
      cross_range = ranges[j];
      _ref2 = this.get('computed_bounds'), start = _ref2[0], end = _ref2[1];
      tmp = Math.min(start, end);
      end = Math.max(start, end);
      start = tmp;
      interval = ticking.auto_interval(start, end);
      ticks = ticking.auto_ticks(null, null, start, end, interval);
      min = range.get('min');
      max = range.get('max');
      cmin = cross_range.get('min');
      cmax = cross_range.get('max');
      coords = [[], []];
      for (ii = _i = 0, _ref3 = ticks.length - 1; 0 <= _ref3 ? _i <= _ref3 : _i >= _ref3; ii = 0 <= _ref3 ? ++_i : --_i) {
        if (ticks[ii] === min || ticks[ii] === max) {
          continue;
        }
        dim_i = [];
        dim_j = [];
        N = 2;
        for (n = _j = 0, _ref4 = N - 1; 0 <= _ref4 ? _j <= _ref4 : _j >= _ref4; n = 0 <= _ref4 ? ++_j : --_j) {
          loc = cmin + (cmax - cmin) / (N - 1) * n;
          dim_i.push(ticks[ii]);
          dim_j.push(loc);
        }
        coords[i].push(dim_i);
        coords[j].push(dim_j);
      }
      return coords;
    };

    return Grid;

  })(HasParent);

  Grid.prototype.defaults = _.clone(Grid.prototype.defaults);

  Grid.prototype.display_defaults = _.clone(Grid.prototype.display_defaults);

  _.extend(Grid.prototype.display_defaults, {
    level: 'underlay',
    grid_line_color: '#aaaaaa',
    grid_line_width: 1,
    grid_line_alpha: 1.0,
    grid_line_join: 'miter',
    grid_line_cap: 'butt',
    grid_line_dash: [4, 6],
    grid_line_dash_offset: 0
  });

  Grids = (function(_super) {
    __extends(Grids, _super);

    function Grids() {
      _ref2 = Grids.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    Grids.prototype.model = Grid;

    return Grids;

  })(Backbone.Collection);

  exports.grids = new Grids();

  exports.Grid = Grid;

  exports.GridView = GridView;

}).call(this);
}, "renderers/guide/linear_axis": function(exports, require, module) {(function() {
  var HasParent, LinearAxes, LinearAxis, LinearAxisView, PlotWidget, base, line_properties, properties, safebind, signum, text_properties, ticking, _align_lookup, _angle_lookup, _baseline_lookup, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../../base');

  HasParent = base.HasParent;

  safebind = base.safebind;

  properties = require('../properties');

  line_properties = properties.line_properties;

  text_properties = properties.text_properties;

  PlotWidget = require('../../common/plot_widget').PlotWidget;

  ticking = require('../../common/ticking');

  signum = function(x) {
    var _ref;
    return (_ref = x != null ? x : x < 0) != null ? _ref : -{
      1: {
        1: 0
      }
    };
  };

  _angle_lookup = {
    top: {
      parallel: 0,
      normal: -Math.PI / 2,
      horizontal: 0,
      vertical: -Math.PI / 2
    },
    bottom: {
      parallel: 0,
      normal: Math.PI / 2,
      horizontal: 0,
      vertical: Math.PI / 2
    },
    left: {
      parallel: -Math.PI / 2,
      normal: 0,
      horizontal: 0,
      vertical: -Math.PI / 2
    },
    right: {
      parallel: Math.PI / 2,
      normal: 0,
      horizontal: 0,
      vertical: Math.PI / 2
    }
  };

  _baseline_lookup = {
    top: {
      parallel: 'alphabetic',
      normal: 'middle',
      horizontal: 'alphabetic',
      vertical: 'middle'
    },
    bottom: {
      parallel: 'hanging',
      normal: 'middle',
      horizontal: 'hanging',
      vertical: 'middle'
    },
    left: {
      parallel: 'alphabetic',
      normal: 'middle',
      horizontal: 'middle',
      vertical: 'alphabetic'
    },
    right: {
      parallel: 'alphabetic',
      normal: 'middle',
      horizontal: 'middle',
      vertical: 'alphabetic'
    }
  };

  _align_lookup = {
    top: {
      parallel: 'center',
      normal: 'left',
      horizontal: 'center',
      vertical: 'left'
    },
    bottom: {
      parallel: 'center',
      normal: 'left',
      horizontal: 'center',
      vertical: 'right'
    },
    left: {
      parallel: 'center',
      normal: 'right',
      horizontal: 'right',
      vertical: 'center'
    },
    right: {
      parallel: 'center',
      normal: 'left',
      horizontal: 'left',
      vertical: 'center'
    }
  };

  LinearAxisView = (function(_super) {
    __extends(LinearAxisView, _super);

    function LinearAxisView() {
      _ref = LinearAxisView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LinearAxisView.prototype.initialize = function(attrs, options) {
      LinearAxisView.__super__.initialize.call(this, attrs, options);
      this.rule_props = new line_properties(this, null, 'axis_');
      this.major_tick_props = new line_properties(this, null, 'major_tick_');
      this.major_label_props = new text_properties(this, null, 'major_label_');
      this.axis_label_props = new text_properties(this, null, 'axis_label_');
      return this.formatter = new ticking.BasicTickFormatter();
    };

    LinearAxisView.prototype.render = function() {
      var ctx;
      ctx = this.plot_view.ctx;
      ctx.save();
      this._draw_rule(ctx);
      this._draw_major_ticks(ctx);
      this._draw_major_labels(ctx);
      this._draw_axis_label(ctx);
      return ctx.restore();
    };

    LinearAxisView.prototype.bind_bokeh_events = function() {
      return safebind(this, this.model, 'change', this.request_render);
    };

    LinearAxisView.prototype.padding_request = function() {
      return this._padding_request();
    };

    LinearAxisView.prototype._draw_rule = function(ctx) {
      var coords, i, sx, sy, x, y, _i, _ref1, _ref2, _ref3;
      _ref1 = coords = this.mget('rule_coords'), x = _ref1[0], y = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
      this.rule_props.set(ctx, this);
      ctx.beginPath();
      ctx.moveTo(Math.round(sx[0]), Math.round(sy[0]));
      for (i = _i = 1, _ref3 = sx.length - 1; 1 <= _ref3 ? _i <= _ref3 : _i >= _ref3; i = 1 <= _ref3 ? ++_i : --_i) {
        ctx.lineTo(Math.round(sx[i]), Math.round(sy[i]));
      }
      ctx.stroke();
    };

    LinearAxisView.prototype._draw_major_ticks = function(ctx) {
      var coords, i, nx, ny, sx, sy, tin, tout, x, y, _i, _ref1, _ref2, _ref3, _ref4;
      _ref1 = coords = this.mget('major_coords'), x = _ref1[0], y = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
      _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
      tin = this.mget('major_tick_in');
      tout = this.mget('major_tick_out');
      this.major_tick_props.set(ctx, this);
      for (i = _i = 0, _ref4 = sx.length - 1; 0 <= _ref4 ? _i <= _ref4 : _i >= _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
        ctx.beginPath();
        ctx.moveTo(Math.round(sx[i] + nx * tout), Math.round(sy[i] + ny * tout));
        ctx.lineTo(Math.round(sx[i] - nx * tin), Math.round(sy[i] - ny * tin));
        ctx.stroke();
      }
    };

    LinearAxisView.prototype._draw_major_labels = function(ctx) {
      var angle, coords, dim, i, labels, nx, ny, orient, side, standoff, sx, sy, x, y, _i, _ref1, _ref2, _ref3, _ref4;
      _ref1 = coords = this.mget('major_coords'), x = _ref1[0], y = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
      _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
      dim = this.mget('dimension');
      side = this.mget('side');
      orient = this.mget('major_label_orientation');
      if (_.isString(orient)) {
        angle = _angle_lookup[side][orient];
      } else {
        angle = -orient;
      }
      standoff = this._tick_extent() + this.mget('major_label_standoff');
      labels = this.formatter.format(coords[dim]);
      this.major_label_props.set(ctx, this);
      this._apply_location_heuristics(ctx, side, orient);
      for (i = _i = 0, _ref4 = sx.length - 1; 0 <= _ref4 ? _i <= _ref4 : _i >= _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
        if (angle) {
          ctx.translate(sx[i] + nx * standoff, sy[i] + ny * standoff);
          ctx.rotate(angle);
          ctx.fillText(labels[i], 0, 0);
          ctx.rotate(-angle);
          ctx.translate(-sx[i] - nx * standoff, -sy[i] - ny * standoff);
        } else {
          ctx.fillText(labels[i], Math.round(sx[i] + nx * standoff), Math.round(sy[i] + ny * standoff));
        }
      }
    };

    LinearAxisView.prototype._draw_axis_label = function(ctx) {
      var angle, label, nx, ny, orient, side, standoff, sx, sy, x, y, _ref1, _ref2, _ref3;
      label = this.mget('axis_label');
      if (label == null) {
        return;
      }
      _ref1 = this.mget('rule_coords'), x = _ref1[0], y = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
      _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
      side = this.mget('side');
      orient = 'parallel';
      angle = _angle_lookup[side][orient];
      standoff = this._tick_extent() + this._tick_label_extent() + this.mget('axis_label_standoff');
      sx = (sx[0] + sx[sx.length - 1]) / 2;
      sy = (sy[0] + sy[sy.length - 1]) / 2;
      this.axis_label_props.set(ctx, this);
      this._apply_location_heuristics(ctx, side, orient);
      if (angle) {
        ctx.translate(sx + nx * standoff, sy + ny * standoff);
        ctx.rotate(angle);
        ctx.fillText(label, 0, 0);
        ctx.rotate(-angle);
        ctx.translate(-sx - nx * standoff, -sy - ny * standoff);
      } else {
        ctx.fillText(label, sx + nx * standoff, sy + ny * standoff);
      }
    };

    LinearAxisView.prototype._apply_location_heuristics = function(ctx, side, orient) {
      var align, baseline;
      if (_.isString(orient)) {
        baseline = _baseline_lookup[side][orient];
        align = _align_lookup[side][orient];
      } else if (orient === 0) {
        baseline = _baseline_lookup[side][orient];
        align = _align_lookup[side][orient];
      } else if (orient < 0) {
        baseline = 'middle';
        if (side === 'top') {
          align = 'right';
        } else if (side === 'bottom') {
          align = 'left';
        } else if (side === 'left') {
          align = 'right';
        } else if (side === 'right') {
          align = 'left';
        }
      } else if (orient > 0) {
        baseline = 'middle';
        if (side === 'top') {
          align = 'left';
        } else if (side === 'bottom') {
          align = 'right';
        } else if (side === 'left') {
          align = 'right';
        } else if (side === 'right') {
          align = 'left';
        }
      }
      ctx.textBaseline = baseline;
      return ctx.textAlign = align;
    };

    LinearAxisView.prototype._tick_extent = function() {
      return this.mget('major_tick_out');
    };

    LinearAxisView.prototype._tick_label_extent = function() {
      var angle, c, coords, dim, extent, factor, h, i, labels, orient, s, side, val, w, _i, _j, _ref1, _ref2;
      extent = 0;
      dim = this.mget('dimension');
      coords = this.mget('major_coords');
      side = this.mget('side');
      orient = this.mget('major_label_orientation');
      labels = this.formatter.format(coords[dim]);
      this.major_label_props.set(this.plot_view.ctx, this);
      if (_.isString(orient)) {
        factor = 1;
        angle = _angle_lookup[side][orient];
      } else {
        factor = 2;
        angle = -orient;
      }
      angle = Math.abs(angle);
      c = Math.cos(angle);
      s = Math.sin(angle);
      if (side === "top" || side === "bottom") {
        for (i = _i = 0, _ref1 = labels.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (labels[i] == null) {
            continue;
          }
          w = this.plot_view.ctx.measureText(labels[i]).width * 1.1;
          h = this.plot_view.ctx.measureText(labels[i]).ascent * 0.9;
          val = w * s + (h / factor) * c;
          if (val > extent) {
            extent = val;
          }
        }
      } else {
        for (i = _j = 0, _ref2 = labels.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (labels[i] == null) {
            continue;
          }
          w = this.plot_view.ctx.measureText(labels[i]).width * 1.1;
          h = this.plot_view.ctx.measureText(labels[i]).ascent * 0.9;
          val = w * c + (h / factor) * s;
          if (val > extent) {
            extent = val;
          }
        }
      }
      if (extent > 0) {
        extent += this.mget('major_label_standoff');
      }
      return extent;
    };

    LinearAxisView.prototype._axis_label_extent = function() {
      var angle, c, extent, h, orient, s, side, w;
      extent = 0;
      side = this.mget('side');
      orient = 'parallel';
      this.major_label_props.set(this.plot_view.ctx, this);
      angle = Math.abs(_angle_lookup[side][orient]);
      c = Math.cos(angle);
      s = Math.sin(angle);
      if (this.mget('axis_label')) {
        extent += this.mget('axis_label_standoff');
        this.axis_label_props.set(this.plot_view.ctx, this);
        w = this.plot_view.ctx.measureText(this.mget('axis_label')).width * 1.1;
        h = this.plot_view.ctx.measureText(this.mget('axis_label')).ascent * 0.9;
        if (side === "top" || side === "bottom") {
          extent += w * s + h * c;
        } else {
          extent += w * c + h * s;
        }
      }
      return extent;
    };

    LinearAxisView.prototype._padding_request = function() {
      var loc, padding, req, side, _ref1;
      req = {};
      side = this.mget('side');
      loc = (_ref1 = this.mget('location')) != null ? _ref1 : 'min';
      if (!_.isString(loc)) {
        return req;
      }
      padding = 0;
      padding += this._tick_extent();
      padding += this._tick_label_extent();
      padding += this._axis_label_extent();
      req[side] = padding;
      return req;
    };

    return LinearAxisView;

  })(PlotWidget);

  LinearAxis = (function(_super) {
    __extends(LinearAxis, _super);

    function LinearAxis() {
      _ref1 = LinearAxis.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    LinearAxis.prototype.default_view = LinearAxisView;

    LinearAxis.prototype.type = 'GuideRenderer';

    LinearAxis.prototype.initialize = function(attrs, options) {
      LinearAxis.__super__.initialize.call(this, attrs, options);
      this.register_property('computed_bounds', this._bounds, false);
      this.add_dependencies('computed_bounds', this, ['bounds']);
      this.register_property('rule_coords', this._rule_coords, false);
      this.add_dependencies('rule_coords', this, ['computed_bounds', 'dimension', 'location']);
      this.register_property('major_coords', this._major_coords, false);
      this.add_dependencies('major_coords', this, ['computed_bounds', 'dimension', 'location']);
      this.register_property('normals', this._normals, false);
      this.add_dependencies('normals', this, ['computed_bounds', 'dimension', 'location']);
      this.register_property('side', this._side, false);
      this.add_dependencies('side', this, ['normals']);
      return this.register_property('padding_request', this._padding_request, false);
    };

    LinearAxis.prototype.dinitialize = function(attrs, options) {
      return this.add_dependencies('computed_bounds', this.get_obj('plot'), ['x_range', 'y_range']);
    };

    LinearAxis.prototype._bounds = function() {
      var end, i, j, range_bounds, ranges, start, user_bounds, _ref2;
      i = this.get('dimension');
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      user_bounds = (_ref2 = this.get('bounds')) != null ? _ref2 : 'auto';
      range_bounds = [ranges[i].get('min'), ranges[i].get('max')];
      if (_.isArray(user_bounds)) {
        if (Math.abs(user_bounds[0] - user_bounds[1]) > Math.abs(range_bounds[0] - range_bounds[1])) {
          start = Math.max(Math.min(user_bounds[0], user_bounds[1]), range_bounds[0]);
          end = Math.min(Math.max(user_bounds[0], user_bounds[1]), range_bounds[1]);
        } else {
          start = Math.min(user_bounds[0], user_bounds[1]);
          end = Math.max(user_bounds[0], user_bounds[1]);
        }
      } else {
        start = range_bounds[0], end = range_bounds[1];
      }
      return [start, end];
    };

    LinearAxis.prototype._rule_coords = function() {
      var coords, cross_range, end, i, j, loc, range, range_max, range_min, ranges, start, xs, ys, _ref2, _ref3, _ref4;
      i = this.get('dimension');
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      range = ranges[i];
      cross_range = ranges[j];
      _ref2 = this.get('computed_bounds'), start = _ref2[0], end = _ref2[1];
      xs = new Float64Array(2);
      ys = new Float64Array(2);
      coords = [xs, ys];
      loc = (_ref3 = this.get('location')) != null ? _ref3 : 'min';
      if (_.isString(loc)) {
        if (loc === 'left' || loc === 'bottom') {
          loc = 'start';
        } else if (loc === 'right' || loc === 'top') {
          loc = 'end';
        }
        loc = cross_range.get(loc);
      }
      _ref4 = [range.get('min'), range.get('max')], range_min = _ref4[0], range_max = _ref4[1];
      coords[i][0] = Math.max(start, range_min);
      coords[i][1] = Math.min(end, range_max);
      coords[j][0] = loc;
      coords[j][1] = loc;
      if (coords[i][0] > coords[i][1]) {
        coords[i][0] = coords[i][1] = NaN;
      }
      return coords;
    };

    LinearAxis.prototype._major_coords = function() {
      var coords, cross_range, end, i, ii, interval, j, loc, range, range_max, range_min, ranges, start, ticks, xs, ys, _i, _ref2, _ref3, _ref4, _ref5;
      i = this.get('dimension');
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      range = ranges[i];
      cross_range = ranges[j];
      _ref2 = this.get('computed_bounds'), start = _ref2[0], end = _ref2[1];
      interval = ticking.auto_interval(start, end);
      ticks = ticking.auto_ticks(null, null, start, end, interval);
      loc = (_ref3 = this.get('location')) != null ? _ref3 : 'min';
      if (_.isString(loc)) {
        if (loc === 'left' || loc === 'bottom') {
          loc = 'start';
        } else if (loc === 'right' || loc === 'top') {
          loc = 'end';
        }
        loc = cross_range.get(loc);
      }
      xs = [];
      ys = [];
      coords = [xs, ys];
      _ref4 = [range.get('min'), range.get('max')], range_min = _ref4[0], range_max = _ref4[1];
      for (ii = _i = 0, _ref5 = ticks.length - 1; 0 <= _ref5 ? _i <= _ref5 : _i >= _ref5; ii = 0 <= _ref5 ? ++_i : --_i) {
        if (ticks[ii] < range_min || ticks[ii] > range_max) {
          continue;
        }
        coords[i].push(ticks[ii]);
        coords[j].push(loc);
      }
      return coords;
    };

    LinearAxis.prototype._normals = function() {
      var cend, cross_range, cstart, end, i, j, loc, normals, range, ranges, start, _ref2, _ref3;
      i = this.get('dimension');
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      range = ranges[i];
      cross_range = ranges[j];
      _ref2 = this.get('computed_bounds'), start = _ref2[0], end = _ref2[1];
      loc = (_ref3 = this.get('location')) != null ? _ref3 : 'min';
      cstart = cross_range.get('start');
      cend = cross_range.get('end');
      normals = [0, 0];
      if (_.isString(loc)) {
        normals[j] = (end - start) < 0 ? -1 : 1;
        if (i === 0) {
          if ((loc === 'max' && (cstart < cend)) || (loc === 'min' && (cstart > cend)) || loc === 'right' || loc === 'top') {
            normals[j] *= -1;
          }
        } else if (i === 1) {
          if ((loc === 'min' && (cstart < cend)) || (loc === 'max' && (cstart > cend)) || loc === 'left' || loc === 'bottom') {
            normals[j] *= -1;
          }
        }
      } else {
        if (i === 0) {
          if (Math.abs(loc - cstart) <= Math.abs(loc - cend)) {
            normals[j] = 1;
          } else {
            normals[j] = -1;
          }
        } else {
          if (Math.abs(loc - cstart) <= Math.abs(loc - cend)) {
            normals[j] = -1;
          } else {
            normals[j] = 1;
          }
        }
      }
      return normals;
    };

    LinearAxis.prototype._side = function() {
      var n, side;
      n = this.get('normals');
      if (n[1] === -1) {
        side = 'top';
      } else if (n[1] === 1) {
        side = 'bottom';
      } else if (n[0] === -1) {
        side = 'left';
      } else if (n[0] === 1) {
        side = 'right';
      }
      return side;
    };

    return LinearAxis;

  })(HasParent);

  LinearAxis.prototype.defaults = _.clone(LinearAxis.prototype.defaults);

  LinearAxis.prototype.display_defaults = _.clone(LinearAxis.prototype.display_defaults);

  _.extend(LinearAxis.prototype.display_defaults, {
    level: 'overlay',
    axis_line_color: 'black',
    axis_line_width: 1,
    axis_line_alpha: 1.0,
    axis_line_join: 'miter',
    axis_line_cap: 'butt',
    axis_line_dash: [],
    axis_line_dash_offset: 0,
    major_tick_in: 2,
    major_tick_out: 6,
    major_tick_line_color: 'black',
    major_tick_line_width: 1,
    major_tick_line_alpha: 1.0,
    major_tick_line_join: 'miter',
    major_tick_line_cap: 'butt',
    major_tick_line_dash: [],
    major_tick_line_dash_offset: 0,
    major_label_standoff: 5,
    major_label_orientation: "horizontal",
    major_label_text_font: "helvetica",
    major_label_text_font_size: "10pt",
    major_label_text_font_style: "normal",
    major_label_text_color: "#444444",
    major_label_text_alpha: 1.0,
    major_label_text_align: "center",
    major_label_text_baseline: "alphabetic",
    axis_label: "",
    axis_label_standoff: 5,
    axis_label_text_font: "helvetica",
    axis_label_text_font_size: "16pt",
    axis_label_text_font_style: "normal",
    axis_label_text_color: "#444444",
    axis_label_text_alpha: 1.0,
    axis_label_text_align: "center",
    axis_label_text_baseline: "alphabetic",
    rounding_value: 20
  });

  LinearAxes = (function(_super) {
    __extends(LinearAxes, _super);

    function LinearAxes() {
      _ref2 = LinearAxes.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    LinearAxes.prototype.model = LinearAxis;

    return LinearAxes;

  })(Backbone.Collection);

  exports.linearaxes = new LinearAxes();

  exports.LinearAxis = LinearAxis;

  exports.LinearAxisView = LinearAxisView;

}).call(this);
}, "renderers/guide_renderer": function(exports, require, module) {(function() {
  var Collections, GuideRenderers, base, guides, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  guides = require('./guides');

  GuideRenderers = (function(_super) {
    __extends(GuideRenderers, _super);

    function GuideRenderers() {
      _ref = GuideRenderers.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GuideRenderers.prototype.model = function(attrs, options) {
      var model, type;
      if (attrs.type == null) {
        console.log("missing guide type");
        return;
      }
      type = attrs.type;
      if (!(type in guides)) {
        console.log("unknown guide type '" + type + "'");
        return;
      }
      model = guides[type];
      return new model(attrs, options);
    };

    return GuideRenderers;

  })(Backbone.Collection);

  exports.guiderenderers = new GuideRenderers;

}).call(this);
}, "renderers/guides": function(exports, require, module) {(function() {
  var datetime_axis, grid, linear_axis;

  linear_axis = require("./guide/linear_axis");

  datetime_axis = require("./guide/datetime_axis");

  grid = require("./guide/grid");

  exports.linear_axis = linear_axis.LinearAxis;

  exports.datetime_axis = datetime_axis.DatetimeAxis;

  exports.grid = grid.Grid;

}).call(this);
}, "renderers/properties": function(exports, require, module) {(function() {
  var fill_properties, glyph_properties, line_properties, properties, svg_colors, text_properties,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  svg_colors = require('../common/svg_colors').svg_colors;

  properties = (function() {
    function properties() {}

    properties.prototype.string = function(styleprovider, glyphspec, attrname) {
      var default_value, glyph_value;
      this[attrname] = {};
      default_value = styleprovider.mget(attrname);
      if (default_value == null) {

      } else if (_.isString(default_value)) {
        this[attrname]["default"] = default_value;
      } else {
        console.log(("string property '" + attrname + "' given invalid default value: ") + default_value);
      }
      if ((glyphspec == null) || !(attrname in glyphspec)) {
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value)) {
        return this[attrname].value = glyph_value;
      } else if (_.isObject(glyph_value)) {
        return this[attrname] = _.extend(this[attrname], glyph_value);
      } else {
        return console.log(("string property '" + attrname + "' given invalid glyph value: ") + glyph_value);
      }
    };

    properties.prototype.number = function(styleprovider, glyphspec, attrname) {
      var default_value, glyph_value, units_value, _ref;
      this[attrname] = {
        typed: true
      };
      default_value = styleprovider.mget(attrname);
      if (default_value == null) {

      } else if (_.isNumber(default_value)) {
        this[attrname]["default"] = default_value;
      } else {
        console.log(("number property '" + attrname + "' given invalid default value: ") + default_value);
      }
      units_value = (_ref = styleprovider.mget(attrname + '_units')) != null ? _ref : 'data';
      if ((glyphspec != null) && (attrname + '_units' in glyphspec)) {
        units_value = glyphspec[attrname + '_units'];
      }
      this[attrname].units = units_value;
      if ((glyphspec == null) || !(attrname in glyphspec)) {
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value)) {
        return this[attrname].field = glyph_value;
      } else if (_.isNumber(glyph_value)) {
        return this[attrname].value = glyph_value;
      } else if (_.isObject(glyph_value)) {
        return this[attrname] = _.extend(this[attrname], glyph_value);
      } else {
        return console.log(("number property '" + attrname + "' given invalid glyph value: ") + glyph_value);
      }
    };

    properties.prototype.color = function(styleprovider, glyphspec, attrname) {
      var default_value, glyph_value;
      this[attrname] = {};
      default_value = styleprovider.mget(attrname);
      if (_.isUndefined(default_value)) {
        this[attrname]["default"] = null;
      } else if (_.isString(default_value) && ((svg_colors[default_value] != null) || default_value.substring(0, 1) === "#") || _.isNull(default_value)) {
        this[attrname]["default"] = default_value;
      } else {
        console.log(("color property '" + attrname + "' given invalid default value: ") + default_value);
      }
      if ((glyphspec == null) || !(attrname in glyphspec)) {
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isNull(glyph_value)) {
        return this[attrname].value = null;
      } else if (_.isString(glyph_value)) {
        if ((svg_colors[glyph_value] != null) || glyph_value.substring(0, 1) === "#") {
          return this[attrname].value = glyph_value;
        } else {
          return this[attrname].field = glyph_value;
        }
      } else if (_.isObject(glyph_value)) {
        return this[attrname] = _.extend(this[attrname], glyph_value);
      } else {
        return console.log(("color property '" + attrname + "' given invalid glyph value: ") + glyph_value);
      }
    };

    properties.prototype.array = function(styleprovider, glyphspec, attrname) {
      var default_value, glyph_value, units_value, _ref;
      this[attrname] = {};
      default_value = styleprovider.mget(attrname);
      if (default_value == null) {

      } else if (_.isArray(default_value)) {
        this[attrname]["default"] = default_value;
      } else {
        console.log(("array property '" + attrname + "' given invalid default value: ") + default_value);
      }
      units_value = (_ref = styleprovider.mget(attrname + "_units")) != null ? _ref : 'data';
      if ((glyphspec != null) && (attrname + '_units' in glyphspec)) {
        units_value = glyphspec[attrname + '_units'];
      }
      this[attrname].units = units_value;
      if ((glyphspec == null) || !(attrname in glyphspec)) {
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value)) {
        return this[attrname].field = glyph_value;
      } else if (_.isArray(glyph_value)) {
        return this[attrname].value = glyph_value;
      } else if (_.isObject(glyph_value)) {
        return this[attrname] = _.extend(this[attrname], glyph_value);
      } else {
        return console.log(("array property '" + attrname + "' given invalid glyph value: ") + glyph_value);
      }
    };

    properties.prototype["enum"] = function(styleprovider, glyphspec, attrname, vals) {
      var default_value, glyph_value, levels;
      this[attrname] = {};
      levels = vals.split(" ");
      default_value = styleprovider.mget(attrname);
      if (_.isNull(default_value)) {

      } else if (_.isString(default_value) && __indexOf.call(levels, default_value) >= 0) {
        this[attrname] = {
          "default": default_value
        };
      } else {
        console.log(("enum property '" + attrname + "' given invalid default value: ") + default_value);
        console.log("    acceptable values:" + levels);
      }
      if ((glyphspec == null) || !(attrname in glyphspec)) {
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value)) {
        if (__indexOf.call(levels, glyph_value) >= 0) {
          return this[attrname].value = glyph_value;
        } else {
          return this[attrname].field = glyph_value;
        }
      } else if (_.isObject(glyph_value)) {
        return this[attrname] = _.extend(this[attrname], glyph_value);
      } else {
        console.log(("enum property '" + attrname + "' given invalid glyph value: ") + glyph_value);
        return console.log("    acceptable values:" + levels);
      }
    };

    properties.prototype.setattr = function(styleprovider, glyphspec, attrname, attrtype) {
      var values, _ref;
      values = null;
      if (attrtype.indexOf(":") > -1) {
        _ref = attrtype.split(":"), attrtype = _ref[0], values = _ref[1];
      }
      if (attrtype === "string") {
        return this.string(styleprovider, glyphspec, attrname);
      } else if (attrtype === "number") {
        return this.number(styleprovider, glyphspec, attrname);
      } else if (attrtype === "color") {
        return this.color(styleprovider, glyphspec, attrname);
      } else if (attrtype === "array") {
        return this.array(styleprovider, glyphspec, attrname);
      } else if (attrtype === "enum" && values) {
        return this["enum"](styleprovider, glyphspec, attrname, values);
      } else {
        return console.log(("Unknown type '" + attrtype + "' for glyph property: ") + attrname);
      }
    };

    properties.prototype.select = function(attrname, obj) {
      if (!(attrname in this)) {
        console.log(("requested selection of unknown property '" + attrname + "' on object: ") + obj);
        return;
      }
      if ((this[attrname].field != null) && (this[attrname].field in obj)) {
        return obj[this[attrname].field];
      }
      if (this[attrname].value != null) {
        return this[attrname].value;
      }
      if (obj[attrname] != null) {
        return obj[attrname];
      }
      if (this[attrname]["default"] != null) {
        return this[attrname]["default"];
      } else {
        return console.log("selection for attribute '" + attrname + "' failed on object: " + obj);
      }
    };

    properties.prototype.v_select = function(attrname, objs) {
      var i, obj, result, _i, _ref;
      if (!(attrname in this)) {
        console.log("requested vector selection of unknown property '" + attrname + "' on objects");
        return;
      }
      if (this[attrname].typed != null) {
        result = new Float32Array(objs.length);
      } else {
        result = new Array(objs.length);
      }
      for (i = _i = 0, _ref = objs.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        obj = objs[i];
        if ((this[attrname].field != null) && (this[attrname].field in obj)) {
          result[i] = obj[this[attrname].field];
        } else if (this[attrname].value != null) {
          result[i] = this[attrname].value;
        } else if (obj[attrname] != null) {
          result[i] = obj[attrname];
        } else if (this[attrname]["default"] != null) {
          result[i] = this[attrname]["default"];
        } else {
          console.log("vector selection for attribute '" + attrname + "' failed on object: " + obj);
          return;
        }
      }
      return result;
    };

    return properties;

  })();

  line_properties = (function(_super) {
    __extends(line_properties, _super);

    function line_properties(styleprovider, glyphspec, prefix) {
      if (prefix == null) {
        prefix = "";
      }
      this.line_color_name = "" + prefix + "line_color";
      this.line_width_name = "" + prefix + "line_width";
      this.line_alpha_name = "" + prefix + "line_alpha";
      this.line_join_name = "" + prefix + "line_join";
      this.line_cap_name = "" + prefix + "line_cap";
      this.line_dash_name = "" + prefix + "line_dash";
      this.line_dash_offset_name = "" + prefix + "line_dash_offset";
      this.color(styleprovider, glyphspec, this.line_color_name);
      this.number(styleprovider, glyphspec, this.line_width_name);
      this.number(styleprovider, glyphspec, this.line_alpha_name);
      this["enum"](styleprovider, glyphspec, this.line_join_name, "miter round bevel");
      this["enum"](styleprovider, glyphspec, this.line_cap_name, "butt round square");
      this.array(styleprovider, glyphspec, this.line_dash_name);
      this.number(styleprovider, glyphspec, this.line_dash_offset_name);
      this.do_stroke = true;
      if (!_.isUndefined(this[this.line_color_name].value)) {
        if (_.isNull(this[this.line_color_name].value)) {
          this.do_stroke = false;
        }
      } else if (_.isNull(this[this.line_color_name]["default"])) {
        this.do_stroke = false;
      }
    }

    line_properties.prototype.set = function(ctx, obj) {
      ctx.strokeStyle = this.select(this.line_color_name, obj);
      ctx.globalAlpha = this.select(this.line_alpha_name, obj);
      ctx.lineWidth = this.select(this.line_width_name, obj);
      ctx.lineJoin = this.select(this.line_join_name, obj);
      ctx.lineCap = this.select(this.line_cap_name, obj);
      ctx.setLineDash(this.select(this.line_dash_name, obj));
      return ctx.setLineDashOffset(this.select(this.line_dash_offset_name, obj));
    };

    return line_properties;

  })(properties);

  fill_properties = (function(_super) {
    __extends(fill_properties, _super);

    function fill_properties(styleprovider, glyphspec, prefix) {
      if (prefix == null) {
        prefix = "";
      }
      this.fill_color_name = "" + prefix + "fill_color";
      this.fill_alpha_name = "" + prefix + "fill_alpha";
      this.color(styleprovider, glyphspec, this.fill_color_name);
      this.number(styleprovider, glyphspec, this.fill_alpha_name);
      this.do_fill = true;
      if (!_.isUndefined(this[this.fill_color_name].value)) {
        if (_.isNull(this[this.fill_color_name].value)) {
          this.do_fill = false;
        }
      } else if (_.isNull(this[this.fill_color_name]["default"])) {
        this.do_fill = false;
      }
    }

    fill_properties.prototype.set = function(ctx, obj) {
      ctx.fillStyle = this.select(this.fill_color_name, obj);
      return ctx.globalAlpha = this.select(this.fill_alpha_name, obj);
    };

    return fill_properties;

  })(properties);

  text_properties = (function(_super) {
    __extends(text_properties, _super);

    function text_properties(styleprovider, glyphspec, prefix) {
      if (prefix == null) {
        prefix = "";
      }
      this.text_font_name = "" + prefix + "text_font";
      this.text_font_size_name = "" + prefix + "text_font_size";
      this.text_font_style_name = "" + prefix + "text_font_style";
      this.text_color_name = "" + prefix + "text_color";
      this.text_alpha_name = "" + prefix + "text_alpha";
      this.text_align_name = "" + prefix + "text_align";
      this.text_baseline_name = "" + prefix + "text_baseline";
      this.string(styleprovider, glyphspec, this.text_font_name);
      this.string(styleprovider, glyphspec, this.text_font_size_name);
      this["enum"](styleprovider, glyphspec, this.text_font_style_name, "normal italic bold");
      this.color(styleprovider, glyphspec, this.text_color_name);
      this.number(styleprovider, glyphspec, this.text_alpha_name);
      this["enum"](styleprovider, glyphspec, this.text_align_name, "left right center");
      this["enum"](styleprovider, glyphspec, this.text_baseline_name, "top middle bottom alphabetic hanging");
    }

    text_properties.prototype.font = function(obj, font_size) {
      var font, font_style;
      if (font_size == null) {
        font_size = this.select(this.text_font_size_name, obj);
      }
      font = this.select(this.text_font_name, obj);
      font_style = this.select(this.text_font_style_name, obj);
      font = font_style + " " + font_size + " " + font;
      return font;
    };

    text_properties.prototype.set = function(ctx, obj) {
      ctx.font = this.font(obj);
      ctx.fillStyle = this.select(this.text_color_name, obj);
      ctx.globalAlpha = this.select(this.text_alpha_name, obj);
      ctx.textAlign = this.select(this.text_align_name, obj);
      return ctx.textBaseline = this.select(this.text_baseline_name, obj);
    };

    return text_properties;

  })(properties);

  glyph_properties = (function(_super) {
    __extends(glyph_properties, _super);

    function glyph_properties(styleprovider, glyphspec, attrnames, properties) {
      var attrname, attrtype, prop, _i, _j, _len, _len1, _ref;
      for (_i = 0, _len = attrnames.length; _i < _len; _i++) {
        attrname = attrnames[_i];
        attrtype = "number";
        if (attrname.indexOf(":") > -1) {
          _ref = attrname.split(":"), attrname = _ref[0], attrtype = _ref[1];
        }
        this.setattr(styleprovider, glyphspec, attrname, attrtype);
      }
      for (_j = 0, _len1 = properties.length; _j < _len1; _j++) {
        prop = properties[_j];
        this[prop.constructor.name] = prop;
      }
      this.fast_path = false;
      if ('fast_path' in glyphspec) {
        this.fast_path = glyphspec.fast_path;
      }
    }

    return glyph_properties;

  })(properties);

  exports.glyph_properties = glyph_properties;

  exports.fill_properties = fill_properties;

  exports.line_properties = line_properties;

  exports.text_properties = text_properties;

}).call(this);
}, "testutils": function(exports, require, module) {(function() {
  var Collections, bar_plot, base, data_table, glyph_plot, line_plot, make_glyph_plot, make_glyph_test, make_range_and_mapper, scatter_plot, zip,
    __hasProp = {}.hasOwnProperty;

  base = require("./base");

  Collections = base.Collections;

  zip = function() {
    var arr, i, length, lengthArray, _i, _results;
    lengthArray = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        arr = arguments[_i];
        _results.push(arr.length);
      }
      return _results;
    }).apply(this, arguments);
    length = Math.min.apply(Math, lengthArray);
    _results = [];
    for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
      _results.push((function() {
        var _j, _len, _results1;
        _results1 = [];
        for (_j = 0, _len = arguments.length; _j < _len; _j++) {
          arr = arguments[_j];
          _results1.push(arr[i]);
        }
        return _results1;
      }).apply(this, arguments));
    }
    return _results;
  };

  scatter_plot = function(parent, data_source, xfield, yfield, color_field, mark, colormapper, local) {
    var color_mapper, options, plot_model, source_name, xaxis, xdr, yaxis, ydr;
    if (_.isUndefined(local)) {
      local = true;
    }
    options = {
      'local': local
    };
    if (_.isUndefined(mark)) {
      mark = 'circle';
    }
    if (_.isUndefined(color_field)) {
      color_field = null;
    }
    if (_.isUndefined(color_mapper) && color_field) {
      color_mapper = Collections('DiscreteColorMapper').create({
        data_range: Collections('DataFactorRange').create({
          data_source: data_source.ref(),
          columns: ['x']
        }, options)
      }, options);
    }
    source_name = data_source.get('name');
    plot_model = Collections('Plot').create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    xdr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [xfield]
        }
      ]
    }, options);
    ydr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [yfield]
        }
      ]
    }, options);
    scatter_plot = Collections("ScatterRenderer").create({
      data_source: data_source.ref(),
      xdata_range: xdr.ref(),
      ydata_range: ydr.ref(),
      xfield: xfield,
      yfield: yfield,
      color_field: color_field,
      color_mapper: color_mapper,
      mark: mark,
      parent: plot_model.ref()
    }, options);
    xaxis = Collections('LinearAxis').create({
      'orientation': 'bottom',
      'parent': plot_model.ref(),
      'data_range': xdr.ref()
    }, options);
    yaxis = Collections('LinearAxis').create({
      'orientation': 'left',
      'parent': plot_model.ref(),
      'data_range': ydr.ref()
    }, options);
    plot_model.set({
      'renderers': [scatter_plot.ref()],
      'axes': [xaxis.ref(), yaxis.ref()]
    }, options);
    return plot_model;
  };

  data_table = function(parent, data_source, xfield, yfield, color_field, mark, colormapper, local) {
    var color_mapper, options, source_name, table_model, xdr, xmapper, ydr, ymapper;
    if (_.isUndefined(local)) {
      local = true;
    }
    options = {
      'local': local
    };
    if (_.isUndefined(mark)) {
      mark = 'circle';
    }
    if (_.isUndefined(color_field)) {
      color_field = null;
    }
    if (_.isUndefined(color_mapper) && color_field) {
      color_mapper = Collections('DiscreteColorMapper').create({
        data_range: Collections('DataFactorRange').create({
          data_source: data_source.ref(),
          columns: ['x']
        }, options)
      }, options);
    }
    source_name = data_source.get('name');
    table_model = Collections('Table').create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    xdr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [xfield]
        }
      ]
    }, options);
    ydr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [yfield]
        }
      ]
    }, options);
    xmapper = Collections('LinearMapper').create({
      data_range: xdr.ref(),
      screen_range: table_model.get('xrange')
    }, options);
    ymapper = Collections('LinearMapper').create({
      data_range: ydr.ref(),
      screen_range: table_model.get('yrange')
    }, options);
    scatter_plot = Collections("TableRenderer").create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      color_field: color_field,
      color_mapper: color_mapper,
      mark: mark,
      xmapper: xmapper.ref(),
      ymapper: ymapper.ref(),
      parent: table_model.ref()
    }, options);
    return table_model.set({
      'renderers': [scatter_plot.ref()]
    }, options);
  };

  make_range_and_mapper = function(data_source, datafields, padding, screen_range, ordinal, options) {
    var mapper, range;
    if (!ordinal) {
      range = Collections('DataRange1d').create({
        sources: [
          {
            ref: data_source.ref(),
            columns: datafields
          }
        ],
        rangepadding: padding
      }, options);
      mapper = Collections('LinearMapper').create({
        data_range: range.ref(),
        screen_range: screen_range.ref()
      }, options);
    } else {
      range = Collections('DataFactorRange').create({
        data_source: data_source.ref(),
        columns: [field]
      }, options);
      mapper = Collections('FactorMapper').create({
        data_range: range.ref(),
        screen_range: screen_range.ref()
      }, options);
    }
    return [range, mapper];
  };

  bar_plot = function(parent, data_source, xfield, yfield, orientation, local) {
    var options, plot_model, xaxis, xdr, xmapper, yaxis, ydr, ymapper, _ref, _ref1;
    if (_.isUndefined(local)) {
      local = true;
    }
    options = {
      'local': local
    };
    plot_model = Collections('Plot').create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    _ref = make_range_and_mapper(data_source, [xfield], Math.max([1 / (data_source.get('data').length - 1), 0.1]), plot_model.get_obj('xrange'), false, options), xdr = _ref[0], xmapper = _ref[1];
    _ref1 = make_range_and_mapper(data_source, [yfield], Math.max([1 / (data_source.get('data').length - 1), 0.1]), plot_model.get_obj('yrange'), false, options), ydr = _ref1[0], ymapper = _ref1[1];
    bar_plot = Collections("BarRenderer").create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      xmapper: xmapper.ref(),
      ymapper: ymapper.ref(),
      parent: plot_model.ref(),
      orientation: orientation
    }, options);
    xaxis = Collections('LinearAxis').create({
      orientation: 'bottom',
      mapper: xmapper.ref(),
      parent: plot_model.ref()
    }, options);
    yaxis = Collections('LinearAxis').create({
      orientation: 'left',
      mapper: ymapper.ref(),
      parent: plot_model.ref()
    }, options);
    return plot_model.set({
      renderers: [bar_plot.ref()],
      axes: [xaxis.ref(), yaxis.ref()]
    }, options);
  };

  line_plot = function(parent, data_source, xfield, yfield, local) {
    var options, plot_model, source_name, xaxis, xdr, yaxis, ydr;
    if (_.isUndefined(local)) {
      local = true;
    }
    options = {
      'local': local
    };
    source_name = data_source.get('name');
    plot_model = Collections('Plot').create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    xdr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [xfield]
        }
      ]
    }, options);
    ydr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [yfield]
        }
      ]
    }, options);
    line_plot = Collections("LineRenderer").create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      xdata_range: xdr.ref(),
      ydata_range: ydr.ref(),
      parent: plot_model.ref()
    }, options);
    xaxis = Collections('LinearAxis').create({
      'orientation': 'bottom',
      'data_range': xdr.ref(),
      'mapper': 'linear',
      'parent': plot_model.ref()
    }, options);
    yaxis = Collections('LinearAxis').create({
      'orientation': 'left',
      'data_range': ydr.ref(),
      'mapper': 'linear',
      'parent': plot_model.ref()
    }, options);
    return plot_model.set({
      'renderers': [line_plot.ref()],
      'axes': [xaxis.ref(), yaxis.ref()]
    }, options);
  };

  glyph_plot = function(data_source, renderer, dom_element, xdatanames, ydatanames) {
    var plot_model, xaxis, xdr, yaxis, ydr;
    if (xdatanames == null) {
      xdatanames = ['x'];
    }
    if (ydatanames == null) {
      ydatanames = ['y'];
    }
    plot_model = Collections('Plot').create();
    xdr = Collections('DataRange1d').create({
      sources: [
        {
          ref: data_source.ref(),
          columns: ['x']
        }
      ]
    });
    ydr = Collections('DataRange1d').create({
      sources: [
        {
          ref: data_source.ref(),
          columns: ['y']
        }
      ]
    });
    renderer.set('xdata_range', xdr.ref());
    renderer.set('ydata_range', ydr.ref());
    xaxis = Collections('LinearAxis').create({
      orientation: 'bottom',
      parent: plot_model.ref(),
      data_range: xdr.ref()
    });
    yaxis = Collections('LinearAxis').create({
      orientation: 'left',
      parent: plot_model.ref(),
      data_range: ydr.ref()
    });
    plot_model.set({
      renderers: [renderer.ref()],
      axes: [xaxis.ref(), yaxis.ref()]
    });
    return plot_model;
  };

  make_glyph_plot = function(data_source, defaults, glyphspecs, xrange, yrange, _arg) {
    var axes, boxselectionoverlay, dims, ds, embedtool, g, glyph, glyphs, glyphspec, idx, legend, legend_name, legend_renderer, legends, pantool, plot_model, plot_title, plot_tools, pstool, reference_point, resizetool, selecttool, tools, val, x, xaxis1, xaxis2, xgrid, yaxis1, yaxis2, ygrid, zoomtool, _i, _j, _k, _len, _len1, _len2, _ref;
    dims = _arg.dims, tools = _arg.tools, axes = _arg.axes, legend = _arg.legend, legend_name = _arg.legend_name, plot_title = _arg.plot_title, reference_point = _arg.reference_point;
    if (dims == null) {
      dims = [400, 400];
    }
    if (tools == null) {
      tools = true;
    }
    if (axes == null) {
      axes = true;
    }
    if (legend == null) {
      legend = true;
    }
    if (legend_name == null) {
      legend_name = "glyph";
    }
    if (plot_title == null) {
      plot_title = "";
    }
    glyphs = [];
    if (!_.isArray(glyphspecs)) {
      glyphspecs = [glyphspecs];
    }
    if (!_.isArray(data_source)) {
      for (_i = 0, _len = glyphspecs.length; _i < _len; _i++) {
        glyphspec = glyphspecs[_i];
        glyph = Collections('GlyphRenderer').create({
          data_source: data_source.ref(),
          glyphspec: glyphspec,
          nonselection_glyphspec: {
            fill_alpha: 0.1,
            line_alpha: 0.1
          },
          reference_point: reference_point
        });
        glyph.set(defaults);
        glyphs.push(glyph);
      }
    } else {
      _ref = zip(glyphspecs, data_source);
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        val = _ref[_j];
        glyphspec = val[0], ds = val[1];
        glyph = Collections('GlyphRenderer').create({
          xdata_range: xrange.ref(),
          ydata_range: yrange.ref(),
          data_source: ds.ref(),
          glyphspec: glyphspec
        });
        glyph.set(defaults);
        glyphs.push(glyph);
      }
    }
    plot_model = Collections('Plot').create({
      x_range: xrange.ref(),
      y_range: yrange.ref(),
      canvas_width: dims[0],
      canvas_height: dims[1],
      outer_width: dims[0],
      outer_height: dims[1],
      title: plot_title
    });
    plot_model.set(defaults);
    plot_model.add_renderers((function() {
      var _k, _len2, _results;
      _results = [];
      for (_k = 0, _len2 = glyphs.length; _k < _len2; _k++) {
        g = glyphs[_k];
        _results.push(g.ref());
      }
      return _results;
    })());
    if (axes) {
      xaxis1 = Collections('GuideRenderer').create({
        type: 'linear_axis',
        dimension: 0,
        axis_label: 'x',
        plot: plot_model.ref()
      });
      yaxis1 = Collections('GuideRenderer').create({
        type: 'linear_axis',
        dimension: 1,
        axis_label: 'y',
        plot: plot_model.ref()
      });
      xaxis2 = Collections('GuideRenderer').create({
        type: 'linear_axis',
        dimension: 0,
        location: 'max',
        plot: plot_model.ref()
      });
      yaxis2 = Collections('GuideRenderer').create({
        type: 'linear_axis',
        dimension: 1,
        location: 'max',
        plot: plot_model.ref()
      });
      xgrid = Collections('GuideRenderer').create({
        type: 'grid',
        dimension: 0,
        plot: plot_model.ref()
      });
      ygrid = Collections('GuideRenderer').create({
        type: 'grid',
        dimension: 1,
        plot: plot_model.ref()
      });
      plot_model.add_renderers([xgrid.ref(), ygrid.ref(), xaxis1.ref(), yaxis1.ref(), xaxis2.ref(), yaxis2.ref()]);
    }
    if (tools) {
      pantool = Collections('PanTool').create({
        dataranges: [xrange.ref(), yrange.ref()],
        dimensions: ['width', 'height']
      });
      zoomtool = Collections('ZoomTool').create({
        dataranges: [xrange.ref(), yrange.ref()],
        dimensions: ['width', 'height']
      });
      selecttool = Collections('SelectionTool').create({
        renderers: (function() {
          var _k, _len2, _results;
          _results = [];
          for (_k = 0, _len2 = glyphs.length; _k < _len2; _k++) {
            x = glyphs[_k];
            _results.push(x.ref());
          }
          return _results;
        })()
      });
      boxselectionoverlay = Collections('BoxSelectionOverlay').create({
        tool: selecttool.ref()
      });
      resizetool = Collections('ResizeTool').create();
      pstool = Collections('PreviewSaveTool').create();
      embedtool = Collections('EmbedTool').create();
      plot_tools = [pantool, zoomtool, pstool, resizetool, selecttool, embedtool];
      plot_model.set_obj('tools', plot_tools);
      plot_model.add_renderers([boxselectionoverlay.ref()]);
    }
    if (legend) {
      legends = {};
      legend_renderer = Collections("AnnotationRenderer").create({
        plot: plot_model.ref(),
        annotationspec: {
          type: "legend",
          orientation: "top_right",
          legends: legends
        }
      });
      for (idx = _k = 0, _len2 = glyphs.length; _k < _len2; idx = ++_k) {
        g = glyphs[idx];
        legends[legend_name + String(idx)] = [g.ref()];
      }
      plot_model.add_renderers([legend_renderer.ref()]);
    }
    return plot_model;
  };

  make_glyph_test = function(test_name, data_source, defaults, glyphspecs, xrange, yrange, _arg) {
    var axes, dims, legend, legend_name, plot_title, reference_point, tools;
    dims = _arg.dims, tools = _arg.tools, axes = _arg.axes, legend = _arg.legend, legend_name = _arg.legend_name, plot_title = _arg.plot_title, reference_point = _arg.reference_point;
    if (dims == null) {
      dims = [400, 400];
    }
    if (tools == null) {
      tools = true;
    }
    if (axes == null) {
      axes = true;
    }
    if (legend == null) {
      legend = true;
    }
    if (legend_name == null) {
      legend_name = "glyph";
    }
    if (plot_title == null) {
      plot_title = "";
    }
    return function() {
      var div, myrender, opts, plot_model;
      expect(0);
      opts = {
        dims: dims,
        tools: tools,
        axes: axes,
        legend: legend,
        legend_name: legend_name,
        plot_title: plot_title,
        reference_point: reference_point
      };
      plot_model = make_glyph_plot(data_source, defaults, glyphspecs, xrange, yrange, opts);
      div = $('<div class="plotdiv"></div>');
      $('body').append(div);
      myrender = function() {
        var view;
        view = new plot_model.default_view({
          model: plot_model
        });
        div.append(view.$el);
        return console.log('Test ' + test_name);
      };
      return _.defer(myrender);
    };
  };

  window.bokehprettyprint = function(obj) {
    var key, val, _results;
    _results = [];
    for (key in obj) {
      if (!__hasProp.call(obj, key)) continue;
      val = obj[key];
      _results.push(console.log(key, val));
    }
    return _results;
  };

  exports.scatter_plot = scatter_plot;

  exports.data_table = data_table;

  exports.make_range_and_mapper = make_range_and_mapper;

  exports.bar_plot = bar_plot;

  exports.line_plot = line_plot;

  exports.glyph_plot = glyph_plot;

  exports.make_glyph_test = make_glyph_test;

  exports.make_glyph_plot = make_glyph_plot;

}).call(this);
}, "tools/active_tool_manager": function(exports, require, module) {(function() {
  var ActiveToolManager;

  ActiveToolManager = (function() {
    " This makes sure that only one tool is active at a time ";
    function ActiveToolManager(event_sink) {
      this.event_sink = event_sink;
      this.event_sink.active = null;
    }

    ActiveToolManager.prototype.bind_bokeh_events = function() {
      var _this = this;
      this.event_sink.on("clear_active_tool", function() {
        _this.event_sink.trigger("" + _this.event_sink.active + ":deactivated");
        return _this.event_sink.active = null;
      });
      this.event_sink.on("active_tool", function(toolName) {
        console.log("ActiveToolManager active_tool", toolName);
        if (toolName !== _this.event_sink.active) {
          _this.event_sink.trigger("" + toolName + ":activated");
          _this.event_sink.trigger("" + _this.event_sink.active + ":deactivated");
          return _this.event_sink.active = toolName;
        }
      });
      return this.event_sink.on("try_active_tool", function(toolName) {
        if (_this.event_sink.active == null) {
          _this.event_sink.trigger("" + toolName + ":activated");
          _this.event_sink.trigger("" + _this.event_sink.active + ":deactivated");
          return _this.event_sink.active = toolName;
        }
      });
    };

    return ActiveToolManager;

  })();

  exports.ActiveToolManager = ActiveToolManager;

}).call(this);
}, "tools/embed_tool": function(exports, require, module) {(function() {
  var ButtonEventGenerator, EmbedTool, EmbedToolView, EmbedTools, HasParent, base, tool, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator;

  base = require("../base");

  HasParent = base.HasParent;

  EmbedToolView = (function(_super) {
    __extends(EmbedToolView, _super);

    function EmbedToolView() {
      _ref = EmbedToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    EmbedToolView.prototype.initialize = function(options) {
      return EmbedToolView.__super__.initialize.call(this, options);
    };

    EmbedToolView.prototype.eventGeneratorClass = ButtonEventGenerator;

    EmbedToolView.prototype.evgen_options = {
      buttonText: "Embed Html"
    };

    EmbedToolView.prototype.tool_events = {
      activated: "_activated"
    };

    EmbedToolView.prototype._activated = function(e) {
      var baseurl, doc_apikey, doc_id, modal, model_id, script_inject_escaped,
        _this = this;
      console.log("EmbedToolView._activated");
      window.tool_view = this;
      model_id = this.plot_model.get('id');
      doc_id = this.plot_model.get('doc');
      doc_apikey = this.plot_model.get('docapikey');
      baseurl = this.plot_model.get('baseurl');
      script_inject_escaped = this.plot_model.get('script_inject_escaped');
      modal = "<div id=\"embedModal\" class=\"bokeh\">\n  <div  class=\"modal\" role=\"dialog\" aria-labelledby=\"embedLabel\" aria-hidden=\"true\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n      <h3 id=\"dataConfirmLabel\"> HTML Embed code</h3></div><div class=\"modal-body\">\n      <div class=\"modal-body\">\n        " + script_inject_escaped + "\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">Close</button>\n    </div>\n  </div>\n</div>";
      $('body').append(modal);
      $('#embedModal > .modal').on('hidden', function() {
        return $('#embedModal').remove();
      });
      return $('#embedModal > .modal').modal({
        show: true
      });
    };

    return EmbedToolView;

  })(tool.ToolView);

  EmbedTool = (function(_super) {
    __extends(EmbedTool, _super);

    function EmbedTool() {
      _ref1 = EmbedTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    EmbedTool.prototype.type = "EmbedTool";

    EmbedTool.prototype.default_view = EmbedToolView;

    return EmbedTool;

  })(tool.Tool);

  EmbedTool.prototype.defaults = _.clone(EmbedTool.prototype.defaults);

  _.extend(EmbedTool.prototype.defaults);

  EmbedTools = (function(_super) {
    __extends(EmbedTools, _super);

    function EmbedTools() {
      _ref2 = EmbedTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    EmbedTools.prototype.model = EmbedTool;

    return EmbedTools;

  })(Backbone.Collection);

  exports.EmbedToolView = EmbedToolView;

  exports.embedtools = new EmbedTools;

}).call(this);
}, "tools/eventgenerators": function(exports, require, module) {(function() {
  var ButtonEventGenerator, OnePointWheelEventGenerator, TwoPointEventGenerator;

  TwoPointEventGenerator = (function() {
    function TwoPointEventGenerator(options) {
      this.restrict_to_innercanvas = options.restrict_to_innercanvas;
      this.options = options;
      this.toolName = this.options.eventBasename;
      this.dragging = false;
      this.basepoint_set = false;
      this.button_activated = false;
      this.tool_active = false;
    }

    TwoPointEventGenerator.prototype.bind_bokeh_events = function(plotview, eventSink) {
      var toolName,
        _this = this;
      toolName = this.toolName;
      this.plotview = plotview;
      this.eventSink = eventSink;
      this.plotview.moveCallbacks.push(function(e, x, y) {
        var offset;
        if (!_this.dragging) {
          return;
        }
        if (!_this.tool_active) {
          return;
        }
        offset = $(e.currentTarget).offset();
        e.bokehX = e.pageX - offset.left;
        e.bokehY = e.pageY - offset.top;
        if (!_this.basepoint_set) {
          _this.dragging = true;
          _this.basepoint_set = true;
          return eventSink.trigger("" + toolName + ":SetBasepoint", e);
        } else {
          eventSink.trigger("" + toolName + ":UpdatingMouseMove", e);
          e.preventDefault();
          return e.stopPropagation();
        }
      });
      this.plotview.moveCallbacks.push(function(e, x, y) {
        var inner_range_horizontal, inner_range_vertical, offset, xend, xstart, yend, ystart;
        if (_this.dragging) {
          offset = $(e.currentTarget).offset();
          e.bokehX = e.pageX - offset.left;
          e.bokehY = e.pageY - offset.top;
          inner_range_horizontal = _this.plotview.view_state.get('inner_range_horizontal');
          inner_range_vertical = _this.plotview.view_state.get('inner_range_vertical');
          x = _this.plotview.view_state.device_to_sx(e.bokehX);
          y = _this.plotview.view_state.device_to_sy(e.bokehY);
          if (_this.restrict_to_innercanvas) {
            xstart = inner_range_horizontal.get('start');
            xend = inner_range_horizontal.get('end');
            ystart = inner_range_vertical.get('start');
            yend = inner_range_vertical.get('end');
          } else {
            xstart = 0;
            xend = _this.plotview.view_state.get('outer_width');
            ystart = 0;
            yend = _this.plotview.view_state.get('outer_height');
          }
          if (x < xstart || x > xend) {
            console.log("stopping1");
            _this._stop_drag(e);
            return false;
          }
          if (y < ystart || y > yend) {
            console.log("stopping2");
            _this._stop_drag(e);
            return false;
          }
        }
      });
      $(document).bind('keydown', function(e) {
        if (e[_this.options.keyName]) {
          _this._start_drag();
        }
        if (e.keyCode === 27) {
          return eventSink.trigger("clear_active_tool");
        }
      });
      $(document).bind('keyup', function(e) {
        if (!e[_this.options.keyName]) {
          return _this._stop_drag(e);
        }
      });
      this.plotview.canvas_wrapper.bind('mousedown', function(e) {
        if (_this.button_activated) {
          _this._start_drag();
          return false;
        }
      });
      this.plotview.canvas_wrapper.bind('mouseup', function(e) {
        if (_this.button_activated) {
          _this._stop_drag(e);
          return false;
        }
      });
      this.plotview.canvas_wrapper.bind('mouseleave', function(e) {
        if (_this.button_activated) {
          _this._stop_drag(e);
          return false;
        }
      });
      this.$tool_button = $("<button class='btn btn-small'> " + this.options.buttonText + " </button>");
      this.plotview;
      this.plotview.$el.find('.button_bar').append(this.$tool_button);
      this.$tool_button.click(function() {
        if (_this.button_activated) {
          return eventSink.trigger("clear_active_tool");
        } else {
          return eventSink.trigger("active_tool", toolName);
        }
      });
      eventSink.on("" + toolName + ":deactivated", function() {
        _this.tool_active = false;
        _this.button_activated = false;
        return _this.$tool_button.removeClass('active');
      });
      eventSink.on("" + toolName + ":activated", function() {
        _this.tool_active = true;
        _this.$tool_button.addClass('active');
        return _this.button_activated = true;
      });
      return eventSink;
    };

    TwoPointEventGenerator.prototype.hide_button = function() {
      return this.$tool_button.hide();
    };

    TwoPointEventGenerator.prototype._start_drag = function() {
      this.eventSink.trigger("active_tool", this.toolName);
      if (!this.dragging) {
        this.dragging = true;
        if (!this.button_activated) {
          return this.$tool_button.addClass('active');
        }
      }
    };

    TwoPointEventGenerator.prototype._stop_drag = function(e) {
      var offset;
      this.basepoint_set = false;
      if (this.dragging) {
        this.dragging = false;
        if (!this.button_activated) {
          this.$tool_button.removeClass('active');
        }
        offset = $(e.currentTarget).offset();
        e.bokehX = e.pageX;
        e.bokehY = e.pageY;
        return this.eventSink.trigger("" + this.options.eventBasename + ":DragEnd", e);
      }
    };

    return TwoPointEventGenerator;

  })();

  OnePointWheelEventGenerator = (function() {
    function OnePointWheelEventGenerator(options) {
      this.options = options;
      this.toolName = this.options.eventBasename;
      this.dragging = false;
      this.basepoint_set = false;
      this.button_activated = false;
      this.tool_active = false;
    }

    OnePointWheelEventGenerator.prototype.bind_bokeh_events = function(plotview, eventSink) {
      var no_scroll, restore_scroll, toolName,
        _this = this;
      toolName = this.toolName;
      this.plotview = plotview;
      this.eventSink = eventSink;
      this.plotview.canvas_wrapper.bind("mousewheel", function(e, delta, dX, dY) {
        var offset;
        if (!_this.tool_active) {
          return;
        }
        offset = $(e.currentTarget).offset();
        e.bokehX = e.pageX - offset.left;
        e.bokehY = e.pageY - offset.top;
        e.delta = delta;
        eventSink.trigger("" + toolName + ":zoom", e);
        e.preventDefault();
        return e.stopPropagation();
      });
      $(document).bind('keydown', function(e) {
        if (e.keyCode === 27) {
          return eventSink.trigger("clear_active_tool");
        }
      });
      this.plotview.$el.bind("mousein", function(e) {
        return eventSink.trigger("clear_active_tool");
      });
      this.plotview.$el.bind("mouseover", function(e) {
        return _this.mouseover_count += 1;
      });
      this.$tool_button = $("<button class='btn btn-small'> " + this.options.buttonText + " </button>");
      this.plotview.$el.find('.button_bar').append(this.$tool_button);
      this.$tool_button.click(function() {
        if (_this.button_activated) {
          return eventSink.trigger("clear_active_tool");
        } else {
          eventSink.trigger("active_tool", toolName);
          return _this.button_activated = true;
        }
      });
      no_scroll = function(el) {
        el.setAttribute("old_overflow", el.style.overflow);
        el.style.overflow = "hidden";
        if (el === document.body) {

        } else {
          return no_scroll(el.parentNode);
        }
      };
      restore_scroll = function(el) {
        el.style.overflow = el.getAttribute("old_overflow");
        if (el === document.body) {

        } else {
          return restore_scroll(el.parentNode);
        }
      };
      eventSink.on("" + toolName + ":deactivated", function() {
        _this.tool_active = false;
        _this.button_activated = false;
        _this.$tool_button.removeClass('active');
        return document.body.style.overflow = _this.old_overflow;
      });
      eventSink.on("" + toolName + ":activated", function() {
        _this.tool_active = true;
        return _this.$tool_button.addClass('active');
      });
      return eventSink;
    };

    OnePointWheelEventGenerator.prototype.hide_button = function() {
      return this.$tool_button.hide();
    };

    return OnePointWheelEventGenerator;

  })();

  ButtonEventGenerator = (function() {
    function ButtonEventGenerator(options) {
      this.options = options;
      this.toolName = this.options.eventBasename;
      this.button_activated = false;
      this.tool_active = false;
    }

    ButtonEventGenerator.prototype.bind_bokeh_events = function(plotview, eventSink) {
      var no_scroll, restore_scroll, toolName,
        _this = this;
      toolName = this.toolName;
      this.plotview = plotview;
      this.eventSink = eventSink;
      $(document).bind('keydown', function(e) {
        if (e.keyCode === 27) {
          return eventSink.trigger("clear_active_tool");
        }
      });
      this.plotview.$el.bind("mouseover", function(e) {
        return _this.mouseover_count += 1;
      });
      this.$tool_button = $("<button class='btn btn-small'> " + this.options.buttonText + " </button>");
      this.plotview.$el.find('.button_bar').append(this.$tool_button);
      this.$tool_button.click(function() {
        if (_this.button_activated) {
          return eventSink.trigger("clear_active_tool");
        } else {
          eventSink.trigger("active_tool", toolName);
          return _this.button_activated = true;
        }
      });
      no_scroll = function(el) {
        el.setAttribute("old_overflow", el.style.overflow);
        el.style.overflow = "hidden";
        if (el === document.body) {

        } else {
          return no_scroll(el.parentNode);
        }
      };
      restore_scroll = function(el) {
        el.style.overflow = el.getAttribute("old_overflow");
        if (el === document.body) {

        } else {
          return restore_scroll(el.parentNode);
        }
      };
      eventSink.on("" + toolName + ":deactivated", function() {
        _this.tool_active = false;
        _this.button_activated = false;
        _this.$tool_button.removeClass('active');
        return document.body.style.overflow = _this.old_overflow;
      });
      eventSink.on("" + toolName + ":activated", function() {
        _this.tool_active = true;
        return _this.$tool_button.addClass('active');
      });
      return eventSink;
    };

    ButtonEventGenerator.prototype.hide_button = function() {
      return this.$tool_button.hide();
    };

    return ButtonEventGenerator;

  })();

  exports.TwoPointEventGenerator = TwoPointEventGenerator;

  exports.OnePointWheelEventGenerator = OnePointWheelEventGenerator;

  exports.ButtonEventGenerator = ButtonEventGenerator;

}).call(this);
}, "tools/pan_tool": function(exports, require, module) {(function() {
  var LinearMapper, PanTool, PanToolView, PanTools, TwoPointEventGenerator, base, eventgenerators, safebind, tool, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  eventgenerators = require("./eventgenerators");

  TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

  safebind = base.safebind;

  PanToolView = (function(_super) {
    __extends(PanToolView, _super);

    function PanToolView() {
      _ref = PanToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PanToolView.prototype.initialize = function(options) {
      return PanToolView.__super__.initialize.call(this, options);
    };

    PanToolView.prototype.bind_bokeh_events = function() {
      return PanToolView.__super__.bind_bokeh_events.call(this);
    };

    PanToolView.prototype.toolType = "PanTool";

    PanToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

    PanToolView.prototype.evgen_options = {
      keyName: "shiftKey",
      buttonText: "Pan",
      restrict_to_innercanvas: true
    };

    PanToolView.prototype.tool_events = {
      UpdatingMouseMove: "_drag",
      SetBasepoint: "_set_base_point"
    };

    PanToolView.prototype.mouse_coords = function(e, x, y) {
      var x_, y_, _ref1;
      _ref1 = [this.plot_view.view_state.device_to_sx(x), this.plot_view.view_state.device_to_sy(y)], x_ = _ref1[0], y_ = _ref1[1];
      return [x_, y_];
    };

    PanToolView.prototype._set_base_point = function(e) {
      var _ref1;
      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), this.x = _ref1[0], this.y = _ref1[1];
      return null;
    };

    PanToolView.prototype._drag = function(e) {
      var pan_info, sx_high, sx_low, sy_high, sy_low, x, xdiff, xend, xr, xstart, y, ydiff, yend, yr, ystart, _ref1, _ref2;
      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
      xdiff = x - this.x;
      ydiff = y - this.y;
      _ref2 = [x, y], this.x = _ref2[0], this.y = _ref2[1];
      xr = this.plot_view.view_state.get('inner_range_horizontal');
      sx_low = xr.get('start') - xdiff;
      sx_high = xr.get('end') - xdiff;
      yr = this.plot_view.view_state.get('inner_range_vertical');
      sy_low = yr.get('start') - ydiff;
      sy_high = yr.get('end') - ydiff;
      xstart = this.plot_view.xmapper.map_from_target(sx_low);
      xend = this.plot_view.xmapper.map_from_target(sx_high);
      ystart = this.plot_view.ymapper.map_from_target(sy_low);
      yend = this.plot_view.ymapper.map_from_target(sy_high);
      pan_info = {
        xr: {
          start: xstart,
          end: xend
        },
        yr: {
          start: ystart,
          end: yend
        },
        sdx: -xdiff,
        sdy: ydiff
      };
      this.plot_view.update_range(pan_info);
      return null;
    };

    return PanToolView;

  })(tool.ToolView);

  PanTool = (function(_super) {
    __extends(PanTool, _super);

    function PanTool() {
      _ref1 = PanTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PanTool.prototype.type = "PanTool";

    PanTool.prototype.default_view = PanToolView;

    return PanTool;

  })(tool.Tool);

  PanTool.prototype.defaults = _.clone(PanTool.prototype.defaults);

  _.extend(PanTool.prototype.defaults, {
    dimensions: [],
    dataranges: []
  });

  PanTools = (function(_super) {
    __extends(PanTools, _super);

    function PanTools() {
      _ref2 = PanTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    PanTools.prototype.model = PanTool;

    return PanTools;

  })(Backbone.Collection);

  exports.PanToolView = PanToolView;

  exports.pantools = new PanTools;

}).call(this);
}, "tools/preview_save_tool": function(exports, require, module) {(function() {
  var ButtonEventGenerator, PreviewSaveTool, PreviewSaveToolView, PreviewSaveTools, base, tool, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator;

  base = require("../base");

  PreviewSaveToolView = (function(_super) {
    __extends(PreviewSaveToolView, _super);

    function PreviewSaveToolView() {
      _ref = PreviewSaveToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PreviewSaveToolView.prototype.initialize = function(options) {
      return PreviewSaveToolView.__super__.initialize.call(this, options);
    };

    PreviewSaveToolView.prototype.eventGeneratorClass = ButtonEventGenerator;

    PreviewSaveToolView.prototype.evgen_options = {
      buttonText: "Preview/Save"
    };

    PreviewSaveToolView.prototype.tool_events = {
      activated: "_activated"
    };

    PreviewSaveToolView.prototype._activated = function(e) {
      var data_uri, modal,
        _this = this;
      data_uri = this.plot_view.canvas[0].toDataURL();
      this.plot_model.set('png', this.plot_view.canvas[0].toDataURL());
      base.Collections.bulksave([this.plot_model]);
      modal = "<div id='previewModal' class='bokeh'>\n  <div class=\"modal\" role=\"dialog\" aria-labelledby=\"previewLabel\" aria-hidden=\"true\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n      <h3 id=\"dataConfirmLabel\">Image Preview (right click to save)</h3></div><div class=\"modal-body\">\n    <div class=\"modal-body\">\n      <img src=\"" + data_uri + "\" style=\"max-height: 300px; max-width: 400px\">\n    </div>\n    </div><div class=\"modal-footer\">\n      <button class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">Close</button>\n    </div>\n  </div>\n</div>";
      $('body').append(modal);
      $('#previewModal .modal').on('hidden', function() {
        $('#previewModal').remove();
        return $('#previewModal > .modal').remove();
      });
      return $('#previewModal > .modal').modal({
        show: true
      });
    };

    return PreviewSaveToolView;

  })(tool.ToolView);

  PreviewSaveTool = (function(_super) {
    __extends(PreviewSaveTool, _super);

    function PreviewSaveTool() {
      _ref1 = PreviewSaveTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PreviewSaveTool.prototype.type = "PreviewSaveTool";

    PreviewSaveTool.prototype.default_view = PreviewSaveToolView;

    return PreviewSaveTool;

  })(tool.Tool);

  PreviewSaveTool.prototype.defaults = _.clone(PreviewSaveTool.prototype.defaults);

  _.extend(PreviewSaveTool.prototype.defaults);

  PreviewSaveTools = (function(_super) {
    __extends(PreviewSaveTools, _super);

    function PreviewSaveTools() {
      _ref2 = PreviewSaveTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    PreviewSaveTools.prototype.model = PreviewSaveTool;

    return PreviewSaveTools;

  })(Backbone.Collection);

  exports.PreviewSaveToolView = PreviewSaveToolView;

  exports.previewsavetools = new PreviewSaveTools;

}).call(this);
}, "tools/resize_tool": function(exports, require, module) {(function() {
  var LinearMapper, ResizeTool, ResizeToolView, ResizeTools, TwoPointEventGenerator, base, eventgenerators, tool, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  eventgenerators = require("./eventgenerators");

  TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

  ResizeToolView = (function(_super) {
    __extends(ResizeToolView, _super);

    function ResizeToolView() {
      _ref = ResizeToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ResizeToolView.prototype.initialize = function(options) {
      ResizeToolView.__super__.initialize.call(this, options);
      return this.active = false;
    };

    ResizeToolView.prototype.bind_events = function(plotview) {
      return ResizeToolView.__super__.bind_events.call(this, plotview);
    };

    ResizeToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

    ResizeToolView.prototype.evgen_options = {
      keyName: "",
      buttonText: "Resize"
    };

    ResizeToolView.prototype.tool_events = {
      activated: "_activate",
      deactivated: "_deactivate",
      UpdatingMouseMove: "_drag",
      SetBasepoint: "_set_base_point"
    };

    ResizeToolView.prototype.render = function() {
      var ch, ctx, cw, line_width;
      if (!this.active) {
        return;
      }
      ctx = this.plot_view.ctx;
      cw = this.plot_view.view_state.get('canvas_width');
      ch = this.plot_view.view_state.get('canvas_height');
      line_width = 8;
      ctx.save();
      ctx.strokeStyle = 'grey';
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = line_width;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.rect(line_width, line_width, cw - line_width * 2, ch - line_width * 2);
      ctx.moveTo(line_width, line_width);
      ctx.lineTo(cw - line_width, ch - line_width);
      ctx.moveTo(line_width, ch - line_width);
      ctx.lineTo(cw - line_width, line_width);
      ctx.stroke();
      return ctx.restore();
    };

    ResizeToolView.prototype.mouse_coords = function(e, x, y) {
      return [x, y];
    };

    ResizeToolView.prototype._activate = function(e) {
      var bbar, ch, cw;
      this.active = true;
      this.popup = $('<div class="resize_popup pull-right" style="border-radius: 10px; background-color: lightgrey; padding:3px 8px; font-size: 14px"></div>');
      bbar = this.plot_view.$el.find('.button_bar');
      this.popup.appendTo(bbar);
      ch = this.plot_view.view_state.get('outer_height');
      cw = this.plot_view.view_state.get('outer_width');
      this.popup.text("width: " + cw + " height: " + ch);
      this.plot_view.request_render();
      return null;
    };

    ResizeToolView.prototype._deactivate = function(e) {
      this.active = false;
      this.popup.remove();
      this.plot_view.request_render();
      return null;
    };

    ResizeToolView.prototype._set_base_point = function(e) {
      var _ref1;
      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), this.x = _ref1[0], this.y = _ref1[1];
      return null;
    };

    ResizeToolView.prototype._drag = function(e) {
      var ch, cw, x, xdiff, y, ydiff, _ref1, _ref2;
      this.plot_view.pause();
      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
      xdiff = x - this.x;
      ydiff = y - this.y;
      _ref2 = [x, y], this.x = _ref2[0], this.y = _ref2[1];
      ch = this.plot_view.view_state.get('outer_height');
      cw = this.plot_view.view_state.get('outer_width');
      this.popup.text("width: " + cw + " height: " + ch);
      this.plot_view.view_state.set('outer_height', ch + ydiff, {
        'silent': true
      });
      this.plot_view.view_state.set('outer_width', cw + xdiff, {
        'silent': true
      });
      this.plot_view.view_state.set('canvas_height', ch + ydiff, {
        'silent': true
      });
      this.plot_view.view_state.set('canvas_width', cw + xdiff, {
        'silent': true
      });
      this.plot_view.view_state.trigger('change:outer_height', ch + ydiff);
      this.plot_view.view_state.trigger('change:outer_width', cw + xdiff);
      this.plot_view.view_state.trigger('change:canvas_height', ch + ydiff);
      this.plot_view.view_state.trigger('change:canvas_width', cw + xdiff);
      this.plot_view.view_state.trigger('change', this.plot_view.view_state);
      this.plot_view.unpause(true);
      return null;
    };

    return ResizeToolView;

  })(tool.ToolView);

  ResizeTool = (function(_super) {
    __extends(ResizeTool, _super);

    function ResizeTool() {
      _ref1 = ResizeTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ResizeTool.prototype.type = "ResizeTool";

    ResizeTool.prototype.default_view = ResizeToolView;

    return ResizeTool;

  })(tool.Tool);

  ResizeTool.prototype.defaults = _.clone(ResizeTool.prototype.defaults);

  _.extend(ResizeTool.prototype.defaults);

  ResizeTool.prototype.display_defaults = _.clone(ResizeTool.prototype.display_defaults);

  _.extend(ResizeTool.prototype.display_defaults);

  ResizeTools = (function(_super) {
    __extends(ResizeTools, _super);

    function ResizeTools() {
      _ref2 = ResizeTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    ResizeTools.prototype.model = ResizeTool;

    return ResizeTools;

  })(Backbone.Collection);

  exports.ResizeToolView = ResizeToolView;

  exports.resizetools = new ResizeTools;

}).call(this);
}, "tools/select_tool": function(exports, require, module) {(function() {
  var DataRangeBoxSelectionTool, DataRangeBoxSelectionToolView, LinearMapper, SelectionTool, SelectionToolView, SelectionTools, TwoPointEventGenerator, base, coll, eventgenerators, safebind, tool, _ref, _ref1, _ref2, _ref3, _ref4,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  eventgenerators = require("./eventgenerators");

  TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

  safebind = base.safebind;

  SelectionToolView = (function(_super) {
    __extends(SelectionToolView, _super);

    function SelectionToolView() {
      _ref = SelectionToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SelectionToolView.prototype.initialize = function(options) {
      var _this = this;
      SelectionToolView.__super__.initialize.call(this, options);
      this.select_callback = _.debounce((function() {
        return _this._select_data();
      }), 50);
      return this.listenTo(this.model, 'change', this.select_callback);
    };

    SelectionToolView.prototype.bind_bokeh_events = function() {
      var renderer, rendererview, _i, _len, _ref1, _results;
      SelectionToolView.__super__.bind_bokeh_events.call(this);
      _ref1 = this.mget_obj('renderers');
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        renderer = _ref1[_i];
        rendererview = this.plot_view.renderers[renderer.id];
        this.listenTo(rendererview.xrange(), 'change', this.select_callback);
        this.listenTo(rendererview.yrange(), 'change', this.select_callback);
        this.listenTo(renderer, 'change', this.select_callback);
        _results.push(this.listenTo(renderer, 'change', this.select_callback));
      }
      return _results;
    };

    SelectionToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

    SelectionToolView.prototype.evgen_options = {
      keyName: "ctrlKey",
      buttonText: "Select",
      restrict_to_innercanvas: true
    };

    SelectionToolView.prototype.tool_events = {
      SetBasepoint: "_start_selecting",
      UpdatingMouseMove: "_selecting",
      deactivated: "_stop_selecting"
    };

    SelectionToolView.prototype.mouse_coords = function(e, x, y) {
      var _ref1;
      _ref1 = [this.plot_view.view_state.device_to_sx(x), this.plot_view.view_state.device_to_sy(y)], x = _ref1[0], y = _ref1[1];
      return [x, y];
    };

    SelectionToolView.prototype._stop_selecting = function() {
      this.trigger('stopselect');
      return this.basepoint_set = false;
    };

    SelectionToolView.prototype._start_selecting = function(e) {
      var x, y, _ref1;
      this.trigger('startselect');
      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
      this.mset({
        'start_x': x,
        'start_y': y,
        'current_x': null,
        'current_y': null
      });
      return this.basepoint_set = true;
    };

    SelectionToolView.prototype._get_selection_range = function() {
      var xrange, yrange;
      xrange = [this.mget('start_x'), this.mget('current_x')];
      yrange = [this.mget('start_y'), this.mget('current_y')];
      if (this.mget('select_x')) {
        xrange = [_.min(xrange), _.max(xrange)];
      } else {
        xrange = null;
      }
      if (this.mget('select_y')) {
        yrange = [_.min(yrange), _.max(yrange)];
      } else {
        yrange = null;
      }
      return [xrange, yrange];
    };

    SelectionToolView.prototype._get_selection_range_fast = function(current_x, current_y) {
      var xrange, yrange;
      xrange = [this.mget('start_x'), current_x];
      yrange = [this.mget('start_y'), current_y];
      if (this.mget('select_x')) {
        xrange = [_.min(xrange), _.max(xrange)];
      } else {
        xrange = null;
      }
      if (this.mget('select_y')) {
        yrange = [_.min(yrange), _.max(yrange)];
      } else {
        yrange = null;
      }
      return [xrange, yrange];
    };

    SelectionToolView.prototype._selecting = function(e, x_, y_) {
      var x, y, _ref1, _ref2;
      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
      this.mset({
        'current_x': x,
        'current_y': y
      });
      _ref2 = this._get_selection_range(x, y), this.xrange = _ref2[0], this.yrange = _ref2[1];
      this.trigger('boxselect', this.xrange, this.yrange);
      return null;
    };

    SelectionToolView.prototype.box_selecting = function(e, x_, y_) {
      var x, y, _ref1, _ref2;
      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
      _ref2 = this._get_selection_range_fast(x, y), this.xrange = _ref2[0], this.yrange = _ref2[1];
      this.trigger('boxselect', this.xrange, this.yrange);
      return null;
    };

    SelectionToolView.prototype._select_data = function() {
      var datasource, datasource_id, datasource_selections, datasources, ds, k, renderer, selected, v, _i, _j, _len, _len1, _ref1, _ref2;
      if (!this.basepoint_set) {
        return;
      }
      datasources = {};
      datasource_selections = {};
      _ref1 = this.mget_obj('renderers');
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        renderer = _ref1[_i];
        datasource = renderer.get_obj('data_source');
        datasources[datasource.id] = datasource;
      }
      _ref2 = this.mget_obj('renderers');
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        renderer = _ref2[_j];
        datasource_id = renderer.get_obj('data_source').id;
        _.setdefault(datasource_selections, datasource_id, []);
        selected = this.plot_view.renderers[renderer.id].select(this.xrange, this.yrange);
        datasource_selections[datasource_id].push(selected);
      }
      for (k in datasource_selections) {
        if (!__hasProp.call(datasource_selections, k)) continue;
        v = datasource_selections[k];
        selected = _.intersection.apply(_, v);
        ds = datasources[k];
        ds.save({
          selected: selected
        }, {
          patch: true
        });
      }
      return null;
    };

    return SelectionToolView;

  })(tool.ToolView);

  SelectionTool = (function(_super) {
    __extends(SelectionTool, _super);

    function SelectionTool() {
      _ref1 = SelectionTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    SelectionTool.prototype.type = "SelectionTool";

    SelectionTool.prototype.default_view = SelectionToolView;

    return SelectionTool;

  })(tool.Tool);

  SelectionTool.prototype.defaults = _.clone(SelectionTool.prototype.defaults);

  _.extend(SelectionTool.prototype.defaults, {
    renderers: [],
    select_x: true,
    select_y: true,
    data_source_options: {}
  });

  SelectionTools = (function(_super) {
    __extends(SelectionTools, _super);

    function SelectionTools() {
      _ref2 = SelectionTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    SelectionTools.prototype.model = SelectionTool;

    return SelectionTools;

  })(Backbone.Collection);

  exports.SelectionToolView = SelectionToolView;

  exports.selectiontools = new SelectionTools;

  DataRangeBoxSelectionToolView = (function(_super) {
    __extends(DataRangeBoxSelectionToolView, _super);

    function DataRangeBoxSelectionToolView() {
      _ref3 = DataRangeBoxSelectionToolView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    DataRangeBoxSelectionToolView.prototype.bind_bokeh_events = function() {
      return tool.ToolView.prototype.bind_bokeh_events.call(this);
    };

    DataRangeBoxSelectionToolView.prototype._select_data = function() {
      var xend, xstart, yend, ystart, _ref4, _ref5;
      _ref4 = this.plot_view.mapper.map_from_target(this.xrange[0], this.yrange[0]), xstart = _ref4[0], ystart = _ref4[1];
      _ref5 = this.plot_view.mapper.map_from_target(this.xrange[1], this.yrange[1]), xend = _ref5[0], yend = _ref5[1];
      this.mset('xselect', [xstart, xend]);
      this.mset('yselect', [ystart, yend]);
      return this.model.save();
    };

    return DataRangeBoxSelectionToolView;

  })(SelectionToolView);

  DataRangeBoxSelectionTool = (function(_super) {
    __extends(DataRangeBoxSelectionTool, _super);

    function DataRangeBoxSelectionTool() {
      _ref4 = DataRangeBoxSelectionTool.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    DataRangeBoxSelectionTool.prototype.type = "DataRangeBoxSelectionTool";

    DataRangeBoxSelectionTool.prototype.default_view = DataRangeBoxSelectionToolView;

    return DataRangeBoxSelectionTool;

  })(SelectionTool);

  DataRangeBoxSelectionTool.prototype.defaults = _.clone(DataRangeBoxSelectionTool.prototype.defaults);

  coll = Backbone.Collection.extend({
    model: DataRangeBoxSelectionTool
  });

  exports.datarangeboxselectiontools = new coll();

}).call(this);
}, "tools/slider": function(exports, require, module) {(function() {
  var DataSlider, DataSliderView, HasParent, PlotWidget, coll, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PlotWidget = require('../common/plot_widget').PlotWidget;

  HasParent = require("../base").HasParent;

  DataSliderView = (function(_super) {
    __extends(DataSliderView, _super);

    function DataSliderView() {
      _ref = DataSliderView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    DataSliderView.prototype.attributes = {
      "class": "dataslider pull-left"
    };

    DataSliderView.prototype.initialize = function(options) {
      DataSliderView.__super__.initialize.call(this, options);
      this.render_init();
      return this.select = _.throttle(this._select, 50);
    };

    DataSliderView.prototype.delegateEvents = function(events) {
      DataSliderView.__super__.delegateEvents.call(this, events);
      return "pass";
    };

    DataSliderView.prototype.label = function(min, max) {
      this.$(".minlabel").text(min);
      return this.$(".maxlabel").text(max);
    };

    DataSliderView.prototype.render_init = function() {
      var column, max, min, _ref1,
        _this = this;
      this.$el.html("");
      this.$el.append("<div class='maxlabel'></div>");
      this.$el.append("<div class='slider'></div>");
      this.$el.append("<div class='minlabel'></div>");
      this.plot_view.$(".plotarea").append(this.$el);
      column = this.mget_obj('data_source').getcolumn(this.mget('field'));
      _ref1 = [_.min(column), _.max(column)], min = _ref1[0], max = _ref1[1];
      this.$el.find(".slider").slider({
        orientation: "vertical",
        animate: "fast",
        step: (max - min) / 50.0,
        min: min,
        max: max,
        values: [min, max],
        slide: function(event, ui) {
          _this.set_selection_range(event, ui);
          return _this.select(event, ui);
        }
      });
      this.label(min, max);
      return this.$el.find(".slider").height(this.plot_view.view_state.get('inner_height'));
    };

    DataSliderView.prototype.set_selection_range = function(event, ui) {
      var data_source, field, max, min;
      min = _.min(ui.values);
      max = _.max(ui.values);
      this.label(min, max);
      data_source = this.mget_obj('data_source');
      field = this.mget('field');
      if (data_source.range_selections == null) {
        data_source.range_selections = {};
      }
      return data_source.range_selections[field] = [min, max];
    };

    DataSliderView.prototype._select = function() {
      var colname, columns, data_source, i, max, min, numrows, select, selected, val, value, _i, _ref1, _ref2;
      data_source = this.mget_obj('data_source');
      columns = {};
      numrows = 0;
      _ref1 = data_source.range_selections;
      for (colname in _ref1) {
        if (!__hasProp.call(_ref1, colname)) continue;
        value = _ref1[colname];
        columns[colname] = data_source.getcolumn(colname);
        numrows = columns[colname].length;
      }
      selected = [];
      for (i = _i = 0; 0 <= numrows ? _i < numrows : _i > numrows; i = 0 <= numrows ? ++_i : --_i) {
        select = true;
        _ref2 = data_source.range_selections;
        for (colname in _ref2) {
          if (!__hasProp.call(_ref2, colname)) continue;
          value = _ref2[colname];
          min = value[0], max = value[1];
          val = columns[colname][i];
          if (val < min || val > max) {
            select = false;
            break;
          }
        }
        if (select) {
          selected.push(i);
        }
      }
      return data_source.save({
        selected: selected
      }, {
        patch: true
      });
    };

    return DataSliderView;

  })(PlotWidget);

  DataSlider = (function(_super) {
    __extends(DataSlider, _super);

    function DataSlider() {
      _ref1 = DataSlider.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    DataSlider.prototype.type = "DataSlider";

    DataSlider.prototype.default_view = DataSliderView;

    return DataSlider;

  })(HasParent);

  DataSlider.prototype.defaults = _.clone(DataSlider.prototype.defaults);

  _.extend(DataSlider.prototype.defaults, {
    data_source: null,
    field: null
  });

  DataSlider.prototype.display_defaults = _.clone(DataSlider.prototype.display_defaults);

  _.extend(DataSlider.prototype.display_defaults, {
    level: 'tool'
  });

  PlotWidget = require('../common/plot_widget').PlotWidget;

  HasParent = require('../base').HasParent;

  coll = Backbone.Collection.extend({
    model: DataSlider
  });

  exports.datasliders = new coll();

}).call(this);
}, "tools/tool": function(exports, require, module) {(function() {
  var HasParent, PlotWidget, Tool, ToolView, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PlotWidget = require('../common/plot_widget').PlotWidget;

  HasParent = require('../base').HasParent;

  ToolView = (function(_super) {
    __extends(ToolView, _super);

    function ToolView() {
      _ref = ToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ToolView.prototype.initialize = function(options) {
      return ToolView.__super__.initialize.call(this, options);
    };

    ToolView.prototype.bind_bokeh_events = function() {
      var eventSink, evgen, evgen_options, evgen_options2,
        _this = this;
      eventSink = this.plot_view.eventSink;
      evgen_options = {
        eventBasename: this.cid
      };
      evgen_options2 = _.extend(evgen_options, this.evgen_options);
      evgen = new this.eventGeneratorClass(evgen_options2);
      evgen.bind_bokeh_events(this.plot_view, eventSink);
      _.each(this.tool_events, function(handler_f, event_name) {
        var full_event_name, wrap;
        full_event_name = "" + _this.cid + ":" + event_name;
        wrap = function(e) {
          return _this[handler_f](e);
        };
        return eventSink.on(full_event_name, wrap);
      });
      this.evgen = evgen;
      return {
        render: function() {}
      };
    };

    return ToolView;

  })(PlotWidget);

  Tool = (function(_super) {
    __extends(Tool, _super);

    function Tool() {
      _ref1 = Tool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return Tool;

  })(HasParent);

  Tool.prototype.display_defaults = _.clone(Tool.prototype.display_defaults);

  _.extend(Tool.prototype.display_defaults, {
    level: 'tool'
  });

  exports.Tool = Tool;

  exports.ToolView = ToolView;

}).call(this);
}, "tools/zoom_tool": function(exports, require, module) {(function() {
  var LinearMapper, OnePointWheelEventGenerator, ZoomTool, ZoomToolView, ZoomTools, base, eventgenerators, safebind, tool, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  eventgenerators = require("./eventgenerators");

  OnePointWheelEventGenerator = eventgenerators.OnePointWheelEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

  safebind = base.safebind;

  ZoomToolView = (function(_super) {
    __extends(ZoomToolView, _super);

    function ZoomToolView() {
      _ref = ZoomToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ZoomToolView.prototype.initialize = function(options) {
      return ZoomToolView.__super__.initialize.call(this, options);
    };

    ZoomToolView.prototype.eventGeneratorClass = OnePointWheelEventGenerator;

    ZoomToolView.prototype.evgen_options = {
      buttonText: "Zoom"
    };

    ZoomToolView.prototype.tool_events = {
      zoom: "_zoom"
    };

    ZoomToolView.prototype.mouse_coords = function(e, x, y) {
      var x_, y_, _ref1;
      _ref1 = [this.plot_view.view_state.device_to_sx(x), this.plot_view.view_state.device_to_sy(y)], x_ = _ref1[0], y_ = _ref1[1];
      return [x_, y_];
    };

    ZoomToolView.prototype._zoom = function(e) {
      var delta, factor, screenX, screenY, speed, sx_high, sx_low, sy_high, sy_low, x, xend, xr, xstart, y, yend, yr, ystart, zoom_info, _ref1;
      delta = e.delta;
      screenX = e.bokehX;
      screenY = e.bokehY;
      _ref1 = this.mouse_coords(e, screenX, screenY), x = _ref1[0], y = _ref1[1];
      speed = this.mget('speed');
      factor = speed * (delta * 50);
      xr = this.plot_view.view_state.get('inner_range_horizontal');
      sx_low = xr.get('start');
      sx_high = xr.get('end');
      yr = this.plot_view.view_state.get('inner_range_vertical');
      sy_low = yr.get('start');
      sy_high = yr.get('end');
      xstart = this.plot_view.xmapper.map_from_target(sx_low - (sx_low - x) * factor);
      xend = this.plot_view.xmapper.map_from_target(sx_high - (sx_high - x) * factor);
      ystart = this.plot_view.ymapper.map_from_target(sy_low - (sy_low - y) * factor);
      yend = this.plot_view.ymapper.map_from_target(sy_high - (sy_high - y) * factor);
      zoom_info = {
        xr: {
          start: xstart,
          end: xend
        },
        yr: {
          start: ystart,
          end: yend
        },
        factor: factor
      };
      this.plot_view.update_range(zoom_info);
      return null;
    };

    return ZoomToolView;

  })(tool.ToolView);

  ZoomTool = (function(_super) {
    __extends(ZoomTool, _super);

    function ZoomTool() {
      _ref1 = ZoomTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ZoomTool.prototype.type = "ZoomTool";

    ZoomTool.prototype.default_view = ZoomToolView;

    return ZoomTool;

  })(tool.Tool);

  ZoomTool.prototype.defaults = _.clone(ZoomTool.prototype.defaults);

  _.extend(ZoomTool.prototype.defaults, {
    dimensions: [],
    dataranges: [],
    speed: 1 / 600
  });

  ZoomTools = (function(_super) {
    __extends(ZoomTools, _super);

    function ZoomTools() {
      _ref2 = ZoomTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    ZoomTools.prototype.model = ZoomTool;

    return ZoomTools;

  })(Backbone.Collection);

  exports.ZoomToolView = ZoomToolView;

  exports.zoomtools = new ZoomTools;

}).call(this);
}
});

