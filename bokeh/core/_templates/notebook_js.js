var docs_json = {{ docs_json }};
var render_items = {{ render_items }};
var comms_target = "{{ comms_target }}";

(function embed_items() {
  if (window.Bokeh !== undefined) {
    Bokeh.embed.embed_items(docs_json, render_items{%- if websocket_url -%}, "{{ websocket_url }}" {%- endif -%});
    if (window.Jupyter !== undefined) {
      Jupyter.notebook.kernel.execute("import bokeh; bokeh.io._comms_handles['"+comms_target+"'].init()");
	}
  } else if (Date.now() < (window._bokeh_init_load+10000)) {
    setTimeout(run_inline_js, 500);
  }
})();
