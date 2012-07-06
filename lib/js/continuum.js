(function() {
  var CDXPlotContext, CDXPlotContextView, CDXPlotContexts, Collections, Component, Continuum, ContinuumView, DataTable, DataTableView, DataTables, DeferredParent, DeferredView, HasParent, HasProperties, InteractiveContext, InteractiveContextView, InteractiveContexts, Table, TableView, Tables, build_views, get_collections, logger, resolve_ref, safebind,
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

  build_views = function(mainmodel, view_storage, view_specs, options, view_options) {
    "use strict";
    var created_views, idx, key, model, spec, temp, valid_viewmodels, value, view_specific_option, _i, _len, _len2;
    created_views = [];
    valid_viewmodels = {};
    for (_i = 0, _len = view_specs.length; _i < _len; _i++) {
      spec = view_specs[_i];
      valid_viewmodels[spec.id] = true;
    }
    for (idx = 0, _len2 = view_specs.length; idx < _len2; idx++) {
      spec = view_specs[idx];
      if (view_storage[spec.id]) continue;
      model = mainmodel.resolve_ref(spec);
      if (view_options) {
        view_specific_option = view_options[idx];
      } else {
        view_specific_option = {};
      }
      temp = _.extend({}, view_specific_option, spec.options, options, {
        'model': model
      });
      view_storage[model.id] = new model.default_view(temp);
      created_views.push(view_storage[model.id]);
    }
    for (key in view_storage) {
      if (!__hasProp.call(view_storage, key)) continue;
      value = view_storage[key];
      if (!valid_viewmodels[key]) {
        value.remove();
        delete view_storage[key];
      }
    }
    return created_views;
  };

  Continuum.build_views = build_views;

  window.logger = new Backbone.Model();

  window.logger.on('all', function() {
    var msg;
    msg = 'LOGGER:' + JSON.stringify(arguments[1][0]);
    return console.log(msg);
  });

  Continuum.logger = window.logger;

  logger = Continuum.logger;

  logger.log = function() {
    return logger.trigger('LOG', arguments);
  };

  get_collections = function(names) {
    var last, n, _i, _len;
    last = window;
    for (_i = 0, _len = names.length; _i < _len; _i++) {
      n = names[_i];
      last = last[n];
    }
    return last;
  };

  resolve_ref = function(collections, type, id) {
    if (_.isArray(collections)) collections = get_collections(collections);
    return collections[type].get(id);
  };

  Continuum.resolve_ref = resolve_ref;

  Continuum.get_collections = get_collections;

  safebind = function(binder, target, event, callback) {
    var _this = this;
    if (!_.has(binder, 'eventers')) binder['eventers'] = {};
    binder['eventers'][target.id] = target;
    target.on(event, callback, binder);
    target.on('destroy remove', function() {
      return delete binder['eventers'][target];
    }, binder);
    return null;
  };

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

  ContinuumView = (function(_super) {

    __extends(ContinuumView, _super);

    function ContinuumView() {
      ContinuumView.__super__.constructor.apply(this, arguments);
    }

    ContinuumView.prototype.initialize = function(options) {
      if (!_.has(options, 'id')) return this.id = _.uniqueId('ContinuumView');
    };

    ContinuumView.prototype.remove = function() {
      var target, val, _ref;
      if (_.has(this, 'eventers')) {
        _ref = this.eventers;
        for (target in _ref) {
          if (!__hasProp.call(_ref, target)) continue;
          val = _ref[target];
          val.off(null, null, this);
        }
      }
      this.trigger('remove');
      return ContinuumView.__super__.remove.call(this);
    };

    ContinuumView.prototype.tag_selector = function(tag, id) {
      return "#" + this.tag_id(tag, id);
    };

    ContinuumView.prototype.tag_id = function(tag, id) {
      if (!id) id = this.id;
      return tag + "-" + id;
    };

    ContinuumView.prototype.tag_el = function(tag, id) {
      return this.$el.find("#" + this.tag_id(tag, id));
    };

    ContinuumView.prototype.tag_d3 = function(tag, id) {
      var val;
      val = d3.select(this.el).select("#" + this.tag_id(tag, id));
      if (val[0][0] === null) {
        return null;
      } else {
        return val;
      }
    };

    ContinuumView.prototype.mget = function() {
      return this.model.get.apply(this.model, arguments);
    };

    ContinuumView.prototype.mset = function() {
      return this.model.set.apply(this.model, arguments);
    };

    ContinuumView.prototype.mget_ref = function(fld) {
      return this.model.get_ref(fld);
    };

    ContinuumView.prototype.add_dialog = function() {
      var position,
        _this = this;
      position = function() {
        return _this.$el.dialog('widget').css({
          'top': _this.model.position_y() + "px",
          'left': _this.model.position_x() + "px"
        });
      };
      this.$el.dialog({
        width: this.mget('outerwidth') + 50,
        maxHeight: $(window).height(),
        close: function() {
          return _this.remove();
        },
        dragStop: function(event, ui) {
          var left, top, xoff, yoff;
          top = parseInt(_this.$el.dialog('widget').css('top').split('px')[0]);
          left = parseInt(_this.$el.dialog('widget').css('left').split('px')[0]);
          xoff = _this.model.reverse_position_x(left);
          yoff = _this.model.reverse_position_y(top);
          _this.model.set({
            'offset': [xoff, yoff]
          });
          return _this.model.save();
        }
      });
      position();
      _.defer(function() {
        return _this.$el.dialog('option', 'height', _this.mget('outerheight') + 70);
      });
      safebind(this, this.model, 'change:offset', position);
      safebind(this, this.model, 'change:outerwidth', function() {
        return this.$el.dialog('option', 'width', this.mget('outerwidth'));
      });
      return safebind(this, this.model, 'change:outerheight', function() {
        return this.$el.dialog('option', 'height', this.mget('outerheight'));
      });
    };

    return ContinuumView;

  })(Backbone.View);

  DeferredView = (function(_super) {

    __extends(DeferredView, _super);

    function DeferredView() {
      DeferredView.__super__.constructor.apply(this, arguments);
    }

    DeferredView.prototype.initialize = function(options) {
      this.deferred_parent = options['deferred_parent'];
      this.request_render();
      return DeferredView.__super__.initialize.call(this, options);
    };

    DeferredView.prototype.render = function() {
      DeferredView.__super__.render.call(this);
      this._dirty = false;
      return DeferredView.__super__.render.call(this);
    };

    DeferredView.prototype.request_render = function() {
      return this._dirty = true;
    };

    DeferredView.prototype.render_deferred_components = function(force) {
      if (force || this._dirty) return this.render();
    };

    return DeferredView;

  })(ContinuumView);

  DeferredParent = (function(_super) {

    __extends(DeferredParent, _super);

    function DeferredParent() {
      DeferredParent.__super__.constructor.apply(this, arguments);
    }

    DeferredParent.prototype.initialize = function(options) {
      var _this = this;
      DeferredParent.__super__.initialize.call(this, options);
      if (this.mget('render_loop')) {
        console.log('loop');
        _.defer(function() {
          return _this.render_loop();
        });
      }
      return safebind(this, this.model, 'change:render_loop', function() {
        if (_this.mget('render_loop') && !_this.looping) {
          return _this.render_loop();
        }
      });
    };

    DeferredParent.prototype.render_loop = function() {
      var _this = this;
      this.looping = true;
      this.render_deferred_components();
      if (!this.removed && this.mget('render_loop')) {
        return setTimeout((function() {
          return _this.render_loop();
        }), 100);
      } else {
        return this.looping = false;
      }
    };

    DeferredParent.prototype.remove = function() {
      DeferredParent.__super__.remove.call(this);
      return this.removed = true;
    };

    return DeferredParent;

  })(DeferredView);

  Continuum.DeferredView = DeferredView;

  Continuum.DeferredParent = DeferredParent;

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

  DataTableView = (function(_super) {

    __extends(DataTableView, _super);

    function DataTableView() {
      DataTableView.__super__.constructor.apply(this, arguments);
    }

    DataTableView.prototype.initialize = function(options) {
      DataTableView.__super__.initialize.call(this, options);
      this.render();
      return safebind(this, this.model, 'change', this.render);
    };

    DataTableView.prototype.el = 'div';

    DataTableView.prototype.className = 'table table-striped table-bordered table-condensed';

    DataTableView.prototype.render = function() {
      var colname, datacell, datacell_template, header, header_column, header_html, header_template, html, row, row_template, rowdata, table, table_template, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      table_template = "<table class='table table-striped table-bordered table-condensed' id='{{ tableid }}'></table>";
      header_template = "<thead id = '{{headerrowid}}'></thead>";
      header_column = "<th><a href=\"javascript:cdxSortByColumn()\" class='link'>{{column_name}}</a></th>";
      row_template = "<tr></tr>";
      datacell_template = "<td>{{data}}</td>";
      header_html = _.template(header_template, {
        'headerrowid': this.tag_id('headerrow')
      });
      header = $(header_html);
      _ref = this.mget('columns');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        colname = _ref[_i];
        html = _.template(header_column, {
          'column_name': colname
        });
        header.append($(html));
      }
      table = $(_.template(table_template, {
        'tableid': this.tag_id('table')
      }));
      table.append(header);
      _ref2 = this.mget_ref('data_source').get('data');
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        rowdata = _ref2[_j];
        row = $(row_template);
        _ref3 = this.mget('columns');
        for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
          colname = _ref3[_k];
          datacell = $(_.template(datacell_template, {
            'data': rowdata[colname]
          }));
          row.append(datacell);
          table.append(row);
        }
      }
      this.$el.html(table);
      if (this.mget('usedialog') && !this.$el.is(":visible")) {
        return this.add_dialog();
      }
    };

    return DataTableView;

  })(ContinuumView);

  DataTable = (function(_super) {

    __extends(DataTable, _super);

    function DataTable() {
      DataTable.__super__.constructor.apply(this, arguments);
    }

    DataTable.prototype.type = 'DataTable';

    DataTable.prototype.default_view = DataTableView;

    DataTable.prototype.defaults = {
      data_source: null,
      columns: []
    };

    return DataTable;

  })(Component);

  DataTables = (function(_super) {

    __extends(DataTables, _super);

    function DataTables() {
      DataTables.__super__.constructor.apply(this, arguments);
    }

    DataTables.prototype.model = DataTable;

    return DataTables;

  })(Backbone.Collection);

  TableView = (function(_super) {

    __extends(TableView, _super);

    function TableView() {
      TableView.__super__.constructor.apply(this, arguments);
    }

    TableView.prototype.delegateEvents = function() {
      safebind(this, this.model, 'destroy', this.remove);
      return safebind(this, this.model, 'change', this.render);
    };

    TableView.prototype.render = function() {
      var column, data, elem, headerrow, idx, row, row_elem, rownum, _i, _len, _len2, _len3, _ref, _ref2, _ref3;
      TableView.__super__.render.call(this);
      this.$el.empty();
      this.$el.append("<table></table>");
      this.$el.find('table').append("<tr></tr>");
      headerrow = $(this.$el.find('table').find('tr')[0]);
      _ref = ['row'].concat(this.mget('columns'));
      for (idx = 0, _len = _ref.length; idx < _len; idx++) {
        column = _ref[idx];
        elem = $(_.template('<th class="tableelem tableheader">{{ name }}</th>', {
          'name': column
        }));
        headerrow.append(elem);
      }
      _ref2 = this.mget('data');
      for (idx = 0, _len2 = _ref2.length; idx < _len2; idx++) {
        row = _ref2[idx];
        row_elem = $("<tr class='tablerow'></tr>");
        rownum = idx + this.mget('data_slice')[0];
        _ref3 = [rownum].concat(row);
        for (_i = 0, _len3 = _ref3.length; _i < _len3; _i++) {
          data = _ref3[_i];
          elem = $(_.template("<td class='tableelem'>{{val}}</td>", {
            'val': data
          }));
          row_elem.append(elem);
        }
        this.$el.find('table').append(row_elem);
      }
      this.render_pagination();
      if (this.mget('usedialog') && !this.$el.is(":visible")) {
        return this.add_dialog();
      }
    };

    TableView.prototype.render_pagination = function() {
      var maxoffset, node,
        _this = this;
      if (this.mget('offset') > 0) {
        node = $("<button>first</button>").css({
          'cursor': 'pointer'
        });
        this.$el.append(node);
        node.click(function() {
          _this.model.load(0);
          return false;
        });
        node = $("<button>previous</button>").css({
          'cursor': 'pointer'
        });
        this.$el.append(node);
        node.click(function() {
          _this.model.load(_.max([_this.mget('offset') - _this.mget('chunksize'), 0]));
          return false;
        });
      }
      maxoffset = this.mget('total_rows') - this.mget('chunksize');
      if (this.mget('offset') < maxoffset) {
        node = $("<button>next</button>").css({
          'cursor': 'pointer'
        });
        this.$el.append(node);
        node.click(function() {
          _this.model.load(_.min([_this.mget('offset') + _this.mget('chunksize'), maxoffset]));
          return false;
        });
        node = $("<button>last</button>").css({
          'cursor': 'pointer'
        });
        this.$el.append(node);
        return node.click(function() {
          _this.model.load(maxoffset);
          return false;
        });
      }
    };

    return TableView;

  })(ContinuumView);

  Table = (function(_super) {

    __extends(Table, _super);

    function Table() {
      Table.__super__.constructor.apply(this, arguments);
    }

    Table.prototype.type = 'Table';

    Table.prototype.dinitialize = function(attrs, options) {
      Table.__super__.dinitialize.call(this, attrs, options);
      this.register_property('offset', ['data_slice'], (function() {
        return this.get('data_slice')[0];
      }), false);
      return this.register_property('chunksize', ['data_slice'], (function() {
        return this.get('data_slice')[1] - this.get('data_slice')[0];
      }), false);
    };

    Table.prototype.defaults = {
      url: "",
      columns: [],
      data: [[]],
      data_slice: [0, 100],
      total_rows: 0
    };

    Table.prototype.default_view = TableView;

    Table.prototype.load = function(offset) {
      var _this = this;
      return $.get(this.get('url'), {
        data_slice: JSON.stringify(this.get('data_slice'))
      }, function(data) {
        _this.set('data_slice', [offset, offset + _this.get('chunksize')], {
          silent: true
        });
        return _this.set({
          'data': JSON.parse(data)['data']
        });
      });
    };

    return Table;

  })(Component);

  Tables = (function(_super) {

    __extends(Tables, _super);

    function Tables() {
      Tables.__super__.constructor.apply(this, arguments);
    }

    Tables.prototype.model = Table;

    Tables.prototype.url = "/bb";

    return Tables;

  })(Backbone.Collection);

  CDXPlotContextView = (function(_super) {

    __extends(CDXPlotContextView, _super);

    function CDXPlotContextView() {
      CDXPlotContextView.__super__.constructor.apply(this, arguments);
    }

    CDXPlotContextView.prototype.initialize = function(options) {
      this.views = {};
      return CDXPlotContextView.__super__.initialize.call(this, options);
    };

    CDXPlotContextView.prototype.delegateEvents = function() {
      safebind(this, this.model, 'destroy', this.remove);
      return safebind(this, this.model, 'change', this.request_render);
    };

    CDXPlotContextView.prototype.generate_remove_child_callback = function(view) {
      var callback,
        _this = this;
      callback = function() {
        var newchildren, x;
        newchildren = (function() {
          var _i, _len, _ref, _results;
          _ref = this.mget('children');
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            x = _ref[_i];
            if (x.id !== view.model.id) _results.push(x);
          }
          return _results;
        }).call(_this);
        _this.mset('children', newchildren);
        return null;
      };
      return callback;
    };

    CDXPlotContextView.prototype.build_children = function() {
      var counter, created_views, model, plotelem, spec, view, view_specific_options, _i, _len, _len2, _ref;
      this.mainlist = $("<ul></ul>");
      this.$el.append(this.mainlist);
      view_specific_options = [];
      _ref = this.mget('children');
      for (counter = 0, _len = _ref.length; counter < _len; counter++) {
        spec = _ref[counter];
        model = this.model.resolve_ref(spec);
        model.set({
          'usedialog': false
        });
        plotelem = $("<li id='li" + counter + "'></li>");
        this.mainlist.append(plotelem);
        view_specific_options.push({
          'el': plotelem
        });
      }
      created_views = build_views(this.model, this.views, this.mget('children'), {}, view_specific_options);
      window.pc_created_views = created_views;
      window.pc_views = this.views;
      for (_i = 0, _len2 = created_views.length; _i < _len2; _i++) {
        view = created_views[_i];
        safebind(this, view, 'remove', this.generate_remove_child_callback(view));
      }
      return null;
    };

    CDXPlotContextView.prototype.render_deferred_components = function(force) {
      var view, _i, _len, _ref, _results;
      CDXPlotContextView.__super__.render_deferred_components.call(this, force);
      _ref = _.values(this.views);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        _results.push(view.render_deferred_components(force));
      }
      return _results;
    };

    CDXPlotContextView.prototype.render = function() {
      CDXPlotContextView.__super__.render.call(this);
      this.build_children();
      return null;
    };

    return CDXPlotContextView;

  })(DeferredParent);

  CDXPlotContext = (function(_super) {

    __extends(CDXPlotContext, _super);

    function CDXPlotContext() {
      CDXPlotContext.__super__.constructor.apply(this, arguments);
    }

    CDXPlotContext.prototype.type = 'CDXPlotContext';

    CDXPlotContext.prototype.default_view = CDXPlotContextView;

    CDXPlotContext.prototype.defaults = {
      children: [],
      render_loop: true
    };

    return CDXPlotContext;

  })(Component);

  CDXPlotContexts = (function(_super) {

    __extends(CDXPlotContexts, _super);

    function CDXPlotContexts() {
      CDXPlotContexts.__super__.constructor.apply(this, arguments);
    }

    CDXPlotContexts.prototype.model = CDXPlotContext;

    return CDXPlotContexts;

  })(Backbone.Collection);

  InteractiveContextView = (function(_super) {

    __extends(InteractiveContextView, _super);

    function InteractiveContextView() {
      InteractiveContextView.__super__.constructor.apply(this, arguments);
    }

    InteractiveContextView.prototype.initialize = function(options) {
      this.views = {};
      return InteractiveContextView.__super__.initialize.call(this, options);
    };

    InteractiveContextView.prototype.delegateEvents = function() {
      safebind(this, this.model, 'destroy', this.remove);
      return safebind(this, this.model, 'change', this.request_render);
    };

    InteractiveContextView.prototype.generate_remove_child_callback = function(view) {
      var callback,
        _this = this;
      callback = function() {
        var newchildren, x;
        newchildren = (function() {
          var _i, _len, _ref, _results;
          _ref = this.mget('children');
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            x = _ref[_i];
            if (x.id !== view.model.id) _results.push(x);
          }
          return _results;
        }).call(_this);
        _this.mset('children', newchildren);
        return null;
      };
      return callback;
    };

    InteractiveContextView.prototype.build_children = function() {
      var created_views, model, spec, view, _i, _j, _len, _len2, _ref;
      _ref = this.mget('children');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        spec = _ref[_i];
        model = this.model.resolve_ref(spec);
        model.set({
          'usedialog': true
        });
      }
      created_views = build_views(this.model, this.views, this.mget('children'));
      for (_j = 0, _len2 = created_views.length; _j < _len2; _j++) {
        view = created_views[_j];
        safebind(this, view, 'remove', this.generate_remove_child_callback(view));
      }
      return null;
    };

    InteractiveContextView.prototype.render_deferred_components = function(force) {
      var view, _i, _len, _ref, _results;
      InteractiveContextView.__super__.render_deferred_components.call(this, force);
      _ref = _.values(this.views);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        _results.push(view.render_deferred_components(force));
      }
      return _results;
    };

    InteractiveContextView.prototype.render = function() {
      InteractiveContextView.__super__.render.call(this);
      this.build_children();
      return null;
    };

    return InteractiveContextView;

  })(DeferredParent);

  InteractiveContext = (function(_super) {

    __extends(InteractiveContext, _super);

    function InteractiveContext() {
      InteractiveContext.__super__.constructor.apply(this, arguments);
    }

    InteractiveContext.prototype.type = 'InteractiveContext';

    InteractiveContext.prototype.default_view = InteractiveContextView;

    InteractiveContext.prototype.defaults = {
      children: [],
      width: $(window).width(),
      height: $(window).height(),
      render_loop: true
    };

    return InteractiveContext;

  })(Component);

  InteractiveContexts = (function(_super) {

    __extends(InteractiveContexts, _super);

    function InteractiveContexts() {
      InteractiveContexts.__super__.constructor.apply(this, arguments);
    }

    InteractiveContexts.prototype.model = InteractiveContext;

    return InteractiveContexts;

  })(Backbone.Collection);

  Continuum.register_collection('Table', new Tables());

  Continuum.register_collection('InteractiveContext', new InteractiveContexts());

  Continuum.register_collection('DataTable', new DataTables());

  Continuum.register_collection('CDXPlotContext', new CDXPlotContexts());

  Continuum.ContinuumView = ContinuumView;

  Continuum.HasProperties = HasProperties;

  Continuum.HasParent = HasParent;

  Continuum.Component = Component;

  Continuum.safebind = safebind;

}).call(this);
