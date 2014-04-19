
console.log("embed.js");

(function(global) {

    if(typeof(window.bokeh_embed_count) == "undefined"){
        window.bokeh_embed_count = 0;
    }
    else {
        window.bokeh_embed_count += 1;
    }
    if(window.bokeh_embed_count == 1) {
//        debugger;
    }

    var host = "{{host}}";

    var static_root_url = "{{static_root_url}}";

    if (host!="") {
        static_root_url = "//" + host + "/bokehjs/static/";
        var bokehJSUrl = static_root_url + "js/bokeh.js";
    }
    else {
        bokehJSUrl = static_root_url +"js/bokeh.js";
    }

    var all_models = {{ all_models|default('{}') }};
    var modeltype = "{{ modeltype }}";
    var elementid = "{{ elementid }}";
    var plotID = "{{ plotid }}";
    var dd = {};
    dd[plotID] = all_models;

    var second_plot = function() {
        console.log("Bokeh.js loaded callback");
        console.log("embed_core loaded");
        Bokeh.embed_core.injectCss(static_root_url);
        Bokeh.HasProperties.prototype.sync = Backbone.sync
        Bokeh.embed_core.search_and_plot(dd);
        console.log("search_and_plot called", new Date());
    }

    function add_event(el, eventName, func){
        if(el.attachEvent){
            return el.attachEvent('on' + eventName, func);
        }
        else {
            el.add_eventListener(eventName, func, false);
        }
    }

    var script_injected = !(typeof(_embed_bokeh_inject_application) == "undefined") && _embed_bokeh_inject_application;

    if(typeof Bokeh == "object"){
        console.log("bokeh.js is already loaded, going straight to plotting");
        setTimeout(function () {
            console.log("calling embed_core.search_and_plot")
            Bokeh.embed_core.search_and_plot(dd);
        }, 20);
    }

    else if(!script_injected) {
        console.log("schedule bokeh.js for injection");
        var s = document.createElement('script');
        s.async = true;
        s.src = bokehJSUrl;
        s.id = "bokeh_script_tag";
    }
    else {
        var s = document.getElementById("bokeh_script_tag");
    }

    var local_bokeh_embed_count = window.bokeh_embed_count;

    if(typeof(s) != "undefined") {
        add_event(s,'load', function() {
            setTimeout(second_plot, 20 * local_bokeh_embed_count);
        });
    }

    if(!script_injected){
        document.body.appendChild(s);
    }

    _embed_bokeh_inject_application = true;

    window._embed_bokeh = true;

}(this));
