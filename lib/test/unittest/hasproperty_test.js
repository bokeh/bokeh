(function() {
  var TestObject, TestObjects,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  TestObject = (function(_super) {

    __extends(TestObject, _super);

    function TestObject() {
      TestObject.__super__.constructor.apply(this, arguments);
    }

    return TestObject;

  })(Bokeh.HasProperties);

  TestObjects = (function(_super) {

    __extends(TestObjects, _super);

    function TestObjects() {
      TestObjects.__super__.constructor.apply(this, arguments);
    }

    TestObjects.prototype.model = TestObject;

    TestObjects.prototype.url = "/";

    return TestObjects;

  })(Backbone.Collection);

  test('computed_properties', function() {
    var model, temp;
    Bokeh.register_collection('TestObject', new TestObjects());
    model = Bokeh.Collections['TestObject'].create({
      'a': 1,
      'b': 1
    });
    model.register_property('c', ['a', 'b'], function(a, b) {
      return a + b;
    });
    temp = model.get('c');
    return ok(temp === 2);
  });

  test('cached_properties_react_changes', function() {
    var model, prop, temp;
    Bokeh.register_collection('TestObject', new TestObjects());
    model = Bokeh.Collections['TestObject'].create({
      'a': 1,
      'b': 1
    });
    prop = function(a, b) {
      return a + b;
    };
    model.register_property('c', ['a', 'b'], prop, true);
    temp = model.get('c');
    ok(temp === 2);
    temp = model.get_cache('c');
    ok(!_.isUndefined(temp));
    model.set('a', 10);
    temp = model.get_cache('c');
    ok(_.isUndefined(temp));
    temp = model.get('c');
    return ok(temp === 11);
  });

  test('has_prop_manages_event_lifcycle', function() {
    var model, model2, triggered;
    Bokeh.register_collection('TestObject', new TestObjects());
    model = Bokeh.Collections['TestObject'].create({
      'a': 1,
      'b': 1
    });
    model2 = Bokeh.Collections['TestObject'].create({
      'a': 1,
      'b': 1
    });
    triggered = false;
    Continuum.safebind(model, model2, 'change', function() {
      return triggered = true;
    });
    model2.set({
      'a': 2
    });
    ok(triggered);
    triggered = false;
    model.destroy();
    model2.set({
      'a': 3
    });
    return ok(!triggered);
  });

  test('has_prop_manages_event_for_views', function() {
    var model, model2, triggered, view;
    Bokeh.register_collection('TestObject', new TestObjects());
    model = Bokeh.Collections['TestObject'].create({
      'a': 1,
      'b': 1
    });
    model2 = Bokeh.Collections['TestObject'].create({
      'a': 1,
      'b': 1
    });
    view = new Continuum.ContinuumView({
      'model': model2
    });
    triggered = false;
    Continuum.safebind(view, model, 'change', function() {
      return triggered = true;
    });
    model.set({
      'a': 2
    });
    ok(triggered);
    triggered = false;
    view.remove();
    model.set({
      'a': 3
    });
    return ok(!triggered);
  });

}).call(this);
