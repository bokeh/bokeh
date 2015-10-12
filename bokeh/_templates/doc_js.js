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
  var elem = Bokeh.$('#' + item['elementid']);
  if ('modelid' in item && item['modelid'] !== null) {
    if ('docid' in item && item['docid'] !== null) {
      Bokeh.embed.add_model_static(elem, item['modelid'], docs[item['docid']]);
    } else {
      Bokeh.embed.add_model_from_session(elem, item['modelid'], item['sessionid']);
    }
  } else {
    if ('docid' in item && item['docid'] !== null) {
       Bokeh.embed.add_document_static(elem, docs[item['docid']]);
    } else {
       Bokeh.embed.add_document_from_session(elem, item['sessionid']);
    }
  }
}
