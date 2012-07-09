var CDXPlotContextView, Continuum, DataTableView, InteractiveContextView, TableView,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

if (this.Continuum) {
  Continuum = this.Continuum;
} else {
  Continuum = {};
  this.Continuum = Continuum;
}

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
    var colname, datacell, datacell_template, header, header_column, header_template, html, row, row_template, rowdata, table, table_template, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
    table_template = "<table class='table table-striped table-bordered table-condensed' id='{{ tableid }}'></table>";
    table_template = "<table class='table table-striped table-bordered table-condensed' id='tableid_na'></table>";
    header_template = "<thead id ='header_id_na'></thead>";
    header_column = "<th><a href=\"javascript:cdxSortByColumn()\" class='link'>{{column_name}}</a></th>";
    row_template = "<tr></tr>";
    datacell_template = "<td>{{data}}</td>";
    header = $(header_template);
    _ref = this.mget('columns');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      colname = _ref[_i];
      html = _.template(header_column, {
        'column_name': colname
      });
      header.append($(html));
    }
    table = $(table_template);
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
      elem = $("<th class='tableelem tableheader'>" + column + "/th>");
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
        elem = $("<td class='tableelem'>" + data + "</td>");
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
