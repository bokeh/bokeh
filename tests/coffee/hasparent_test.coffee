base = require("../base")
Collections = base.Collections
HasParent = base.HasParent

class TestParent extends HasParent
    type : 'TestParent',
    parent_properties : ['testprop'],
    display_defaults :
      testprop : 'defaulttestprop'
class TestParents extends Backbone.Collection
    model : TestParent

# registering this test collection with Collections function
testparents = new TestParents()
exports.testparents = testparents
base.locations['TestParent'] = ['./hasparent_test', 'testparents']

test('parent_settings_propagate', () ->
  testparents.reset()
  parent = Collections('TestParent').create(
    id : 'parent'
    testprop : 'aassddff'
  )
  child = Collections('TestParent').create(
    id : 'first'
    parent : parent.ref()
  )
  ok(child.get('testprop') == parent.get('testprop'))
)

test('display_defaults_propagate', () ->
  testparents.reset()
  parent = Collections('TestParent').create(
    id : 'parent'
  )
  child = Collections('TestParent').create(
    id : 'first'
    parent : parent.ref()
  )
  ok(child.get('testprop') == parent.get('testprop'));
)
