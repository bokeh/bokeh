var TestParent = Bokeh.HasParent.extend({
    parent_properties : ['testprop']
});
var TestParents = Backbone.Collection.extend({
    model : TestParent,
    url : "/",
});


test('test_simple_plot', function(){
    expect(0)
    $('body').append($("<div id='chart'></div>"));
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    });

    var plot_model = Bokeh.Collections['Plot'].create({
	'data_sources' : {test : data_source.ref()},
    });
    var xmapper = Bokeh.Collections['LinearMapper'].create({
	data_range : data_source.get_range('x').ref(),
	screen_range: plot_model.xrange.ref()
    });
    var ymapper = Bokeh.Collections['LinearMapper'].create({
	data_range : data_source.get_range('y').ref(),
	screen_range: plot_model.yrange.ref()
    });
    var scatter_plot = Bokeh.Collections['ScatterRenderer'].create({
	data_source : data_source.ref(),
	xfield : 'x',
	yfield : 'y',
	mark : 'circle',
	xmapper : xmapper.ref(),
	ymapper:  ymapper.ref()
    });
    plot_model.set('renderers', [scatter_plot.ref()], {'silent' : true})
    var plot_view = new Bokeh.PlotView({'model' : plot_model});
    plot_view.render();
});

test('test_updating_plot', function(){
    expect(0)
    $('body').append($("<div id='chart'></div>"));
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    });

    var plot_model = Bokeh.Collections['Plot'].create({
	'data_sources' : {test : data_source.ref()},
    });
    var xmapper = Bokeh.Collections['LinearMapper'].create({
	data_range : data_source.get_range('x').ref(),
	screen_range: plot_model.xrange.ref()
    });
    var ymapper = Bokeh.Collections['LinearMapper'].create({
	data_range : data_source.get_range('y').ref(),
	screen_range: plot_model.yrange.ref()
    });
    var scatter_plot = Bokeh.Collections['ScatterRenderer'].create({
	data_source : data_source.ref(),
	xfield : 'x',
	yfield : 'y',
	mark : 'circle',
	xmapper : xmapper.ref(),
	ymapper:  ymapper.ref()
    });
    plot_model.set('renderers', [scatter_plot.ref()], {'silent' : true})
    var plot_view = new Bokeh.PlotView({'model' : plot_model});
    plot_view.render();
    plot_model.set({'width' : 300, 'height' : 300});

});
