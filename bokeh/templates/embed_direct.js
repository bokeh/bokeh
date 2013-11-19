console.log("embed.js");
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
(function(global) {

    var parseUri = function (str) {
	var	o   = parseUri.options,
	m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
	uri = {},
	i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
	    if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
    };

    parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
	    name:   "queryKey",
	    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
	    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
	    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
    };
    var host = "{{host}}";

    var staticRootUrl = "{{static_root_url}}";
    if (host!=""){

        staticRootUrl = host + "/static/";
        var bokehJSUrl = window.location.protocol + "//" + staticRootUrl + "js/bokeh.js";
    }
    else {
        bokehJSUrl = staticRootUrl +"js/bokeh.js";
    }

    var all_models = {{ all_models|default('{}') }};
    var modeltype = "{{ modeltype }}";
    var elementid = "{{ elementid }}";
    var plotID = "{{ plotid }}";
    var dd = {};
    dd[plotID] = all_models;
    

    function addEvent(el, eventName, func){
        if(el.attachEvent){
            return el.attachEvent('on' + eventName, func);}
        else {
            el.addEventListener(eventName, func, false);}}
    var script_injected = !(typeof(_embed_bokeh_inject_application) == "undefined") && _embed_bokeh_inject_application;
    if(typeof Bokeh == "object"){
        // application.js is already loaded
        console.log("bokeh.js is already loaded, going straight to plotting");
        setTimeout(function () {
            embed_core = Bokeh.embed_core;
            embed_core.search_and_plot(dd);}, 10);}

    else if(!script_injected){
        // application.js isn't loaded and it hasn't been scheduled to be injected
        var s = document.createElement('script');
        s.async = true; s.src = bokehJSUrl;

        _embed_bokeh_inject_application = true;
        addEvent(
            s,'load', 
            function() {
                setTimeout(
                function() {
                console.log("Bokeh.js loaded callback");
                embed_core = Bokeh.embed_core;
                console.log("embed_core loaded");
                embed_core.search_and_plot(dd);
                embed_core.injectCss(host);
                console.log("search_and_plot called");}, 30);});
        document.body.appendChild(s);}

    window._embed_bokeh = true;}(this));
