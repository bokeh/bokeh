{% extends "autoload_js.js" %}

{% block register_mimetype %}

  {%- if register_mime -%}
  const JS_MIME_TYPE = 'application/javascript';
  const HTML_MIME_TYPE = 'text/html';
  const EXEC_MIME_TYPE = 'application/vnd.bokehjs_exec.v0+json';
  const CLASS_NAME = 'output_bokeh rendered_html';

  /**
   * Render data to the DOM node
   */
  function render(props, node) {
    const script = document.createElement("script");
    node.appendChild(script);
  }

  /**
   * Handle when an output is cleared or removed
   */
  function handleClearOutput(event, handle) {
    function drop(id) {
      const view = Bokeh.index.get_by_id(id)
      if (view != null) {
        view.model.document.clear()
        Bokeh.index.delete(view)
      }
    }

    const cell = handle.cell;

    const id = cell.output_area._bokeh_element_id;
    const server_id = cell.output_area._bokeh_server_id;

    // Clean up Bokeh references
    if (id != null) {
      drop(id)
    }

    if (server_id !== undefined) {
      // Clean up Bokeh references
      const cmd_clean = "from bokeh.io.state import curstate; print(curstate().uuid_to_server['" + server_id + "'].get_sessions()[0].document.roots[0]._id)";
      cell.notebook.kernel.execute(cmd_clean, {
        iopub: {
          output: function(msg) {
            const id = msg.content.text.trim()
            drop(id)
          }
        }
      });
      // Destroy server and session
      const cmd_destroy = "import bokeh.io.notebook as ion; ion.destroy_server('" + server_id + "')";
      cell.notebook.kernel.execute(cmd_destroy);
    }
  }

  /**
   * Handle when a new output is added
   */
  function handleAddOutput(event, handle) {
    const output_area = handle.output_area;
    const output = handle.output;

    // limit handleAddOutput to display_data with EXEC_MIME_TYPE content only
    if ((output.output_type != "display_data") || (!Object.prototype.hasOwnProperty.call(output.data, EXEC_MIME_TYPE))) {
      return
    }

    const toinsert = output_area.element.find("." + CLASS_NAME.split(' ')[0]);

    if (output.metadata[EXEC_MIME_TYPE]["id"] !== undefined) {
      toinsert[toinsert.length - 1].firstChild.textContent = output.data[JS_MIME_TYPE];
      // store reference to embed id on output_area
      output_area._bokeh_element_id = output.metadata[EXEC_MIME_TYPE]["id"];
    }
    if (output.metadata[EXEC_MIME_TYPE]["server_id"] !== undefined) {
      const bk_div = document.createElement("div");
      bk_div.innerHTML = output.data[HTML_MIME_TYPE];
      const script_attrs = bk_div.children[0].attributes;
      for (let i = 0; i < script_attrs.length; i++) {
        toinsert[toinsert.length - 1].firstChild.setAttribute(script_attrs[i].name, script_attrs[i].value);
        toinsert[toinsert.length - 1].firstChild.textContent = bk_div.children[0].textContent
      }
      // store reference to server id on output_area
      output_area._bokeh_server_id = output.metadata[EXEC_MIME_TYPE]["server_id"];
    }
  }

  function register_renderer(events, OutputArea) {

    function append_mime(data, metadata, element) {
      // create a DOM node to render to
      const toinsert = this.create_output_subarea(
        metadata,
        CLASS_NAME,
        EXEC_MIME_TYPE
      );
      this.keyboard_manager.register_events(toinsert);
      // Render to node
      const props = {data: data, metadata: metadata[EXEC_MIME_TYPE]};
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
    const events = require('base/js/events');
    const OutputArea = require('notebook/js/outputarea').OutputArea;

    if (OutputArea.prototype.mime_types().indexOf(EXEC_MIME_TYPE) == -1) {
      register_renderer(events, OutputArea);
    }
  }
  {%- endif -%}

{% endblock %}

{% block autoload_init %}
  if (typeof (root._bokeh_timeout) === "undefined" || force === true) {
    root._bokeh_timeout = Date.now() + {{ timeout|default(0)|tojson }};
    root._bokeh_failed_load = false;
  }

  const NB_LOAD_WARNING = {'data': {'text/html':
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

  function display_loaded(error = null) {
    const el = document.getElementById({{ elementid|tojson }});
    if (el != null) {
      const html = (() => {
        if (typeof root.Bokeh === "undefined") {
          if (error == null) {
            return "BokehJS is loading ...";
          } else {
            return "BokehJS failed to load.";
          }
        } else {
          const prefix = `BokehJS ${root.Bokeh.version}`;
          if (error == null) {
            return `${prefix} successfully loaded.`;
          } else {
            return `${prefix} <b>encountered errors</b> while loading and may not function as expected.`;
          }
        }
      })();
      el.innerHTML = html;

      if (error != null) {
        const wrapper = document.createElement("div");
        wrapper.style.overflow = "auto";
        wrapper.style.height = "5em";
        wrapper.style.resize = "vertical";
        const content = document.createElement("div");
        content.style.fontFamily = "monospace";
        content.style.whiteSpace = "pre-wrap";
        content.style.backgroundColor = "rgb(255, 221, 221)";
        content.textContent = error.stack ?? error.toString();
        wrapper.append(content);
        el.append(wrapper);
      }
    } else if (Date.now() < root._bokeh_timeout) {
      setTimeout(() => display_loaded(error), 100);
    }
  }
{% endblock %}

{% block run_inline_js %}
    if (root.Bokeh !== undefined || force === true) {
      try {
        {{ super() }}
      } catch (error) {
        {%- if elementid -%}
        display_loaded(error);
        {%- endif -%}
        throw error;
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
      const cell = $(document.getElementById({{ elementid|tojson }})).parents('.cell').data().cell;
      cell.output_area.append_execute_result(NB_LOAD_WARNING)
    }
{% endblock %}
