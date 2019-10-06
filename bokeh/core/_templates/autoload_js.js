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
(function(root) {
  function now() {
    return new Date();
  }

  var force = {{ force|default(False)|json }};

  if (typeof root._bokeh_onload_callbacks === "undefined" || force === true) {
    root._bokeh_onload_callbacks = [];
    root._bokeh_is_loading = undefined;
  }

  {% block register_mimetype %}
  {% endblock %}

  {% block autoload_init %}
  {% endblock %}

  function run_callbacks() {
    try {
      root._bokeh_onload_callbacks.forEach(function(callback) {
        if (callback != null)
          callback();
      });
    } finally {
      delete root._bokeh_onload_callbacks
    }
    console.debug("Bokeh: all callbacks have finished");
  }

  function load_libs(css_urls, js_urls, callback) {
    if (css_urls == null) css_urls = [];
    if (js_urls == null) js_urls = [];

    root._bokeh_onload_callbacks.push(callback);
    if (root._bokeh_is_loading > 0) {
      console.debug("Bokeh: BokehJS is being loaded, scheduling callback at", now());
      return null;
    }
    if (js_urls == null || js_urls.length === 0) {
      run_callbacks();
      return null;
    }
    console.debug("Bokeh: BokehJS not loaded, scheduling load and callback at", now());
    root._bokeh_is_loading = css_urls.length + js_urls.length;

    function on_load() {
      root._bokeh_is_loading--;
      if (root._bokeh_is_loading === 0) {
        console.debug("Bokeh: all BokehJS libraries/stylesheets loaded");
        run_callbacks()
      }
    }

    function on_error() {
      console.error("failed to load " + url);
    }

    for (var i = 0; i < css_urls.length; i++) {
      var url = css_urls[i];
      const element = document.createElement("link");
      element.onload = on_load;
      element.onerror = on_error;
      element.rel = "stylesheet";
      element.type = "text/css";
      element.href = url;
      console.debug("Bokeh: injecting link tag for BokehJS stylesheet: ", url);
      document.body.appendChild(element);
    }

    for (var i = 0; i < js_urls.length; i++) {
      var url = js_urls[i];
      var element = document.createElement('script');
      element.onload = on_load;
      element.onerror = on_error;
      element.async = false;
      element.src = url;
      console.debug("Bokeh: injecting script tag for BokehJS library: ", url);
      document.head.appendChild(element);
    }
  };

  {%- if elementid -%}
  var element = document.getElementById({{ elementid|json }});
  if (element == null) {
    console.error("Bokeh: ERROR: autoload.js configured with elementid '{{ elementid }}' but no matching script tag was found. ")
    return false;
  }
  {%- endif %}

  function inject_raw_css(css) {
    const element = document.createElement("style");
    element.appendChild(document.createTextNode(css));
    document.body.appendChild(element);
  }

  {% if bundle %}
  var js_urls = {{ bundle.js_urls|json }};
  var css_urls = {{ bundle.css_urls|json }};
  {% else %}
  var js_urls = {{ js_urls|json }};
  var css_urls = {{ css_urls|json }};
  {% endif %}

  var inline_js = [
    {%- for css in (bundle.css_raw if bundle else css_raw) %}
    function(Bokeh) {
      inject_raw_css({{ css|json }});
    },
    {%- endfor %}
    {%- for js in (bundle.js_raw if bundle else js_raw) %}
    function(Bokeh) {
      {{ js|indent(6) }}
    },
    {% endfor -%}
    function(Bokeh) {
    {% block inline_js %}
    {% endblock %}
    }
  ];

  function run_inline_js() {
    {% block run_inline_js %}
    for (var i = 0; i < inline_js.length; i++) {
      inline_js[i].call(root, root.Bokeh);
    }
    {% endblock %}
  }

  if (root._bokeh_is_loading === 0) {
    console.debug("Bokeh: BokehJS loaded, going straight to plotting");
    run_inline_js();
  } else {
    load_libs(css_urls, js_urls, function() {
      console.debug("Bokeh: BokehJS plotting callback run at", now());
      run_inline_js();
    });
  }
}(window));
