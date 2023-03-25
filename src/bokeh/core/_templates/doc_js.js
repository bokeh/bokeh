{% extends "try_run.js" %}

{% block code_to_run %}
  const docs_json = {{ docs_json }};
  const render_items = {{ render_items }};
  root.Bokeh.embed.embed_items(docs_json, render_items{%- if app_path -%}, "{{ app_path }}" {%- endif -%}{%- if absolute_url -%}, "{{ absolute_url }}" {%- endif -%});
{% endblock %}
