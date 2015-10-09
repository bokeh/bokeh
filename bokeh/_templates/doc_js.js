Bokeh.Collections.register_models({
  {% for name, impl in custom_models.items() -%}
    "{{ name }}": {{ impl }},
  {%- endfor %}
});
var docs_json = {{ docs_json }};
var docs = {};
for (key in docs_json) {
  docs[key] = Bokeh.Document.from_json(docs_json[key]);
}
var render_items = {{ render_items }};
for (idx in render_items) {
  var item = render_items[idx];
  if ('modelid' in item && item['modelid'] !== null) {
     Bokeh.embed.add_model_static(Bokeh.$('#' + item['elementid']), item['modelid'], docs[item['docid']]);
  } else {
     Bokeh.embed.add_document_static(Bokeh.$('#' + item['elementid']), docs[item['docid']]);
  }
}
