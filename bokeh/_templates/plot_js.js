var all_models = {{ all_models }};
Bokeh.load_models(all_models);
var plots = {{ plots }};
for (idx in plots) {
	var plot = plots[idx];
	var model = Bokeh.Collections(plot.modeltype).get(plot.modelid);
	Bokeh.logger.info('Realizing plot:')
	Bokeh.logger.info(' - modeltype: ' + plot.modeltype);
	Bokeh.logger.info(' - modelid: ' + plot.modelid);
	Bokeh.logger.info(' - elementid: ' + plot.elementid);
	var view = new model.default_view({
		model: model,
		el: '#' + plot.elementid
	});
	Bokeh.index[plot.modelid] = view;
}
