class TestObject extends Bokeh.HasProperties

class TestObjects extends Backbone.Collection
  model : TestObject
  url : "/"

test('computed_properties', ->
  Bokeh.register_collection('TestObject', new TestObjects())
  model = Bokeh.Collections['TestObject'].create({'a' : 1, 'b': 1})
  model.register_property('c', ['a', 'b'], (a,b) -> a + b)
  temp =  model.get('c')
  ok(temp == 2)
)

test('cached_properties_react_changes', ->
  Bokeh.register_collection('TestObject', new TestObjects())
  model = Bokeh.Collections['TestObject'].create({'a' : 1, 'b': 1})
  prop =  (a,b) -> a + b
  model.register_property('c', ['a', 'b'], prop, true)
  temp =  model.get('c')
  ok(temp == 2)
  temp = model.get_cache('c')
  ok(not _.isUndefined(temp))
  model.set('a', 10)
  temp = model.get_cache('c')
  ok(_.isUndefined(temp))
  temp = model.get('c')
  ok(temp == 11)
)


test('has_prop_manages_event_lifcycle', ->
  Bokeh.register_collection('TestObject', new TestObjects())
  model = Bokeh.Collections['TestObject'].create({'a' : 1, 'b': 1})
  model2 = Bokeh.Collections['TestObject'].create({'a' : 1, 'b': 1})
  triggered = false
  Continuum.safebind(model, model2, 'change', () -> triggered = true)
  model2.set({'a' : 2})
  ok(triggered)
  triggered = false
  model.destroy()
  model2.set({'a' : 3})
  ok(not triggered)
)

test('has_prop_manages_event_for_views', ->
  Bokeh.register_collection('TestObject', new TestObjects())
  model = Bokeh.Collections['TestObject'].create({'a' : 1, 'b': 1})
  # dummy model2 to be the default model for continuumview
  # we mostly want to test how we react to other models, which is why
  # @model for a view is already handleed
  model2 = Bokeh.Collections['TestObject'].create({'a' : 1, 'b': 1})
  view = new Continuum.ContinuumView({'model' : model2})

  triggered = false
  Continuum.safebind(view, model, 'change', () -> triggered = true)
  model.set({'a' : 2})
  ok(triggered)
  triggered = false
  view.remove()
  model.set({'a' : 3})
  ok(not triggered)
)