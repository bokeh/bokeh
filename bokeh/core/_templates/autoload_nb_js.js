{% extends "autoload_js.js" %}

{% block autoload_init %}
  if (typeof (window._bokeh_timeout) === "undefined" || force === true) {
    window._bokeh_timeout = Date.now() + {{ timeout|default(0)|json }};
    window._bokeh_failed_load = false;
  }

  var NB_LOAD_WARNING = {'data': {'text/html':
     "<div style='background-color: #fdd'>\n"+
     "<p>\n"+
     "BokehJS does not appear to have successfully loaded. If loading BokehJS from CDN, this \n"+
     "may be due to a slow or bad network connection. Possible fixes:\n"+
     "</p>\n"+
     "<ul>\n"+
     "<li>re-rerun `output_notebook()` to attempt to load from CDN again, or</li>\n"+
     "<li>use INLINE resources instead, as so:</li>\n"+
     "</ul>\n"+
     "<code>\n"+
     "from bokeh.resources import INLINE\n"+
     "output_notebook(resources=INLINE)\n"+
     "</code>\n"+
     "</div>"}};

  function display_loaded() {
    if (window.Bokeh !== undefined) {
      document.getElementById({{ elementid|json }}).textContent = "BokehJS successfully loaded.";
    } else if (Date.now() < window._bokeh_timeout) {
      setTimeout(display_loaded, 100)
    }
  }

  {%- if comms_target -%}
  if ((window.Jupyter !== undefined) && Jupyter.notebook.kernel) {
    comm_manager = Jupyter.notebook.kernel.comm_manager
    comm_manager.register_target({{ comms_target|json }}, function () {});
  }
  {%- endif -%}
{% endblock %}

{% block run_inline_js %}
    if ((window.Bokeh !== undefined) || (force === true)) {
      for (var i = 0; i < inline_js.length; i++) {
        inline_js[i](window.Bokeh);
      }
      {%- if elementid -%}
      if (force === true) {
        display_loaded();
      }
      {%- endif -%}
    } else if (Date.now() < window._bokeh_timeout) {
      setTimeout(run_inline_js, 100);
    } else if (!window._bokeh_failed_load) {
      console.log("Bokeh: BokehJS failed to load within specified timeout.");
      window._bokeh_failed_load = true;
    } else if (force !== true) {
      var cell = $(document.getElementById({{ elementid|json }})).parents('.cell').data().cell;
      cell.output_area.append_execute_result(NB_LOAD_WARNING)
    }
{% endblock %}
