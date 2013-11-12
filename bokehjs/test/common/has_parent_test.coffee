
require [
  "common/base",
  "../test/common/test_parent"
], (base, test_parent) ->

  Collections = base.Collections

  testparents = test_parent.Collection
  base.locations['TestParent'] = "../test/common/test_parent"
  base.mod_cache["../test/common/test_parent"] = test_parent

  test('parent_settings_propagate', () ->
    testparents.reset()
    parent = Collections('TestParent').create(
      id : 'parent'
      testprop : 'aassddff'
    )

    parent_ref = parent.ref()

    child = Collections('TestParent').create(
      id : 'first'
      'parent' : parent_ref
    )
    child_test_prop = child.get('testprop')
    parent_test_prop = parent.get('testprop')

    ok(child_test_prop == parent_test_prop)
  )

  test('display_defaults_propagate', () ->
    testparents.reset()
    parent = Collections('TestParent').create(
      id : 'parent'
    )
    child = Collections('TestParent').create(
      id : 'first'
      'parent' : parent.ref()
    )
    ok(child.get('testprop') == parent.get('testprop'));
  )
