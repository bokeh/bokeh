{%- if custom_models -%}
Bokeh.Collections.register_models({
  {% for name, impl in custom_models.items() -%}
    "{{ name }}": {{ impl }},
  {%- endfor %}
});
{% endif -%}

{% if websocket_url -%}
  var websocket_url = "{{ websocket_url }}";
{%- else %}
  var websocket_url = null;
{%- endif %}

{% if comms_target -%}
  var comms_target = "{{ comms_target }}";
{%- else %}
  var comms_target = null;
{%- endif %}


var docs_json = {{ docs_json }};
var render_items = {{ render_items }};

Bokeh.embed.embed_items(docs_json, render_items, websocket_url, comms_target);
