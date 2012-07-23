
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
    window.plot = plotmodel
    var div = $('<div style="border:1px solid black"></div>')    
    $('body').append(div)
    window.myrender  = function(){
	view = new Bokeh.PlotView({'model' : plotmodel, 
				   'render_loop' : true
				  });	
	div.append(view.$el)
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
    plotmodel.set({'render_loop' : true})
    window.plot = plotmodel
    var div = $('<div style="border:1px solid black"></div>')    
    $('body').append(div)
    window.myrender  = function(){
	view = new Bokeh.PlotView({'model' : plotmodel, 
				   'render_loop' : true				   
				  });
	div.append(view.$el)	
	view.render()
	//plotmodel.set({'width' : 300, 'height' : 300});	
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
    plotmodel.set({'render_loop' : true})
    var div = $('<div style="border:1px solid black"></div>')        
    $('body').append(div)
    window.myrender = function(){
	view = new Bokeh.PlotView({'model' : plotmodel, 
				   'render_loop' : true				   
				  });
	div.append(view.$el)		
	view.render();
	plotmodel.set({'width' : 300, 'height' : 300});	
    }
    _.defer(window.myrender)
});

