console.log("embed.js");

(function(global) {
    if(window._embed_bokeh == true){
        // embed.js has alread run, there is no need to run this script again?
        // or is there.  
        return;
    };


    var host = "{{host}}";
    var bokehUrl = 'http://' + host +'/bokeh/static/js/application.js';


    var all_models = {{ all_models }};
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
    if(typeof rrequire == "function"){
        // application.js is already loaded
        console.log("application.js is already loaded, going straight to plotting");
        embed_core = rrequire("./embed_core");
        embed_core.search_and_plot(dd);
    }

    else if(!script_injected){
        // application.js isn't loaded and it hasn't been scheduled to be injected
        var s = document.createElement('script');
        s.async = true; s.src = bokehUrl;

        _embed_bokeh_inject_application = true;
        addEvent(
            s,'load', 
            function() {
                console.log("application.js loaded callback");
                embed_core = rrequire("./embed_core");
                console.log("embed_core loaded")
                embed_core.search_and_plot(dd);
                embed_core.injectCss(host);
                console.log("search_and_plot called");
            });
        document.body.appendChild(s);        
        }
    window._embed_bokeh = true;
}(this));

