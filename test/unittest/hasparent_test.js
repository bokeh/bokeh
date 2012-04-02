var TestParent = Bokeh.HasParent.extend({
    type : 'TestParent',
    parent_properties : ['testprop'],
    display_defaults : {
	'testprop' : 'defaulttestprop'
    }
});

var TestParents = Backbone.Collection.extend({
    model : TestParent,
    url : "/",
});


test('parent_settings_propagate', function(){
    Bokeh.register_collection('TestParent', new TestParents());
    var parent = Bokeh.Collections['TestParent'].create(
	{'id' : 'parent',
	 'testprop' : 'aassddff'});
    var child = Bokeh.Collections['TestParent'].create(
	{'id':'first',
	 'parent' : parent.ref()
	});
    ok(child.get('testprop') === parent.get('testprop'));
});

test('display_defaults_propagate', function(){
    Bokeh.register_collection('TestParent', new TestParents());
    var parent = Bokeh.Collections['TestParent'].create(
	{'id' : 'parent'});
    var child = Bokeh.Collections['TestParent'].create(
	{'id':'first',
	 'parent' : parent.ref()
	});
    ok(child.get('testprop') === parent.get('testprop'));
});