(function(global) {

    //var silpUrl = '//s3-eu-west-1.amazonaws.com/silp.shootitlive.com/js/silp.min.js';
    //var silpUrl = 'https://localhost:5000/static/js/embed.js';
    //var bokehUrl = 'http://localhost:5000/static/js/embed2.js';
    var host = "{{host}}";
    var bokehUrl = 'http://' + host +'/bokeh/static/js/application.js';
    var cssUrls = [
        'http://' + host + '/bokeh/static/vendor/bokehjs/css/bokeh.css',
        'http://' + host + '/bokeh/static/vendor/bokehjs/css/continuum.css',
        'http://' + host + '/bokeh/static/vendor/bokehjs/vendor/bootstrap/css/bootstrap.css',
    ];
    // Globals
    if(!global.Bokeh) { global.Bokeh = {}; };
    var Bokeh = global.Bokeh;

    // To keep track of which embeds we have already processed
    if(!Bokeh.foundEls) Bokeh.foundEls = [];
    var foundEls = Bokeh.foundEls;

    // This is read by silp.min.js and a player is created for each one
    if(!Bokeh.settings) {
        Bokeh.settings = [];
        var settings = Bokeh.settings;

        var findInjections = function() {
            var els = document.getElementsByTagName('script');
            window.els2= els;
            var re = /.*embed.js.*/;

            for(var i = 0; i < els.length; i++) {
                var el = els[i];
                if(el.src.match(re) && foundEls.indexOf(el) < 0) {
                    foundEls.push(el);
                    //var info = utils.parseQueryString(el.src),
                    var info = parseEl(el);
                    // Create container div
                    var d = document.createElement('div');
                    var container = document.createElement('div');

                    el.parentNode.insertBefore(container, el);
                    info['element'] = container;

                    settings.push(info);
                }
            };
        };
        var callFuncs = function() {
            var base = require('./base');
            for(var i=0; i < settings.length; i++){
                var conf = settings[i];
                if(conf.bokeh_plottype == 'embeddata'){
                    window.addPlotWrap(conf);}
                else {
                    window.addDirectPlotWrap(conf);}
            }
        };
         
        var addOnload = function(func){
            if (window.attachEvent){
                window.attachEvent('onload', func);}
            else {
                window.addEventListener('load', func, false);}
        };
        addOnload(findInjections);
        addOnload(callFuncs);
        // Load main javascript
        var s = document.createElement('script');
        s.async = true; s.src = bokehUrl;
        document.body.appendChild(s);

        var loadCss = function(url){
            var link = document.createElement('link');
            link.href = url; link.rel="stylesheet";
            link.type = "text/css";
            document.body.appendChild(link);
        };
        for(var i=0; i <cssUrls.length; i++){
            loadCss(cssUrls[i]);
        };

    };
    var parseEl = function(el){
        var attrs = el.attributes;
        var bokehRe = /bokeh.*/
        var info = {};
        var bokehCount = 0;
        window.attrs = attrs;
        for(var i=0; i < attrs.length; i++){
            var attr = attrs[i];
            if(attrs[i].name.match(bokehRe)){
                info[attrs[i].name] = attrs[i].value;
                bokehCount++;
            }
        }
        if(bokehCount > 0){
            return info;}
        else {
            return false;
        }
    }

 
}(this));

