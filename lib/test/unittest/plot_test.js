var TestParent = Bokeh.HasParent.extend({
    parent_properties : ['testprop']
});
var TestParents = Backbone.Collection.extend({
    model : TestParent,
    url : "/",
});


test('test_simple_plot', function(){
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    });
    var plotmodel = Bokeh.scatter_plot(null, data_source, 'x', 'y', null, 'circle');
    view = new Bokeh.PlotView({'model' : plotmodel});
    view.render();
    view.add_dialog()
});

test('test_updating_plot', function(){
    expect(0)
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    });
    var plotmodel = Bokeh.scatter_plot(null, data_source, 'x', 'y', null, 'circle');
    view = new Bokeh.PlotView({'model' : plotmodel});
    view.render();
    view.add_dialog()
    plotmodel.set({'width' : 300, 'height' : 300});
});

test('test_colors_plot', function(){
    expect(0)
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    });
    var plotmodel = Bokeh.scatter_plot(null, data_source, 'x', 'y', 'x', 'circle');
    view = new Bokeh.PlotView({'model' : plotmodel});
    view.render();
    view.add_dialog()
    plotmodel.set({'width' : 300, 'height' : 300});
    
    view.render();
});

test('simple_grid_test', function(){
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    });
    var container = Bokeh.Collections['GridPlotContainer'].create()
    
    var plot1 = Bokeh.scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
    var plot2 = Bokeh.scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
    container.set({'children' : [[plot1.ref(), plot2.ref()]]})
    view = new Bokeh.GridPlotContainerView({'model' : container});
    view.render()
    view.add_dialog()
});

 