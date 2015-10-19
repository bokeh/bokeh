Bokeh.Collections.register_models({
  {% for name, impl in custom_models.items() -%}
    "{{ name }}": {{ impl }},
  {%- endfor %}
});

{% if websocket_path -%}
  Bokeh.embed.set_websocket_path("{{ websocket_path }}");
{%- endif %}

var docs_json = {{ docs_json }};
var docs = {};
for (key in docs_json) {
  docs[key] = Bokeh.Document.from_json(docs_json[key]);
}
var render_items = {{ render_items }};
for (idx in render_items) {
  var item = render_items[idx];
  var elem = Bokeh.$('#' + item['elementid']);
  var promise = null;
  if ('modelid' in item && item['modelid'] !== null) {
    if ('docid' in item && item['docid'] !== null) {
      Bokeh.embed.add_model_static(elem, item['modelid'], docs[item['docid']]);
    } else {
      promise = Bokeh.embed.add_model_from_session(elem, item['modelid'], item['sessionid']);
    }
  } else {
    if ('docid' in item && item['docid'] !== null) {
       Bokeh.embed.add_document_static(elem, docs[item['docid']]);
    } else {
       promise = Bokeh.embed.add_document_from_session(elem, item['sessionid']);
    }
  }
  if (promise !== null) {
    promise.then(function(value) {}, function(error) {
      console.log("Error rendering Bokeh items ", error);
    });
  }
}
