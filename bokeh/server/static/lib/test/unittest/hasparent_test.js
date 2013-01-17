var TestParent = Continuum.HasParent.extend({
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
    Continuum.register_collection('TestParent', new TestParents());
    var parent = Continuum.Collections['TestParent'].create(
	{'id' : 'parent',
	 'testprop' : 'aassddff'});
    var child = Continuum.Collections['TestParent'].create(
	{'id':'first',
	 'parent' : parent.ref()
	});
    ok(child.get('testprop') === parent.get('testprop'));
});

test('display_defaults_propagate', function(){
    Continuum.register_collection('TestParent', new TestParents());
    var parent = Continuum.Collections['TestParent'].create(
	{'id' : 'parent'});
    var child = Continuum.Collections['TestParent'].create(
	{'id':'first',
	 'parent' : parent.ref()
	});
    ok(child.get('testprop') === parent.get('testprop'));
});