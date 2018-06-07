{% extends "autoload_js.js" %}

{% block register_mimetype %}

  {%- if register_mime -%}
  var JS_MIME_TYPE = 'application/javascript';
  var HTML_MIME_TYPE = 'text/html';
  var EXEC_MIME_TYPE = 'application/vnd.bokehjs_exec.v0+json';
  var CLASS_NAME = 'output_bokeh rendered_html';

  /**
   * Render data to the DOM node
   */
  function render(props, node) {
    var script = document.createElement("script");
    node.appendChild(script);
  }

  /**
   * Handle when an output is cleared or removed
   */
  function handleClearOutput(event, handle) {
    var cell = handle.cell;

    var id = cell.output_area._bokeh_element_id;
    var server_id = cell.output_area._bokeh_server_id;
    // Clean up Bokeh references
    if (id != null && id in Bokeh.index) {
      Bokeh.index[id].model.document.clear();
      delete Bokeh.index[id];
    }

    if (server_id !== undefined) {
      // Clean up Bokeh references
      var cmd = "from bokeh.io.state import curstate; print(curstate().uuid_to_server['" + server_id + "'].get_sessions()[0].document.roots[0]._id)";
      cell.notebook.kernel.execute(cmd, {
        iopub: {
          output: function(msg) {
            var id = msg.content.text.trim();
            if (id in Bokeh.index) {
              Bokeh.index[id].model.document.clear();
              delete Bokeh.index[id];
            }
          }
        }
      });
      // Destroy server and session
      var cmd = "import bokeh.io.notebook as ion; ion.destroy_server('" + server_id + "')";
      cell.notebook.kernel.execute(cmd);
    }
  }

  /**
   * Handle when a new output is added
   */
  function handleAddOutput(event, handle) {
    var output_area = handle.output_area;
    var output = handle.output;

    // limit handleAddOutput to display_data with EXEC_MIME_TYPE content only
    if ((output.output_type != "display_data") || (!output.data.hasOwnProperty(EXEC_MIME_TYPE))) {
      return
    }

    var toinsert = output_area.element.find("." + CLASS_NAME.split(' ')[0]);

    if (output.metadata[EXEC_MIME_TYPE]["id"] !== undefined) {
      toinsert[toinsert.length - 1].firstChild.textContent = output.data[JS_MIME_TYPE];
      // store reference to embed id on output_area
      output_area._bokeh_element_id = output.metadata[EXEC_MIME_TYPE]["id"];
    }
    if (output.metadata[EXEC_MIME_TYPE]["server_id"] !== undefined) {
      var bk_div = document.createElement("div");
      bk_div.innerHTML = output.data[HTML_MIME_TYPE];
      var script_attrs = bk_div.children[0].attributes;
      for (var i = 0; i < script_attrs.length; i++) {
        toinsert[toinsert.length - 1].firstChild.setAttribute(script_attrs[i].name, script_attrs[i].value);
      }
      // store reference to server id on output_area
      output_area._bokeh_server_id = output.metadata[EXEC_MIME_TYPE]["server_id"];
    }
  }

  function register_renderer(events, OutputArea) {

    function append_mime(data, metadata, element) {
      // create a DOM node to render to
      var toinsert = this.create_output_subarea(
        metadata,
        CLASS_NAME,
        EXEC_MIME_TYPE
      );
      this.keyboard_manager.register_events(toinsert);
      // Render to node
      var props = {data: data, metadata: metadata[EXEC_MIME_TYPE]};
      render(props, toinsert[toinsert.length - 1]);
      element.append(toinsert);
      return toinsert
    }

    /* Handle when an output is cleared or removed */
    events.on('clear_output.CodeCell', handleClearOutput);
    events.on('delete.Cell', handleClearOutput);

    /* Handle when a new output is added */
    events.on('output_added.OutputArea', handleAddOutput);

    /**
     * Register the mime type and append_mime function with output_area
     */
    OutputArea.prototype.register_mime_type(EXEC_MIME_TYPE, append_mime, {
      /* Is output safe? */
      safe: true,
      /* Index of renderer in `output_area.display_order` */
      index: 0
    });
  }

  // register the mime type if in Jupyter Notebook environment and previously unregistered
  if (root.Jupyter !== undefined) {
    var events = require('base/js/events');
    var OutputArea = require('notebook/js/outputarea').OutputArea;

    if (OutputArea.prototype.mime_types().indexOf(EXEC_MIME_TYPE) == -1) {
      register_renderer(events, OutputArea);
    }
  }
  {%- endif -%}

{% endblock %}

{% block autoload_init %}
  if (typeof (root._bokeh_timeout) === "undefined" || force === true) {
    root._bokeh_timeout = Date.now() + {{ timeout|default(0)|json }};
    root._bokeh_failed_load = false;
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
    var el = document.getElementById({{ elementid|json }});
    if (el != null) {
      el.textContent = "BokehJS is loading...";
    }
    if (root.Bokeh !== undefined) {
      if (el != null) {
        el.textContent = "BokehJS " + root.Bokeh.version + " successfully loaded.";
      }
    } else if (Date.now() < root._bokeh_timeout) {
      setTimeout(display_loaded, 100)
    }
  }
{% endblock %}

{% block run_inline_js %}
    if ((root.Bokeh !== undefined) || (force === true)) {
      for (var i = 0; i < inline_js.length; i++) {
        inline_js[i].call(root, root.Bokeh);
      }
      {%- if elementid -%}
      if (force === true) {
        display_loaded();
      }
      {%- endif -%}
    } else if (Date.now() < root._bokeh_timeout) {
      setTimeout(run_inline_js, 100);
    } else if (!root._bokeh_failed_load) {
      console.log("Bokeh: BokehJS failed to load within specified timeout.");
      root._bokeh_failed_load = true;
    } else if (force !== true) {
      var cell = $(document.getElementById({{ elementid|json }})).parents('.cell').data().cell;
      cell.output_area.append_execute_result(NB_LOAD_WARNING)
    }
{% endblock %}
