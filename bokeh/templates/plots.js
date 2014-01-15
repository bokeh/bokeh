var all_models = {{ all_models }};
var modelid = "{{ modelid }}";
var modeltype = "{{ modeltype }}";
var elementid = "{{ elementid }}";
console.log(modelid, modeltype, elementid);
Bokeh.load_models(all_models);
var model = Bokeh.Collections(modeltype).get(modelid);
var view = new model.default_view({model: model, el: '#{{ elementid }}'});
