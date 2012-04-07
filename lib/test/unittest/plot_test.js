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
    var view = Bokeh.scatter_plot(null, data_source, 'x', 'y', null, 'circle');
    view.render();
    window.view = view;
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
    var view = Bokeh.scatter_plot(null, data_source, 'x', 'y', null, 'circle');
    view.render();
    window.view = view;
    plot_model = view.model
    plot_model.set({'width' : 300, 'height' : 300});
});
