var modelid = "{{ modelid }}";
var modeltype = "{{ modeltype }}";
var elementid = "{{ elementid }}";
Bokeh.logger.info("Realizing plot:")
Bokeh.logger.info(" - modeltype: {{ modeltype }}");
Bokeh.logger.info(" - modelid: {{ modelid }}");
Bokeh.logger.info(" - elementid: {{ elementid }}");
var all_models = {{ all_models }};
Bokeh.load_models(all_models);
var model = Bokeh.Collections(modeltype).get(modelid);
var view = new model.default_view({model: model, el: '#{{ elementid }}'});
Bokeh.index[modelid] = view