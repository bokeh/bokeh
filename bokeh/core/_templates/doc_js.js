var docs_json = {{ docs_json }};
var render_items = {{ render_items }};

Bokeh.embed.embed_items(docs_json, render_items{%- if app_path -%}, "{{ app_path }}" {%- endif -%}{%- if absolute_url -%}, "{{ absolute_url }}" {%- endif -%});
