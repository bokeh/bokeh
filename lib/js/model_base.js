(function() {
  var Collections, Component, Continuum, HasParent, HasProperties, get_collections, resolve_ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (this.Continuum) {
    Continuum = this.Continuum;
  } else {
    Continuum = {};
    this.Continuum = Continuum;
  }

  Continuum.Collection = (function(_super) {

    __extends(Collection, _super);

    function Collection() {
      Collection.__super__.constructor.apply(this, arguments);
    }

    return Collection;

  })(Backbone.Collection);

  Collections = {};

  Continuum.Collections = Collections;

  Continuum.register_collection = function(key, value) {
    Collections[key] = value;
    return value.bokeh_key = key;
  };

  Continuum.load_models = function(modelspecs) {
    var attrs, coll, coll_attrs, model, newspecs, oldspecs, _i, _j, _k, _l, _len, _len2, _len3, _len4;
    newspecs = [];
    oldspecs = [];
    for (_i = 0, _len = modelspecs.length; _i < _len; _i++) {
      model = modelspecs[_i];
      coll = get_collections(model['collections'])[model['type']];
      attrs = model['attributes'];
      if (coll.get(attrs['id'])) {
        oldspecs.push([coll, attrs]);
      } else {
        newspecs.push([coll, attrs]);
      }
    }
    for (_j = 0, _len2 = newspecs.length; _j < _len2; _j++) {
      coll_attrs = newspecs[_j];
      coll = coll_attrs[0], attrs = coll_attrs[1];
      coll.add(attrs);
    }
    for (_k = 0, _len3 = newspecs.length; _k < _len3; _k++) {
      coll_attrs = newspecs[_k];
      coll = coll_attrs[0], attrs = coll_attrs[1];
      coll.get(attrs['id']).dinitialize(attrs);
    }
    for (_l = 0, _len4 = oldspecs.length; _l < _len4; _l++) {
      coll_attrs = oldspecs[_l];
      coll = coll_attrs[0], attrs = coll_attrs[1];
      coll.get(attrs['id']).set(attrs, {
        'local': true
      });
    }
    return null;
  };

  Continuum.submodels = function(ws_conn_string, topic) {
    var s;
    try {
      s = new WebSocket(ws_conn_string);
    } catch (error) {
      s = new MozWebSocket(ws_conn_string);
    }
    s.onopen = function() {
      return s.send(JSON.stringify({
        msgtype: 'subscribe',
        topic: topic
      }));
    };
    s.onmessage = function(msg) {
      var clientid, model, msgobj, ref, _i, _len, _ref;
      msgobj = JSON.parse(msg.data);
      if (msgobj['msgtype'] === 'modelpush') {
        Continuum.load_models(msgobj['modelspecs']);
      } else if (msgobj['msgtype'] === 'modeldel') {
        _ref = msgobj['modelspecs'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ref = _ref[_i];
          model = Continuum.resolve_ref(ref['collections'], ref['type'], ref['id']);
          if (model) {
            model.destroy({
              'local': true
            });
          }
        }
      } else if (msgobj['msgtype'] === 'status' && msgobj['status'][0] === 'subscribesuccess') {
        clientid = msgobj['status'][2];
        Continuum.clientid = clientid;
        $.ajaxSetup({
          'headers': {
            'Continuum-Clientid': clientid
          }
        });
      }
      return null;
    };
    return s;
  };

  resolve_ref = function(collections, type, id) {
    if (_.isArray(collections)) collections = get_collections(collections);
    return collections[type].get(id);
  };

  Continuum.resolve_ref = resolve_ref;

  get_collections = function(names) {
    var last, n, _i, _len;
    last = window;
    for (_i = 0, _len = names.length; _i < _len; _i++) {
      n = names[_i];
      last = last[n];
    }
    return last;
  };

  Continuum.get_collections = get_collections;

  HasProperties = (function(_super) {

    __extends(HasProperties, _super);

    function HasProperties() {
      HasProperties.__super__.constructor.apply(this, arguments);
    }

    HasProperties.prototype.collections = Collections;

    HasProperties.prototype.destroy = function(options) {
      var target, val, _ref, _results;
      HasProperties.__super__.destroy.call(this, options);
      if (_.has(this, 'eventers')) {
        _ref = this.eventers;
        _results = [];
        for (target in _ref) {
          if (!__hasProp.call(_ref, target)) continue;
          val = _ref[target];
          _results.push(val.off(null, null, this));
        }
        return _results;
      }
    };

    HasProperties.prototype.isNew = function() {
      return !this.get('created');
    };

    HasProperties.prototype.initialize = function(attrs, options) {
      var _this = this;
      HasProperties.__super__.initialize.call(this, attrs, options);
      this.properties = {};
      this.property_cache = {};
      if (!_.has(attrs, 'id')) {
        this.id = _.uniqueId(this.type);
        this.attributes['id'] = this.id;
      }
      return _.defer(function() {
        if (!_this.inited) return _this.dinitialize(attrs, options);
      });
    };

    HasProperties.prototype.dinitialize = function(attrs, options) {
      return this.inited = true;
    };

    HasProperties.prototype.set = function(key, value, options) {
      var attrs, toremove, val, _i, _len;
      if (_.isObject(key) || key === null) {
        attrs = key;
        options = value;
      } else {
        attrs = {};
        attrs[key] = value;
      }
      toremove = [];
      for (key in attrs) {
        if (!__hasProp.call(attrs, key)) continue;
        val = attrs[key];
        if (_.has(this, 'properties') && _.has(this.properties, key) && this.properties[key]['setter']) {
          this.properties[key]['setter'].call(this, val);
          toremove.push(key);
        }
      }
      for (_i = 0, _len = toremove.length; _i < _len; _i++) {
        key = toremove[_i];
        delete attrs[key];
      }
      if (!_.isEmpty(attrs)) {
        return HasProperties.__super__.set.call(this, attrs, options);
      }
    };

    HasProperties.prototype.structure_dependencies = function(dependencies) {
      var deps, local_deps, other_deps, x;
      other_deps = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
          x = dependencies[_i];
          if (_.isObject(x)) _results.push(x);
        }
        return _results;
      })();
      local_deps = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
          x = dependencies[_i];
          if (!_.isObject(x)) _results.push(x);
        }
        return _results;
      })();
      if (local_deps.length > 0) {
        deps = [
          {
            'ref': this.ref(),
            'fields': local_deps
          }
        ];
        deps = deps.concat(other_deps);
      } else {
        deps = other_deps;
      }
      return deps;
    };

    HasProperties.prototype.register_property = function(prop_name, dependencies, getter, use_cache, setter) {
      var dep, fld, obj, prop_spec, _i, _j, _len, _len2, _ref,
        _this = this;
      if (_.has(this.properties, prop_name)) this.remove_property(prop_name);
      dependencies = this.structure_dependencies(dependencies);
      prop_spec = {
        'getter': getter,
        'dependencies': dependencies,
        'use_cache': use_cache,
        'setter': setter,
        'callbacks': {
          'changedep': function() {
            return _this.trigger('changedep:' + prop_name);
          },
          'propchange': function() {
            var firechange, new_val, old_val;
            firechange = true;
            if (prop_spec['use_cache']) {
              old_val = _this.get_cache(prop_name);
              _this.clear_cache(prop_name);
              new_val = _this.get(prop_name);
              firechange = new_val !== old_val;
            }
            if (firechange) {
              _this.trigger('change:' + prop_name, _this, _this.get(prop_name));
              return _this.trigger('change', _this);
            }
          }
        }
      };
      this.properties[prop_name] = prop_spec;
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        obj = this.resolve_ref(dep['ref']);
        _ref = dep['fields'];
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          fld = _ref[_j];
          safebind(this, obj, "change:" + fld, prop_spec['callbacks']['changedep']);
        }
      }
      safebind(this, this, "changedep:" + prop_name, prop_spec['callbacks']['propchange']);
      return prop_spec;
    };

    HasProperties.prototype.remove_property = function(prop_name) {
      var dep, dependencies, fld, obj, prop_spec, _i, _j, _len, _len2, _ref;
      prop_spec = this.properties[prop_name];
      dependencies = prop_spec.dependencies;
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        obj = this.resolve_ref(dep['ref']);
        _ref = dep['fields'];
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          fld = _ref[_j];
          obj.off('change:' + fld, prop_spec['callbacks']['changedep'], this);
        }
      }
      this.off("changedep:" + dep);
      delete this.properties[prop_name];
      if (prop_spec.use_cache) return this.clear_cache(prop_name);
    };

    HasProperties.prototype.has_cache = function(prop_name) {
      return _.has(this.property_cache, prop_name);
    };

    HasProperties.prototype.add_cache = function(prop_name, val) {
      return this.property_cache[prop_name] = val;
    };

    HasProperties.prototype.clear_cache = function(prop_name, val) {
      return delete this.property_cache[prop_name];
    };

    HasProperties.prototype.get_cache = function(prop_name) {
      return this.property_cache[prop_name];
    };

    HasProperties.prototype.get = function(prop_name) {
      var computed, getter, prop_spec;
      if (_.has(this.properties, prop_name)) {
        prop_spec = this.properties[prop_name];
        if (prop_spec.use_cache && this.has_cache(prop_name)) {
          return this.property_cache[prop_name];
        } else {
          getter = prop_spec.getter;
          computed = getter.apply(this, this);
          if (this.properties[prop_name].use_cache) {
            this.add_cache(prop_name, computed);
          }
          return computed;
        }
      } else {
        return HasProperties.__super__.get.call(this, prop_name);
      }
    };

    HasProperties.prototype.ref = function() {
      return {
        'type': this.type,
        'id': this.id
      };
    };

    HasProperties.prototype.resolve_ref = function(ref) {
      if (!ref) console.log('ERROR, null reference');
      if (ref['type'] === this.type && ref['id'] === this.id) {
        return this;
      } else {
        return resolve_ref(this.collections, ref['type'], ref['id']);
      }
    };

    HasProperties.prototype.get_ref = function(ref_name) {
      var ref;
      ref = this.get(ref_name);
      if (ref) return this.resolve_ref(ref);
    };

    HasProperties.prototype.url = function() {
      var base;
      base = "/bb/" + window.topic + "/" + this.type + "/";
      if (this.isNew()) return base;
      return base + this.get('id');
    };

    HasProperties.prototype.sync = function(method, model, options) {
      if (options.local) {
        return options.success(model);
      } else {
        return Backbone.sync(method, model, options);
      }
    };

    HasProperties.prototype.defaults = {};

    return HasProperties;

  })(Backbone.Model);

  HasParent = (function(_super) {

    __extends(HasParent, _super);

    function HasParent() {
      HasParent.__super__.constructor.apply(this, arguments);
    }

    HasParent.prototype.get_fallback = function(attr) {
      var attrs, retval;
      if (this.get_ref('parent') && _.indexOf(this.get_ref('parent').parent_properties, attr) >= 0 && !_.isUndefined(this.get_ref('parent').get(attr))) {
        return this.get_ref('parent').get(attr);
      } else {
        retval = this.display_defaults[attr];
        if (_.isObject(retval) && _.has(retval, 'type')) {
          attrs = _.has(retval, 'attrs') ? retval['attrs'] : {};
          retval = this.collections[retval['type']].create(attrs).ref();
          this.set(attr, retval);
          this.save();
        }
        return retval;
      }
    };

    HasParent.prototype.get = function(attr) {
      var normalval;
      normalval = HasParent.__super__.get.call(this, attr);
      if (!_.isUndefined(normalval)) {
        return normalval;
      } else if (!(attr === 'parent')) {
        return this.get_fallback(attr);
      }
    };

    HasParent.prototype.display_defaults = {};

    return HasParent;

  })(HasProperties);

  Component = (function(_super) {

    __extends(Component, _super);

    function Component() {
      Component.__super__.constructor.apply(this, arguments);
    }

    Component.prototype.collections = Collections;

    Component.prototype.position_object_x = function(offset, container_width, object_width) {
      return offset;
    };

    Component.prototype.position_object_y = function(offset, container_height, object_height) {
      return container_height - object_height - offset;
    };

    Component.prototype.xpos = function(x) {
      return x;
    };

    Component.prototype.ypos = function(y) {
      return this.get('height') - y;
    };

    Component.prototype.rxpos = function(x) {
      return x;
    };

    Component.prototype.rypos = function(y) {
      return this.get('height') - y;
    };

    Component.prototype.position_child_x = function(size, offset) {
      return this.xpos(offset);
    };

    Component.prototype.position_child_y = function(size, offset) {
      return this.ypos(offset) - size;
    };

    Component.prototype.child_position_to_offset_x = function(child, position) {
      var offset;
      offset = position;
      return this.rxpos(offset);
    };

    Component.prototype.child_position_to_offset_y = function(child, position) {
      var offset;
      offset = position + child.get('outerheight');
      return this.rypos(offset);
    };

    Component.prototype.position_x = function() {
      var parent;
      parent = this.get_ref('parent');
      if (!parent) return 0;
      return parent.position_child_x(this.get('outerwidth'), this.get('offset')[0]);
    };

    Component.prototype.position_y = function() {
      var parent, val;
      parent = this.get_ref('parent');
      if (!parent) return 0;
      val = parent.position_child_y(this.get('outerheight'), this.get('offset')[1]);
      return val;
    };

    Component.prototype.reverse_position_x = function(input) {
      var parent;
      parent = this.get_ref('parent');
      if (!parent) return 0;
      return parent.child_position_to_offset_x(this, input);
    };

    Component.prototype.reverse_position_y = function(input) {
      var parent;
      parent = this.get_ref('parent');
      if (!parent) return 0;
      return parent.child_position_to_offset_y(this, input);
    };

    Component.prototype.dinitialize = function(attrs, options) {
      Component.__super__.dinitialize.call(this, attrs, options);
      this.register_property('outerwidth', ['width', 'border_space'], function() {
        return this.get('width') + 2 * this.get('border_space');
      }, false);
      return this.register_property('outerheight', ['height', 'border_space'], function() {
        return this.get('height') + 2 * this.get('border_space');
      }, false);
    };

    Component.prototype.defaults = {
      parent: null
    };

    Component.prototype.display_defaults = {
      width: 200,
      height: 200,
      position: 0,
      offset: [0, 0],
      border_space: 30
    };

    Component.prototype.default_view = null;

    return Component;

  })(HasParent);

}).call(this);
