{% extends "autoload_js.js" %}

{% block init_window %}
    window._bokeh_onload_callbacks = [];
    window._bokeh_is_loading = undefined;
    window._bokeh_init_load = Date.now() + {{ timeout|default(0) }};
    window._bokeh_failed_load = false;
{% endblock %}

{% block run_inline_js %}
    if (window.Bokeh !== undefined || force === "1") {
      for (var i = 0; i < inline_js.length; i++) {
        inline_js[i](window.Bokeh);
      }
    } else if (Date.now() < (window._bokeh_init_load)) {
      setTimeout(run_inline_js, 100);
    } else if (!window._bokeh_failed_load) {
      console.log("Bokeh: BokehJS failed to load within specified timeout.");
      window._bokeh_failed_load = true;
    }
{% endblock %}
