
require [
  "underscore",
  "common/base",
  "common/continuum_view",
  "common/has_properties",
  "../test/common/test_object",
], (_, base, ContinuumView, HasProperties, test_object) ->

  testobjects = test_object.Collection
  base.locations['TestObject'] = "../test/common/test_object"
  base.mod_cache["../test/common/test_object"] = test_object

  test('computed_properties', ->
    testobjects.reset()
    model = testobjects.create({'a': 1, 'b': 1})
    model.register_property('c', () -> @get('a') + @get('b'))
    model.add_dependencies('c', model, ['a', 'b'])
    temp =  model.get('c')
    ok(temp == 2)
  )

  test('cached_properties_react_changes', ->
    testobjects.reset()
    model = testobjects.create({'a': 1, 'b': 1})
    model.register_property('c',
      () -> @get('a') + @get('b'),
      true)
    model.add_dependencies('c', model, ['a', 'b'])
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
    testobjects.reset()
    model = testobjects.create({'a': 1, 'b': 1})
    model2 = testobjects.create({'a': 1, 'b': 1})
    triggered = false
    model.listenTo(model2, 'change', () -> triggered = true)
    model2.set({'a': 2})
    ok(triggered)
    triggered = false
    model.destroy()
    model2.set({'a': 3})
    ok(not triggered)
  )

  test('has_prop_manages_event_for_views', ->
    testobjects.reset()
    model = testobjects.create({'a': 1, 'b': 1})
    # dummy model2 to be the default model for continuumview
    # we mostly want to test how we react to other models, which is why
    # @model for a view is already handleed
    model2 = testobjects.create({'a': 1, 'b': 1})
    view = new ContinuumView({'model': model2})

    triggered = false
    view.listenTo(model, 'change', () -> triggered = true)
    model.set({'a': 2})
    ok(triggered)
    triggered = false
    view.remove()
    model.set({'a': 3})
    ok(not triggered)
  )


  test('property_setters', ->
    testobjects.reset()
    model = testobjects.create({'a': 1, 'b': 1})
    # dummy model2 to be the default model for continuumview
    # we mostly want to test how we react to other models, which is why
    # @model for a view is already handleed
    prop =  () -> @get('a') + @get('b')
    setter = (val) ->
      @set('a', val/2, {silent:true})
      @set('b', val/2)
    model.register_property('c', prop, true)
    model.add_dependencies('c', model, ['a', 'b'])
    model.register_setter('c', setter)
    model.set('c', 100)
    ok(model.get('a') == 50)
    ok(model.get('b') == 50)
  )

  test('test_vectorized_ref', () ->
    testobjects.reset()

    model1 = testobjects.create(
      a: 1
      b: 1
    )
    model2 = testobjects.create(
      a: 2
      b: 2
    )
    model3 = testobjects.create(
      a: 1
      b: 1
      vectordata: [model1.ref(), model2.ref()]
    )
    model4 = testobjects.create(
      a: 1
      b: 1
      vectordata: [[model1.ref(), model2.ref()]]
    )

    output = model3.get('vectordata')
    ok(output[0] == model1)
    ok(output[1] == model2)

    model3.set_obj('vectordata2', [model1, model1, model2])
    output = model3.get('vectordata2', false)
    ok(output[0].id == model1.ref().id)
    ok(output[1].id == model1.ref().id)
    ok(output[2].id == model2.ref().id)
    ok(not (output[0] instanceof HasProperties))

    output = model4.get('vectordata')
    ok(output[0][0] == model1)
    ok(output[0][1] == model2)

  )
