(function() {
  var Collections, Continuum, ContinuumView, Table, TableView, Tables,
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
      this.model.on('destroy', this.remove);
      return this.model.on('change', this.render);
    };

    TableView.prototype.render = function() {
      var column, data, elem, headerrow, idx, row, row_elem, _i, _len, _len2, _len3, _ref, _ref2,
        _this = this;
      this.$el.empty();
      this.$el.append("<table></table>");
      this.$el.find('table').append("<tr></tr>");
      headerrow = $(this.$el.find('table').find('tr')[0]);
      _ref = this.mget('columns');
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
        for (_i = 0, _len3 = row.length; _i < _len3; _i++) {
          data = row[_i];
          elem = $(_.template("<td class='tableelem'>{{val}}</td>", {
            'val': data
          }));
          row_elem.append(elem);
        }
        this.$el.find('table').append(row_elem);
      }
      if (!this.$el.is(":visible")) {
        return this.$el.dialog({
          close: function() {
            return _this.remove();
          }
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

    Table.prototype.defaults = {
      columns: [],
      data: [[]]
    };

    Table.prototype.default_view = TableView;

    return Table;

  })(Backbone.Model);

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
