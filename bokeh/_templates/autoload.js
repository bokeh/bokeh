(function(global) {
  if (typeof (window._bokeh_onload_callbacks) === "undefined"){
    window._bokeh_onload_callbacks = [];
  }
  function load_lib(url, callback){
    window._bokeh_onload_callbacks.push(callback);
    if (window._bokeh_is_loading){
      console.log("Bokeh: BokehJS is being loaded, scheduling callback at", new Date());
      return null;
    }
    console.log("Bokeh: BokehJS not loaded, scheduling load and callback at", new Date());
    window._bokeh_is_loading = true;
    var s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onreadystatechange = s.onload = function(){
      {%- for file in css_files %}
      Bokeh.embed.inject_css("{{ file }}");
      {%- endfor %}
      window._bokeh_onload_callbacks.forEach(function(callback){callback()});
    };
    s.onerror = function(){
      console.warn("failed to load library " + url);
    };
    document.getElementsByTagName("head")[0].appendChild(s);
  }

  bokehjs_url = "{{ js_url }}"

  var elt = document.getElementById("{{ elementid }}");
  if(elt==null) {
    console.log("Bokeh: ERROR: autoload.js configured with elementid '{{ elementid }}' but no matching script tag was found. ")
    return false;
  }

  // These will be set for the static case
  {%- if all_models %}
  var all_models = {{ all_models }};
  {%- else %}
  var all_models = null;
  {%- endif %}

  if(typeof(Bokeh) !== "undefined") {
    console.log("Bokeh: BokehJS loaded, going straight to plotting");
    Bokeh.embed.inject_plot("{{ elementid }}", all_models);
  } else {
    load_lib(bokehjs_url, function() {
      console.log("Bokeh: BokehJS plotting callback run at", new Date())
      Bokeh.embed.inject_plot("{{ elementid }}", all_models);
    });
  }

}(this));
