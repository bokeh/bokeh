{%- if custom_models -%}
Bokeh.Collections.register_models({
  {% for name, impl in custom_models.items() -%}
    "{{ name }}": {{ impl }},
  {%- endfor %}
});
{% endif -%}

var docs_json = {{ docs_json }};
var render_items = {{ render_items }};

Bokeh.embed.embed_items(docs_json, render_items{%- if websocket_url -%}, "{{ websocket_url }}" {%- endif -%});
