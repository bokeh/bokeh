var docs_json = {{ docs_json }};
var render_items = {{ render_items }};

bokeh_load(function() {
  Bokeh.$(function() {
    Bokeh.embed.embed_items(docs_json, render_items{%- if websocket_url -%}, "{{ websocket_url }}" {%- endif -%});
  });
});
