(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "backbone", "require", "./base", "./logging"], function(_, Backbone, require, base, Logging) {
    var HasProperties, logger, _is_ref;
    logger = Logging.logger;
    _is_ref = function(arg) {
      var keys;
      if (_.isObject(arg)) {
        keys = _.keys(arg).sort();
        return keys.length === 2 && keys[0] === 'id' && keys[1] === 'type';
      }
      return false;
    };
    return HasProperties = (function(_super) {
      __extends(HasProperties, _super);

      HasProperties.prototype.toString = function() {
        return "" + this.type + "(" + this.id + ")";
      };

      HasProperties.prototype.destroy = function(options) {
        HasProperties.__super__.destroy.call(this, options);
        return this.stopListening();
      };

      HasProperties.prototype.isNew = function() {
        return false;
      };

      HasProperties.prototype.attrs_and_props = function() {
        var data, prop_name, _i, _len, _ref;
        data = _.clone(this.attributes);
        _ref = _.keys(this.properties);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          prop_name = _ref[_i];
          data[prop_name] = this.get(prop_name);
        }
        return data;
      };

      function HasProperties(attributes, options) {
        this.rpc = __bind(this.rpc, this);
        this.resolve_ref = __bind(this.resolve_ref, this);
        this.convert_to_ref = __bind(this.convert_to_ref, this);
        var attrs;
        attrs = attributes || {};
        if (!options) {
          options = {};
        }
        this.cid = _.uniqueId('c');
        this.attributes = {};
        if (options.collection) {
          this.collection = options.collection;
        }
        if (options.parse) {
          attrs = this.parse(attrs, options) || {};
        }
        attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
        this.set(attrs, options);
        this.changed = {};
        this._base = false;
        this.properties = {};
        this.property_cache = {};
        if (!_.has(attrs, this.idAttribute)) {
          this.id = _.uniqueId(this.type);
          this.attributes[this.idAttribute] = this.id;
        }
        if (!options.defer_initialization) {
          this.initialize.apply(this, arguments);
        }
      }

      HasProperties.prototype.set_obj = function(key, value, options) {
        var attrs, val;
        if (_.isObject(key) || key === null) {
          attrs = key;
          options = value;
        } else {
          attrs = {};
          attrs[key] = value;
        }
        for (key in attrs) {
          if (!__hasProp.call(attrs, key)) continue;
          val = attrs[key];
          attrs[key] = this.convert_to_ref(val);
        }
        return this.set(attrs, options);
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
            this.properties[key]['setter'].call(this, val, key);
            toremove.push(key);
          }
        }
        if (!_.isEmpty(toremove)) {
          attrs = _.clone(attrs);
          for (_i = 0, _len = toremove.length; _i < _len; _i++) {
            key = toremove[_i];
            delete attrs[key];
          }
        }
        if (!_.isEmpty(attrs)) {
          return HasProperties.__super__.set.call(this, attrs, options);
        }
      };

      HasProperties.prototype.convert_to_ref = function(value) {
        if (_.isArray(value)) {
          return _.map(value, this.convert_to_ref);
        } else {
          if (value instanceof HasProperties) {
            return value.ref();
          }
        }
      };

      HasProperties.prototype.add_dependencies = function(prop_name, object, fields) {
        var fld, prop_spec, _i, _len, _results;
        if (!_.isArray(fields)) {
          fields = [fields];
        }
        prop_spec = this.properties[prop_name];
        prop_spec.dependencies = prop_spec.dependencies.concat({
          obj: object,
          fields: fields
        });
        _results = [];
        for (_i = 0, _len = fields.length; _i < _len; _i++) {
          fld = fields[_i];
          _results.push(this.listenTo(object, "change:" + fld, prop_spec['callbacks']['changedep']));
        }
        return _results;
      };

      HasProperties.prototype.register_setter = function(prop_name, setter) {
        var prop_spec;
        prop_spec = this.properties[prop_name];
        return prop_spec.setter = setter;
      };

      HasProperties.prototype.register_property = function(prop_name, getter, use_cache) {
        var changedep, prop_spec, propchange,
          _this = this;
        if (_.isUndefined(use_cache)) {
          use_cache = true;
        }
        if (_.has(this.properties, prop_name)) {
          this.remove_property(prop_name);
        }
        changedep = function() {
          return _this.trigger('changedep:' + prop_name);
        };
        propchange = function() {
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
        };
        prop_spec = {
          'getter': getter,
          'dependencies': [],
          'use_cache': use_cache,
          'setter': null,
          'callbacks': {
            changedep: changedep,
            propchange: propchange
          }
        };
        this.properties[prop_name] = prop_spec;
        this.listenTo(this, "changedep:" + prop_name, prop_spec['callbacks']['propchange']);
        return prop_spec;
      };

      HasProperties.prototype.remove_property = function(prop_name) {
        var dep, dependencies, fld, obj, prop_spec, _i, _j, _len, _len1, _ref;
        prop_spec = this.properties[prop_name];
        dependencies = prop_spec.dependencies;
        for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
          dep = dependencies[_i];
          obj = dep.obj;
          _ref = dep['fields'];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            fld = _ref[_j];
            obj.off('change:' + fld, prop_spec['callbacks']['changedep'], this);
          }
        }
        this.off("changedep:" + dep);
        delete this.properties[prop_name];
        if (prop_spec.use_cache) {
          return this.clear_cache(prop_name);
        }
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

      HasProperties.prototype.get = function(prop_name, resolve_refs) {
        var ref_or_val;
        if (resolve_refs == null) {
          resolve_refs = true;
        }
        if (_.has(this.properties, prop_name)) {
          return this._get_prop(prop_name);
        } else {
          ref_or_val = HasProperties.__super__.get.call(this, prop_name);
          if (!resolve_refs) {
            return ref_or_val;
          }
          return this.resolve_ref(ref_or_val);
        }
      };

      HasProperties.prototype._get_prop = function(prop_name) {
        var computed, getter, prop_spec;
        prop_spec = this.properties[prop_name];
        if (prop_spec.use_cache && this.has_cache(prop_name)) {
          return this.property_cache[prop_name];
        } else {
          getter = prop_spec.getter;
          computed = getter.apply(this, [prop_name]);
          if (this.properties[prop_name].use_cache) {
            this.add_cache(prop_name, computed);
          }
          return computed;
        }
      };

      HasProperties.prototype.ref = function() {
        return {
          'type': this.type,
          'id': this.id
        };
      };

      HasProperties.prototype.resolve_ref = function(arg) {
        var x;
        if (_.isUndefined(arg)) {
          return arg;
        }
        if (_.isArray(arg)) {
          return (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = arg.length; _i < _len; _i++) {
              x = arg[_i];
              _results.push(this.resolve_ref(x));
            }
            return _results;
          }).call(this);
        }
        if (_is_ref(arg)) {
          if (arg['type'] === this.type && arg['id'] === this.id) {
            return this;
          } else {
            return this.get_base().Collections(arg['type']).get(arg['id']);
          }
        }
        return arg;
      };

      HasProperties.prototype.get_base = function() {
        if (!this._base) {
          this._base = require('./base');
        }
        return this._base;
      };

      HasProperties.prototype.url = function() {
        var doc, url;
        doc = this.get('doc');
        if (doc == null) {
          logger.error("unset 'doc' in " + this);
        }
        url = this.get_base().Config.prefix + "bokeh/bb/" + doc + "/" + this.type + "/";
        if (this.isNew()) {
          return url;
        }
        return url + this.get('id') + "/";
      };

      HasProperties.prototype.sync = function(method, model, options) {
        return options.success(model.attributes, null, {});
      };

      HasProperties.prototype.defaults = function() {
        return {};
      };

      HasProperties.prototype.rpc = function(funcname, args, kwargs) {
        var data, doc, id, prefix, resp, type, url;
        prefix = this.get_base().Config.prefix;
        doc = this.get('doc');
        if (doc == null) {
          throw new Error("Unset 'doc' in " + this);
        }
        id = this.get('id');
        type = this.type;
        url = "" + prefix + "bokeh/bb/rpc/" + doc + "/" + type + "/" + id + "/" + funcname + "/";
        data = {
          args: args,
          kwargs: kwargs
        };
        resp = $.ajax({
          type: 'POST',
          url: url,
          data: JSON.stringify(data),
          contentType: 'application/json',
          xhrFields: {
            withCredentials: true
          }
        });
        return resp;
      };

      return HasProperties;

    })(Backbone.Model);
  });

}).call(this);

/*
//@ sourceMappingURL=has_properties.js.map
*/