{% extends "try_run.js" %}

{% block code_to_run %}
  const docs_json = {{ docs_json }};
  const render_items = {{ render_items }};
  void root.Bokeh.embed.embed_items_notebook(docs_json, render_items);
{% endblock %}
