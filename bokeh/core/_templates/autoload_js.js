{#
Renders JavaScript code for "autoloading".

The code automatically and asynchronously loads BokehJS (if necessary) and
then replaces the AUTOLOAD_TAG ``<script>`` tag that
calls it with the rendered model.

:param elementid: the unique id for the script tag
:type elementid: str

:param js_urls: URLs of JS files making up Bokeh library
:type js_urls: list

:param css_urls: CSS urls to inject
:type css_urls: list

#}
(function(global) {
  function now() {
    return new Date();
  }

  var force = {{ force|default(False)|json }};

  if (typeof (window._bokeh_onload_callbacks) === "undefined" || force === true) {
    window._bokeh_onload_callbacks = [];
    window._bokeh_is_loading = undefined;
  }


  {% block autoload_init %}
  {% endblock %}

  function run_callbacks() {
    window._bokeh_onload_callbacks.forEach(function(callback) { callback() });
    delete window._bokeh_onload_callbacks
    console.info("Bokeh: all callbacks have finished");
  }

  function load_libs(js_urls, callback) {
    window._bokeh_onload_callbacks.push(callback);
    if (window._bokeh_is_loading > 0) {
      console.log("Bokeh: BokehJS is being loaded, scheduling callback at", now());
      return null;
    }
    if (js_urls == null || js_urls.length === 0) {
      run_callbacks();
      return null;
    }
    console.log("Bokeh: BokehJS not loaded, scheduling load and callback at", now());
    window._bokeh_is_loading = js_urls.length;
    for (var i = 0; i < js_urls.length; i++) {
      var url = js_urls[i];
      var s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.onreadystatechange = s.onload = function() {
        window._bokeh_is_loading--;
        if (window._bokeh_is_loading === 0) {
          console.log("Bokeh: all BokehJS libraries loaded");
          run_callbacks()
        }
      };
      s.onerror = function() {
        console.warn("failed to load library " + url);
      };
      console.log("Bokeh: injecting script tag for BokehJS library: ", url);
      document.getElementsByTagName("head")[0].appendChild(s);
    }
  };

  {%- if elementid -%}
  var element = document.getElementById({{ elementid|json }});
  if (element == null) {
    console.log("Bokeh: ERROR: autoload.js configured with elementid '{{ elementid }}' but no matching script tag was found. ")
    return false;
  }
  {%- endif %}

  var js_urls = {{ js_urls|json }};

  var inline_js = [
    {%- for js in js_raw %}
    function(Bokeh) {
      {{ js|indent(6) }}
    },
    {% endfor -%}
    function(Bokeh) {
      {%- for url in css_urls %}
      console.log("Bokeh: injecting CSS: {{ url }}");
      Bokeh.embed.inject_css({{ url|json }});
      {%- endfor %}
      {%- for css in css_raw %}
      console.log("Bokeh: injecting raw CSS");
      Bokeh.embed.inject_raw_css({{ css }});
      {%- endfor %}
    }
  ];

  function run_inline_js() {
    {% block run_inline_js %}
    for (var i = 0; i < inline_js.length; i++) {
      inline_js[i](window.Bokeh);
    }
    {% endblock %}
  }

  if (window._bokeh_is_loading === 0) {
    console.log("Bokeh: BokehJS loaded, going straight to plotting");
    run_inline_js();
  } else {
    load_libs(js_urls, function() {
      console.log("Bokeh: BokehJS plotting callback run at", now());
      run_inline_js();
    });
  }
}(this));
