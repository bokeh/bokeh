(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "common/collection", "common/has_properties"], function(_, $, Collection, HasProperties) {
    var TableColumn, TableColumns, _ref, _ref1;
    TableColumn = (function(_super) {
      __extends(TableColumn, _super);

      function TableColumn() {
        _ref = TableColumn.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TableColumn.prototype.type = 'TableColumn';

      TableColumn.prototype.default_view = null;

      return TableColumn;

    })(HasProperties);
    TableColumns = (function(_super) {
      __extends(TableColumns, _super);

      function TableColumns() {
        _ref1 = TableColumns.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      TableColumns.prototype.model = TableColumn;

      return TableColumns;

    })(Collection);
    return {
      Model: TableColumn,
      Collection: new TableColumns()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=table_column.js.map
*/