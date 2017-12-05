{% extends "try_run.js" %}

{% block code_to_run %}
  var docs_json = {{ docs_json }};
  var render_items = {{ render_items }};
  root.Bokeh.embed.embed_items(docs_json, render_items{%- if app_path -%}, "{{ app_path }}" {%- endif -%}{%- if absolute_url -%}, "{{ absolute_url }}" {%- endif -%});
{% endblock %}
