var TestParent = Bokeh.HasParent.extend({
    parent_properties : ['testprop']
});
var TestParents = Backbone.Collection.extend({
    model : TestParent,
    url : "/",
});


test('test_simple_plot', function(){
    $('body').append($("<div id='chart'></div>"));
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    });
    var width = 200;
    var height = 200;
    var xdatarange = Bokeh.Collections['Range1d'].create({
	'start' : 1,
	'end' : 5
    });
    var ydatarange = Bokeh.Collections['Range1d'].create({
	'start' : -6,
	'end' :  -2
    });
    var xscreenrange = Bokeh.Collections['Range1d'].create({
	'start' : 0,
	'end' : width
    });
    var yscreenrange = Bokeh.Collections['Range1d'].create({
	'start' : 0,
	'end' : height
    });

    var xmapper = Bokeh.Collections['LinearMapper'].create({
	data_range : xdatarange.ref(),
	screen_range: xscreenrange.ref()
    });
    var ymapper = Bokeh.Collections['LinearMapper'].create({
	data_range : ydatarange.ref(),
	screen_range: yscreenrange.ref()
    });

    var scatter_plot = Bokeh.Collections['ScatterRenderer'].create({
	data_source : data_source.ref(),
	xfield : 'x',
	yfield : 'y',
	mark : 'circle',
	xmapper : xmapper.ref(),
	ymapper:  ymapper.ref()
    });

    var plot_model = Bokeh.Collections['Plot'].create({
	'data_sources' : {test : data_source.ref()},
	'renderers' : [scatter_plot.ref()]
    });
    
    var plot_view = new Bokeh.PlotView({'model' : plot_model});
    plot_view.render();
});