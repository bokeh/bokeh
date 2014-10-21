(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "handsontable", "common/collection", "common/has_properties", "common/continuum_view"], function(_, $, $$1, Collection, HasProperties, ContinuumView) {
    var HandsonTable, HandsonTableView, HandsonTables, _ref, _ref1, _ref2;
    HandsonTableView = (function(_super) {
      __extends(HandsonTableView, _super);

      function HandsonTableView() {
        _ref = HandsonTableView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HandsonTableView.prototype.initialize = function(options) {
        var source,
          _this = this;
        HandsonTableView.__super__.initialize.call(this, options);
        this.render();
        this.listenTo(this.model, 'change', function() {
          return _this.renderFn();
        });
        source = this.mget("source");
        this.listenTo(source, 'change:data', function() {
          return _this.renderFn();
        });
        return this.listenTo(source, 'change:selection', function() {
          return _this.changeSelection();
        });
      };

      HandsonTableView.prototype.changeSelection = function() {
        var i, j, n, selection;
        this.ht.deselectCell();
        selection = this.mget("source").get("selected");
        i = _.min(selection);
        j = _.max(selection);
        n = this.ht.countCols();
        return this.ht.selectCell(i, 0, j, n - 1, true);
      };

      HandsonTableView.prototype.renderFn = function() {
        var col_widths, column, columns, header, headers, source, width, widths, _i, _len, _ref1,
          _this = this;
        source = this.mget("source");
        if (source != null) {
          headers = [];
          widths = [];
          columns = [];
          _ref1 = this.mget("columns");
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            column = _ref1[_i];
            if (column != null) {
              header = column.get("header");
              width = column.get("width");
              headers.push(header != null ? header : void 0);
              widths.push(width != null ? width : void 0);
              columns.push({
                data: column.get("field"),
                type: column.get("type"),
                format: column.get("format"),
                source: column.get("source"),
                strict: column.get("strict"),
                checkedTemplate: column.get("checked"),
                uncheckedTemplate: column.get("unchecked")
              });
            }
          }
          if (this.mget("columns_width") != null) {
            col_widths = this.mget("columns_width");
          } else if (_.filter(widths, function(x) {
            return x != null;
          }).length !== 0) {
            col_widths = widths;
          } else {
            col_widths = void 0;
          }
          this.$el.handsontable({
            data: source.datapoints(),
            width: this.mget("width"),
            height: this.mget("height"),
            columns: columns,
            colWidths: col_widths,
            columnSorting: this.mget("sorting"),
            rowHeaders: this.mget("row_headers"),
            colHeaders: this.mget("column_headers") ? headers : false,
            manualRowResize: this.mget("row_resize"),
            manualColumnResize: this.mget("column_resize"),
            afterChange: function(changes, source) {
              if (source === "edit") {
                return _this.editData(changes);
              }
            }
          });
        } else {
          this.$el.handsontable();
        }
        return this.ht = this.$el.handsontable("getInstance");
      };

      HandsonTableView.prototype.render = function() {
        var handler, interval,
          _this = this;
        handler = function() {
          if ($.contains(document.documentElement, _this.el)) {
            clearInterval(interval);
            return _this.renderFn();
          }
        };
        return interval = setInterval(handler, 50);
      };

      HandsonTableView.prototype.editData = function(changes) {
        var array, change, column, data, i, index, new_val, old_val, source, _i, _j, _len, _ref1;
        source = this.mget("source");
        data = source.get("data");
        for (_i = 0, _len = changes.length; _i < _len; _i++) {
          change = changes[_i];
          index = change[0], column = change[1], old_val = change[2], new_val = change[3];
          array = _.clone(data[column]);
          if (index < array.length) {
            array[index] = new_val;
          } else {
            for (i = _j = 0, _ref1 = array.length - index; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
              array.push(NaN);
            }
            array.push(new_val);
          }
          data[column] = array;
        }
        return source.set(data);
      };

      return HandsonTableView;

    })(ContinuumView);
    HandsonTable = (function(_super) {
      __extends(HandsonTable, _super);

      function HandsonTable() {
        _ref1 = HandsonTable.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      HandsonTable.prototype.type = 'HandsonTable';

      HandsonTable.prototype.default_view = HandsonTableView;

      HandsonTable.prototype.defaults = function() {
        return _.extend({}, HandsonTable.__super__.defaults.call(this), {
          source: null,
          width: null,
          height: null,
          columns: [],
          columns_width: null,
          sorting: true,
          row_headers: true,
          column_headers: true,
          row_resize: false,
          column_resize: false
        });
      };

      return HandsonTable;

    })(HasProperties);
    HandsonTables = (function(_super) {
      __extends(HandsonTables, _super);

      function HandsonTables() {
        _ref2 = HandsonTables.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      HandsonTables.prototype.model = HandsonTable;

      return HandsonTables;

    })(Collection);
    return {
      Model: HandsonTable,
      Collection: new HandsonTables(),
      View: HandsonTableView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=handson_table.js.map
*/