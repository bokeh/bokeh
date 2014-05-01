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

  bokehjs_url = "{{ js_url }}"

  var elt = document.getElementById("{{ elementid }}");
  if(elt==null) {
    console.log("ERROR: Bokeh autoload.js configured with elementid '{{ elementid }}' but no matching script tag was found. ")
    return false;
  }
  info = elt.data();

  // These will be set for the static case
  {%- if modelid %}
  var all_models = {{ all_models }};
  info["{{ modelid }}"] = all_models;
  {%- endif %}

  if(typeof(Bokeh) !== "undefined") {
    console.log("BokehJS loaded, going straight to plotting");
    Bokeh.embed.inject_plot("{{ elementid }}", info);
  } else {
    console.log("BokehJS not loaded, scheduling load and callback at", new Date());
    load_lib(bokehjs_url, function() {
      console.log("BokehJS load callback run at ", new Date(), ", going to plotting")
      // Monkey patch HasProperties sync function
      Bokeh.HasProperties.prototype.sync = Backbone.sync
      {%- for file in css_files %}
      Bokeh.embed.inject_css("{{ file }}");
      {%- endfor %}
      Bokeh.embed.inject_plot("{{ elementid }}", info)
    });
  }

}(this));
