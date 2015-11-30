{#
Renders JavaScript code for "autoloading".

The code automatically and asynchronously loads BokehJS (if necessary) and
then replaces the AUTOLOAD_TAG ``<script>`` tag that
calls it with the rendered model.

:param elementid: the unique id for the script tag
:type elementid: str

:param websocket_url: path to use to open websocket, or null if we are not using a server
:type websocket_url: str

:param docs_json: embedded JSON serialization of documents
:type docs_json: dict

:param js_urls: URLs of JS files making up Bokeh library
:type js_urls: list

:param css_files: CSS files to inject
:type css_files: list


#}
(function(global) {
  if (typeof (window._bokeh_onload_callbacks) === "undefined"){
    window._bokeh_onload_callbacks = [];
  }
  function load_libs(js_urls, callback) {
    window._bokeh_onload_callbacks.push(callback);
    if (window._bokeh_is_loading > 0) {
      console.log("Bokeh: BokehJS is being loaded, scheduling callback at", new Date());
      return null;
    }
    console.log("Bokeh: BokehJS not loaded, scheduling load and callback at", new Date());
    window._bokeh_is_loading = js_urls.length;
    for (i = 0; i < js_urls.length; i++) {
      var url = js_urls[i];
      var s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.onreadystatechange = s.onload = function() {
        window._bokeh_is_loading--;
        if (window._bokeh_is_loading === 0) {
          console.log("Bokeh: all BokehJS libraries loaded");
          {%- for file in css_files %}
          console.log("Bokeh: injecting CSS: {{ file }}");
          Bokeh.embed.inject_css("{{ file }}");
          {%- endfor %}
          window._bokeh_onload_callbacks.forEach(function(callback){callback()});
          delete window._bokeh_onload_callbacks
        }
      };
      s.onerror = function() {
        console.warn("failed to load library " + url);
      };
      console.log("Bokeh: injecting script tag for BokehJS library: ", url);
      document.getElementsByTagName("head")[0].appendChild(s);
    }
  };

  var elt = document.getElementById("{{ elementid }}");
  if(elt==null) {
    console.log("Bokeh: ERROR: autoload.js configured with elementid '{{ elementid }}' but no matching script tag was found. ")
    return false;
  }

  {% if websocket_url -%}
  var websocket_url = "{{ websocket_url }}";
  {%- else %}
  var websocket_url = null;
  {%- endif %}

  // Docs will be set for the static case
  {%- if docs_json %}
  var docs_json = {{ docs_json }};
  {%- else %}
  var docs_json = {};
  {%- endif %}

  var render_items = [{ 'elementid' : "{{ elementid }}" }];

  if (typeof(window._bokeh_is_loading) !== undefined && window._bokeh_is_loading == 0) {
    console.log("Bokeh: BokehJS loaded, going straight to plotting");
    Bokeh.embed.embed_items(docs_json, render_items, websocket_url);
  } else {
    load_libs({{ js_urls }}, function() {
      console.log("Bokeh: BokehJS plotting callback run at", new Date());
      Bokeh.embed.embed_items(docs_json, render_items, websocket_url);
    });
  }

}(this));
