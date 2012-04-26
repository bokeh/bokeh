(function() {
  var Collections, Continuum, ContinuumView, HasProperties, HasReference, Table, TableView, Tables,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (this.Continuum) {
    Continuum = this.Continuum;
  } else {
    Continuum = {};
    this.Continuum = Continuum;
  }

  Collections = {};

  Continuum.Collections = Collections;

  Continuum.register_collection = function(key, value) {
    Collections[key] = value;
    return value.bokeh_key = key;
  };

  HasProperties = (function(_super) {

    __extends(HasProperties, _super);

    function HasProperties() {
      HasProperties.__super__.constructor.apply(this, arguments);
    }

    HasProperties.prototype.initialize = function(attrs, options) {
      HasProperties.__super__.initialize.call(this, attrs, options);
      this.properties = {};
      this.dependencies = new buckets.MultiDictionary;
      return this.property_cache = {};
    };

    HasProperties.prototype.register_property = function(prop_name, dependencies, property, use_cache) {
      var dep, prop_spec, _i, _len, _results,
        _this = this;
      if (_.has(this.properties, prop_name)) this.remove_property(prop_name);
      prop_spec = {
        'property': property,
        'dependencies': dependencies,
        'use_cache': use_cache,
        'invalidate_cache_callback': function() {
          return _this.clear_cache(prop_name);
        }
      };
      this.properties[prop_name] = prop_spec;
      _results = [];
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        this.dependencies.set(dep, prop_name);
        if (prop_spec.use_cache) {
          _results.push(this.on("change:" + dep, this.properties[prop_name].invalidate_cache_callback));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    HasProperties.prototype.remove_property = function(prop_name) {
      var dep, dependencies, prop_spec, _i, _len;
      prop_spec = this.properties[prop_name];
      dependencies = prop_spec.dependencies;
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        this.dependencies.remove(dep, prop_name);
        if (prop_spec.use_cache) {
          this.off("change:" + dep, prop_spec['invalidate_cache_callback']);
        }
      }
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
      var computed, dependencies, prop_spec, property, x;
      if (_.has(this.properties, prop_name)) {
        prop_spec = this.properties[prop_name];
        if (prop_spec.use_cache && this.has_cache(prop_name)) {
          return this.property_cache[prop_name];
        } else {
          dependencies = prop_spec.dependencies;
          property = prop_spec.property;
          dependencies = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
              x = dependencies[_i];
              _results.push(this.get(x));
            }
            return _results;
          }).call(this);
          computed = property.apply(this, dependencies);
          if (this.properties[prop_name].use_cache) {
            this.add_cache(prop_name, computed);
          }
          return computed;
        }
      } else {
        return HasProperties.__super__.get.call(this, prop_name);
      }
    };

    return HasProperties;

  })(Backbone.Model);

  HasReference = (function(_super) {

    __extends(HasReference, _super);

    function HasReference() {
      HasReference.__super__.constructor.apply(this, arguments);
    }

    HasReference.prototype.type = null;

    HasReference.prototype.initialize = function(attrs, options) {
      HasReference.__super__.initialize.call(this, attrs, options);
      if (!_.has(attrs, 'id')) {
        this.id = _.uniqueId(this.type);
        return this.attributes['id'] = this.id;
      }
    };

    HasReference.prototype.ref = function() {
      return {
        'type': this.type,
        'id': this.id
      };
    };

    HasReference.prototype.resolve_ref = function(ref) {
      return Collections[ref['type']].get(ref['id']);
    };

    HasReference.prototype.get_ref = function(ref_name) {
      var ref;
      ref = this.get(ref_name);
      if (ref) return this.resolve_ref(ref);
    };

    return HasReference;

  })(HasProperties);

  ContinuumView = (function(_super) {

    __extends(ContinuumView, _super);

    function ContinuumView() {
      ContinuumView.__super__.constructor.apply(this, arguments);
    }

    ContinuumView.prototype.initialize = function(options) {
      if (!_.has(options, 'id')) return this.id = _.uniqueId('ContinuumView');
    };

    ContinuumView.prototype.remove = function() {
      this.model.off(null, null, this);
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

    ContinuumView.prototype.mget = function(fld) {
      return this.model.get(fld);
    };

    ContinuumView.prototype.mget_ref = function(fld) {
      return this.model.get_ref(fld);
    };

    return ContinuumView;

  })(Backbone.View);

  TableView = (function(_super) {

    __extends(TableView, _super);

    function TableView() {
      TableView.__super__.constructor.apply(this, arguments);
    }

    TableView.prototype.delegateEvents = function() {
      this.model.on('destroy', this.remove, this);
      return this.model.on('change', this.render, this);
    };

    TableView.prototype.render = function() {
      var column, data, elem, headerrow, idx, row, row_elem, rownum, _i, _len, _len2, _len3, _ref, _ref2, _ref3,
        _this = this;
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
      if (!this.$el.is(":visible")) {
        return this.$el.dialog({
          close: function() {
            return _this.remove();
          }
        });
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

    Table.prototype.initialize = function(attrs, options) {
      Table.__super__.initialize.call(this, attrs, options);
      this.register_property('offset', ['data_slice'], function(data_slice) {
        return data_slice[0];
      }, false);
      return this.register_property('chunksize', ['data_slice'], function(data_slice) {
        return data_slice[1] - data_slice[0];
      }, false);
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
      this.set('data_slice', [offset, offset + this.get('chunksize')], {
        silent: true
      });
      return $.get(this.get('url'), {
        'data_slice': JSON.stringify(this.get('data_slice'))
      }, function(data) {
        return _this.set({
          'data': JSON.parse(data)['data']
        });
      });
    };

    return Table;

  })(HasReference);

  Tables = (function(_super) {

    __extends(Tables, _super);

    function Tables() {
      Tables.__super__.constructor.apply(this, arguments);
    }

    Tables.prototype.model = Table;

    Tables.prototype.url = "/";

    return Tables;

  })(Backbone.Collection);

  Continuum.register_collection('Table', new Tables());

}).call(this);
