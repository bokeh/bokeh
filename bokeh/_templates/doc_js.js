Bokeh.Collections.register_models({
  {% for name, impl in custom_models.items() -%}
    "{{ name }}": {{ impl }},
  {%- endfor %}
});

{% if websocket_path -%}
  var websocket_path = "{{ websocket_path }}";
{%- else %}
  var websocket_path = null;
{%- endif %}

var docs_json = {{ docs_json }};
var render_items = {{ render_items }};

Bokeh.embed.embed_items(docs_json, render_items, websocket_path);
