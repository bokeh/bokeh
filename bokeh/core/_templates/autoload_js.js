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
  var force = {{ force|default(False)|json }};

  {%- if elementid %}
  var element = document.getElementById({{ elementid|json }});
  if (element == null) {
    //console.error("Bokeh: ERROR: autoload.js configured with elementid '{{ elementid }}' but no matching script tag was found.");
    return false;
  }
  {% endif -%}

  if (typeof root._bokeh_onload_callbacks === "undefined" || force === true) {
    root._bokeh_onload_callbacks = [];
    root._bokeh_is_loading = undefined;
  }

  {% block register_mimetype %}
  {% endblock %}

  {% block autoload_init %}
  {% endblock %}

  function now() {
    return new Date();
  }

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

  const inline_assets = [
    {%- for asset in bundle.assets %}
      {%- if asset.is_inline %}
        {{ asset.to_js() }}
      {% end -%},
    {% end -%},
  ];

  const remote_assets = [
    {%- for asset in bundle.assets %}
      {%- if not asset.is_inline %}
        {{ asset.to_js() }}
      {% end -%},
    {% end -%},
  ];

  function load_assets(assets) {
    for (var i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (asset != null)
        asset.call(root);
    }
  }

  function load_inline_assets() {
    {%- block run_inline_js %}
    load_assets(inline_assets);
    {% endblock -%}
  }

  function load_remote_assets(callback) {
    root._bokeh_onload_callbacks.push(callback);

    if (root._bokeh_is_loading > 0) {
      console.debug("Bokeh: BokehJS is being loaded, scheduling callback at", now());
    } else if (remote_assets.length == 0) {
      run_callbacks();
    } else {
      console.debug("Bokeh: BokehJS not loaded, scheduling load and callback at", now());
      root._bokeh_is_loading = remote_assets.length;
      load_assets(remote_assets);
    }
  }

  if (root._bokeh_is_loading === 0) {
    console.debug("Bokeh: BokehJS loaded, going straight to plotting");
    load_inline_assets();
  } else {
    load_remote_assets(function() {
      console.debug("Bokeh: BokehJS plotting callback run at", now());
      load_inline_assets();
    });
  }
}(window));
