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