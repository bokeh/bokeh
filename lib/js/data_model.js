var CDXPlotContext, CDXPlotContexts, DataTable, DataTables, InteractiveContext, InteractiveContexts, Table, Tables,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

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
