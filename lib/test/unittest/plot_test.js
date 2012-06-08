
test('test_simple_plot', function(){
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var plotmodel = Bokeh.scatter_plot(null, data_source, 'x', 'y', null, 'circle');
    plotmodel.set({'usedialog' : true, 'render_loop' : true})
    plotmodel.set({'offset' : [500, 200]})
    window.plot = plotmodel
    window.myrender  = function(){
	view = new Bokeh.PlotView({'model' : plotmodel});	
	view.render()
    }
    _.defer(window.myrender)
});

test('test_updating_plot', function(){
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var plotmodel = Bokeh.scatter_plot(null, data_source, 'x', 'y', null, 'circle');
    plotmodel.set({'usedialog' : true, 'render_loop' : true})
    window.myrender  = function(){
	view = new Bokeh.PlotView({'model' : plotmodel});	
	view.render()
	plotmodel.set({'width' : 300, 'height' : 300});	
    }
    _.defer(window.myrender)

});

test('test_colors_plot', function(){
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var plotmodel = Bokeh.scatter_plot(null, data_source, 'x', 'y', 'x', 'circle');
    plotmodel.set({'usedialog' : true, 'render_loop' : true})    
    window.myrender = function(){
	view = new Bokeh.PlotView({'model' : plotmodel});
	view.render();
	plotmodel.set({'width' : 300, 'height' : 300});	
    }
    _.defer(window.myrender)
});

test('simple_grid_test', function(){
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var container = Bokeh.Collections['GridPlotContainer'].create(
	{'render_loop' : true}, 
	{'local' : true})
    container.set({'usedialog' : true})
    var plot1 = Bokeh.scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
    var plot2 = Bokeh.scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
    window.plot = container
    window.plot1 = plot1
    window.plot2 = plot2
        
    container.set({'children' : [[plot1.ref(), plot2.ref()]]})	    
    window.myrender = function(){
	view = new Bokeh.GridPlotContainerView({'model' : container});
	view.render()
    }    
    _.defer(window.myrender)
});

test('medium_grid_test', function(){
    expect(0)
    var data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var data_source2 = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : 2},
		{x : 2, y : 3},
		{x : 3, y : 1},
		{x : 4, y : 5},
		{x : 5, y : 6}]
    }, {'local' : true});
    var container = Bokeh.Collections['GridPlotContainer'].create(
	{'render_loop' : true},
	{'local' : true})
    container.set({'usedialog' : true})    
    var plot1 = Bokeh.scatter_plot(container, data_source1, 'x', 'y', 'x', 'circle');
    var plot2 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
    var plot3 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
    var plot4 = Bokeh.scatter_plot(container, data_source1, 'x', 'y', 'x', 'circle');
    container.set({'children' : [[plot1.ref(), plot2.ref()], [plot3.ref(), plot4.ref()]]})
    _.defer(function(){
	view = new Bokeh.GridPlotContainerView({'model' : container})
	view.render()
	plot3.set({'height' : 300})
    });
})

test('line_plot_grid_test', function(){
    expect(0)
    var data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var data_source2 = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : 2},
		{x : 2, y : 3},
		{x : 3, y : 1},
		{x : 4, y : 5},
		{x : 5, y : 6}]
    }, {'local' : true});
    var container = Bokeh.Collections['GridPlotContainer'].create(
	{'render_loop' : true},
	{'local' : true});
    container.set({'usedialog' : true})    
    var plot1 = Bokeh.scatter_plot(container, data_source1, 'x', 'y', 'x', 'circle');
    var plot2 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
    var plot3 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
    var plot4 = Bokeh.line_plot(container, data_source1, 'x', 'y');
    container.set({'children' : [[plot1.ref(), plot2.ref()], [plot3.ref(), plot4.ref()]]})
    window.myrender = function(){
	view = new Bokeh.GridPlotContainerView({'model' : container})
	view.render()
	console.log('SPLIT')
	plot3.set({'height' : 300})	
    }    
    _.defer(window.myrender)
})

