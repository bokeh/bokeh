var docs_json = {{ docs_json }};
var render_items = {{ render_items }};
var comms_target = "{{ comms_target }}";

Bokeh.embed.embed_items(docs_json, render_items{%- if websocket_url -%}, "{{ websocket_url }}" {%- endif -%});
if (window.Jupyter !== undefined) {
  Jupyter.notebook.kernel.execute("import bokeh; bokeh.io._comms_handles['"+comms_target+"'].init()");
}
