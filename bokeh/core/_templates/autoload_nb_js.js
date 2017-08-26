{% extends "autoload_js.js" %}

{% block register_mimetype %}

  {%- if register_mime -%}
  var MIME_TYPE = 'application/vnd.bokehjs_exec.v0+json';
  var CLASS_NAME = 'output_bokeh rendered_html';

  /**
   * Render data to the DOM node
   */
  function render(props, node) {
    if (props.data['div'] !== undefined) {
      var div = document.createElement("div");
      div.innerHTML = props.data["div"];
      node.appendChild(div);
    }

    if (props.data['script'] !== undefined) {
      var script = document.createElement("script");
      script.textContent = props.data["script"];
      node.appendChild(script);
    }
  }

  /**
   * Handle when an output is cleared or removed
   */
  function handleClearOutput(event, handle) {
    var cell = handle.cell;

    var id = cell.output_area._bokeh_element_id;
    var server_id = cell.output_area._bokeh_server_id;
    // Clean up Bokeh references
    if (id !== undefined) {
      Bokeh.index[id].model.document.clear();
      delete Bokeh.index[id];
    }

    if (server_id !== undefined) {
      // Clean up Bokeh references
      var cmd = "from bokeh.io import _state; print(_state.uuid_to_server['" + server_id + "'].get_sessions()[0].document.roots[0]._id)";
      cell.notebook.kernel.execute(cmd, {
        iopub: {
          output: function(msg) {
            var element_id = msg.content.text.trim();
            Bokeh.index[element_id].model.document.clear();
            delete Bokeh.index[element_id];
          }
        }
      });
      // Destroy server and session
      var cmd = "from bokeh import io; io._destroy_server('" + server_id + "')";
      cell.notebook.kernel.execute(cmd);
    }
  }

  /**
   * Handle when a new output is added
   */
  function handleAddOutput(event,  handle) {
    var output_area = handle.output_area;
    var output = handle.output;
    // store reference to embed id or server id on output_area
    if (output.metadata[MIME_TYPE] !== undefined) {
      output_area._bokeh_element_id = output.metadata[MIME_TYPE]["id"];
      output_area._bokeh_server_id = output.metadata[MIME_TYPE]["server_id"];
    }
  }

  function register_renderer(notebook, OutputArea) {
    // get OutputArea instance
    var code_cell = notebook.get_cells().reduce(function(result, cell) { return cell.output_area ? cell : result });
    var output_area = code_cell.output_area;

    function append_mime(data, metadata, element) {
      // create a DOM node to render to
      var toinsert = this.create_output_subarea(
        metadata,
        CLASS_NAME,
        MIME_TYPE
      );
      this.keyboard_manager.register_events(toinsert);
      // Render to node
      var props = {data: data, metadata: metadata[MIME_TYPE]};
      render(props, toinsert[0]);
      element.append(toinsert);
      return toinsert
    }

    /* Handle when an output is cleared or removed */
    output_area.events.on('clear_output.CodeCell', handleClearOutput);
    output_area.events.on('delete.Cell', handleClearOutput);

    /* Handle when a new output is added */
    output_area.events.on('output_added.OutputArea', handleAddOutput);

    /**
     * Register the mime type and append_mime function with output_area
     */
    OutputArea.prototype.register_mime_type(MIME_TYPE, append_mime, {
      /* Is output safe? */
      safe: true,
      /* Index of renderer in `output_area.display_order` */
      index: 0
    });
  }

  // register the mime type if in Jupyter Notebook environment and previously unregistered
  var OutputArea = root.Jupyter.OutputArea;
  if ((root.Jupyter !== undefined) && (OutputArea.prototype.mime_types().indexOf(MIME_TYPE) == -1)) {
    register_renderer(root.Jupyter.notebook, OutputArea);
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
    if (root.Bokeh !== undefined) {
      var el = document.getElementById({{ elementid|json }});
      if (el != null) {
        el.textContent = "BokehJS " + Bokeh.version + " successfully loaded.";
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
