(function(global) {

  function load_lib(url, callback){
    var s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onreadystatechange = s.onload = callback;
    s.onerror = function(){
      console.warn("failed to load library " + url);
    };
    document.getElementsByTagName("head")[0].appendChild(s);
  }

  bokehjs_url = ""

  var all_models = {{ all_models|default('{}') }};
  var elementid = "{{ elementid }}";
  var plotid = "{{ plotid }}";

  var data= { "{{ plotid }}": all_models };

  if(typeof(Bokeh) !== "undefined" && Bokeh._is_loaded) {
    // BokehJS is loaded
    console.log("BokehJS loaded, going straight to plotting");
    Bokeh.embed_core.search_and_plot(data);
  }

  } else {
    // BokehJS needs to be loaded loaded
    console.log("BokehJS not loaded, scheduling load and callback at", new Date());
    load_lib(bokehjs_url, function() {
      console.log("BokehJS load callback run at", new Date())
      Bokeh.embed_core.injectCss(static_root_url);
      // Monkey patch HasProperties sync function
      Bokeh.HasProperties.prototype.sync = Backbone.sync
      Bokeh.embed_core.search_and_plot(data)
    });
  }

}(this));
