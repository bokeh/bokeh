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

{% if notebook_comms_target -%}
  var notebook_comms_target = "{{ notebook_comms_target }}";
{%- else %}
  var notebook_comms_target = null;
{%- endif %}


var docs_json = {{ docs_json }};
var render_items = {{ render_items }};

Bokeh.embed.embed_items(docs_json, render_items, websocket_url, notebook_comms_target);
