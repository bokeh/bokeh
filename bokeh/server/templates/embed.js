console.log("embed.js");

(function(global) {
    var host = "{{host}}";
    var bokehUrl = 'http://' + host +'/static/js/bokeh.js';
    function addEvent(el, eventName, func){
        if(el.attachEvent){
            return el.attachEvent('on' + eventName, func);}
        else {
            el.addEventListener(eventName, func, false);}}

    var script_injected = !(typeof(_embed_bokeh_inject_application) == "undefined") && _embed_bokeh_inject_application;
    if(typeof Bokeh == "object"){
        // application.js is already loaded
        console.log("bokeh.js is already loaded, going straight to plotting");

        embed_core = Bokeh.embed_core;
        embed_core.search_and_plot();
    }

    else if(!script_injected){
        // application.js isn't loaded and it hasn't been scheduled to be injected
        var s = document.createElement('script');
        s.async = true; s.src = bokehUrl;

        _embed_bokeh_inject_application = true;
        addEvent(
            s,'load', 
            function() {
                console.log("Bokeh.js loaded callback");
                embed_core = Bokeh.embed_core;
                console.log("embed_core loaded");
                embed_core.search_and_plot();
                embed_core.injectCss(host);
                console.log("search_and_plot called");
            });
        document.body.appendChild(s);        
        }
    window._embed_bokeh = true;
}(this));

