{#
Bootstraps the Bokeh library by defining a function ``bokeh_load()``.

``bokeh_load()`` accepts a callback parameter, loads Bokeh, and then
runs the callback. When the callback runs, ``window.Bokeh`` will
be defined.

:param js_urls: URLs of JS files making up Bokeh library
:type js_urls: list

:param css_files: CSS files to inject
:type css_files: list

#}
(function(global) {
  if (typeof (window._bokeh_onload_callbacks) === "undefined"){
    window._bokeh_onload_callbacks = [];
  }
  if (typeof(window.bokeh_load) === 'undefined') {
    window.bokeh_load = function(callback) {
      {% if js_urls -%}
      var js_urls = {{ js_urls }};
      {%- else %}
      var js_urls = [];
      {%- endif %}
      // in the INLINE case, js_urls has zero length
      if (js_urls.length === 0 ||
          (typeof(window._bokeh_is_loading) !== undefined && window._bokeh_is_loading == 0)) {
        console.log("Bokeh: BokehJS has already been loaded, scheduling callback for next tick.");
        // we setTimeout rather than callback() due to
        // http://blog.ometer.com/2011/07/24/callbacks-synchronous-and-asynchronous/
        setTimeout(callback);
        return;
      }
      window._bokeh_onload_callbacks.push(callback);
      if (window._bokeh_is_loading > 0) {
        console.log("Bokeh: BokehJS is being loaded, scheduled callback for post-load");
        return null;
      }
      console.log("Bokeh: BokehJS not loaded, scheduling load and callback");
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
  }
}(this));
