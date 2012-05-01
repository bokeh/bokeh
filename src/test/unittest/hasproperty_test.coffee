class TestObject extends Continuum.HasProperties
  type : 'TestObject'
class TestObjects extends Backbone.Collection
  model : TestObject
  url : "/"

test('computed_properties', ->
  Continuum.register_collection('TestObject', new TestObjects())
  model = Continuum.Collections['TestObject'].create({'a' : 1, 'b': 1})
  model.register_property('c', ['a', 'b'],
    () -> @get('a') + @get('b'))
  temp =  model.get('c')
  ok(temp == 2)
)

test('cached_properties_react_changes', ->
  Continuum.register_collection('TestObject', new TestObjects())
  model = Continuum.Collections['TestObject'].create({'a' : 1, 'b': 1})
  model.register_property('c', ['a', 'b'],
    () -> @get('a') + @get('b'),
    true)
  temp =  model.get('c')
  ok(temp == 2)
  temp = model.get_cache('c')
  ok(not _.isUndefined(temp))
  model.set('a', 10)
  temp = model.get_cache('c')
  temp = model.get('c')
  ok(temp == 11)
)


test('has_prop_manages_event_lifcycle', ->
  Continuum.register_collection('TestObject', new TestObjects())
  model = Continuum.Collections['TestObject'].create({'a' : 1, 'b': 1})
  model2 = Continuum.Collections['TestObject'].create({'a' : 1, 'b': 1})
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
  Continuum.register_collection('TestObject', new TestObjects())
  model = Continuum.Collections['TestObject'].create({'a' : 1, 'b': 1})
  # dummy model2 to be the default model for continuumview
  # we mostly want to test how we react to other models, which is why
  # @model for a view is already handleed
  model2 = Continuum.Collections['TestObject'].create({'a' : 1, 'b': 1})
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

test('property_setters', ->
  Continuum.register_collection('TestObject', new TestObjects())
  model = Continuum.Collections['TestObject'].create({'a' : 1, 'b': 1})
  # dummy model2 to be the default model for continuumview
  # we mostly want to test how we react to other models, which is why
  # @model for a view is already handleed
  prop =  () -> @get('a') + @get('b')
  setter = (val) ->
    @set('a', val/2, {silent:true})
    @set('b', val/2)
  model.register_property('c', ['a', 'b'], prop, true, setter)
  model.set('c', 100)
  ok(model.get('a') == 50)
  ok(model.get('b') == 50)
)