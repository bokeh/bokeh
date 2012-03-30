var TestParent = Bokeh.HasParent.extend({
    parent_properties : ['testprop']
});
var TestParents = Backbone.Collection.extend({
    model : TestParent,
    url : "/",
});


test('hasparent_defaults_propagate', function(){
    Bokeh.register_collection('TestParent', new TestParents());
    var parent = Bokeh.Collections['TestParent'].create(
	{'id' : 'parent',
	 'testprop' : 'aassddff'});
    var child = Bokeh.Collections['TestParent'].create(
	{'id':'first',
	 'parent' : {'id' : 'parent',
		     'type' : 'TestParent'},
	});
    ok(child.get('testprop') === parent.get('testprop'));
    
    
});