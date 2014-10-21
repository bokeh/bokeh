(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "jquery_ui/sortable", "bootstrap/dropdown", "common/collection", "common/has_parent", "common/has_properties", "common/continuum_view"], function(_, $, $$1, $$2, Collection, HasParent, HasProperties, ContinuumView) {
    var PivotTable, PivotTableView, PivotTables, _ref, _ref1, _ref2;
    PivotTableView = (function(_super) {
      __extends(PivotTableView, _super);

      function PivotTableView() {
        this.getAggregator = __bind(this.getAggregator, this);
        _ref = PivotTableView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PivotTableView.prototype.initialize = function(options) {
        PivotTableView.__super__.initialize.call(this, options);
        this.listenTo(this.model, 'destroy', this.remove);
        this.listenTo(this.model, 'change', this.rerenderToolbox);
        this.listenTo(this.model, 'change:data', this.rerenderPivotTable);
        return this.render();
      };

      PivotTableView.prototype.mpush = function(attr, value) {
        return this.mset(attr, this.mget(attr).concat([value]));
      };

      PivotTableView.prototype.mupdate = function(attr, fn) {
        var value,
          _this = this;
        value = _.map(this.mget(attr), function(item) {
          return _.clone(item);
        });
        fn(value);
        return this.mset(attr, value);
      };

      PivotTableView.prototype.fieldNames = function() {
        var field, _i, _len, _ref1, _results;
        _ref1 = this.mget("fields");
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          field = _ref1[_i];
          _results.push(field.name);
        }
        return _results;
      };

      PivotTableView.prototype.fieldDTypes = function() {
        var field, _i, _len, _ref1, _results;
        _ref1 = this.mget("fields");
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          field = _ref1[_i];
          _results.push(field.dtype);
        }
        return _results;
      };

      PivotTableView.prototype.getDType = function(fieldName) {
        return _.find(this.mget("fields"), function(field) {
          return field.name === fieldName;
        }).dtype;
      };

      PivotTableView.prototype.render = function() {
        var html;
        html = $('<table class="bk-pivot"></table>');
        this.$description = $('<td class="bk-pivot-description" valign="center"></td>');
        this.$toolbox = $('<td class="bk-pivot-toolbox" valign="top"></td>');
        this.$pivot = $('<td class="bk-pivot-table" valign="top"></td>');
        this.$description.html(this.renderDescription());
        this.$toolbox.html(this.renderToolbox());
        this.$pivot.html(this.renderWait());
        html.append([$('<tr></tr>').append(this.$desciption), $('<tr></tr>').append([this.$toolbox, this.$pivot])]);
        this.$el.html(html);
        return this.delayRenderPivotTable();
      };

      PivotTableView.prototype.renderWait = function() {
        return $('<span class="bk-wait">Rendering ...</span>');
      };

      PivotTableView.prototype.rerenderPivotTable = function() {
        this.$pivot.html(this.renderWait());
        return this.delayRenderPivotTable();
      };

      PivotTableView.prototype.delayRenderPivotTable = function() {
        var _this = this;
        return _.delay((function() {
          return _this.$pivot.html(_this.renderPivotTable());
        }), 50);
      };

      PivotTableView.prototype.rerenderToolbox = function() {
        return this.$toolbox.html(this.renderToolbox());
      };

      PivotTableView.prototype.renderToolbox = function() {
        var toolbox;
        toolbox = $('<ul></ul>');
        toolbox.append(this.renderRows());
        toolbox.append(this.renderColumns());
        toolbox.append(this.renderValues());
        toolbox.append(this.renderFilters());
        toolbox.append(this.renderUpdate());
        return toolbox;
      };

      PivotTableView.prototype.renderAdd = function(exclude, handler) {
        var button, dropdown;
        dropdown = $('<div class="bk-bs-dropdown bk-bs-pull-right"></div>');
        button = $('<button class="bk-bs-btn bk-bs-btn-link bk-bs-btn-xs" data-bk-bs-toggle="dropdown">Add</button>');
        dropdown.append([button.dropdown(), this.renderFields(exclude, handler)]);
        return dropdown;
      };

      PivotTableView.prototype.renderFields = function(exclude, handler) {
        var fields, items, menu;
        fields = _.difference(this.fieldNames(), exclude);
        menu = $('<ul class="bk-bs-dropdown-menu"></ul>');
        items = _.map(fields, function(field) {
          var item, link;
          link = $('<a tabindex="-1" href="javascript://"></a>');
          link.text(field);
          item = $('<li></li>');
          return item.append(link);
        });
        menu.append(items);
        return menu.click(function(event) {
          return handler($(event.target).text());
        });
      };

      PivotTableView.prototype.renderRemove = function(attr, field) {
        var handler,
          _this = this;
        handler = function(event) {
          return _this.mset(attr, _.reject(_this.mget(attr), function(item) {
            return item.field === field;
          }));
        };
        return $('<span class="bk-bs-close bk-bs-pull-right">&times;</span>').click(handler);
      };

      PivotTableView.prototype.renderOptions = function(options, value, handler) {
        var button, dropdown, items, menu, text,
          _this = this;
        menu = $('<ul class="bk-bs-dropdown-menu"></ul>');
        items = _.map(options, function(option) {
          var item, link;
          link = $('<a tabindex="-1" href="javascript://"></a>');
          link.text(option);
          item = $('<li></li>');
          return item.append(link);
        });
        menu.append(items);
        menu.click(function(event) {
          return handler($(event.target).text());
        });
        dropdown = $('<span class="bk-bs-dropdown"></span>');
        button = $('<button class="bk-bs-btn bk-bs-btn-link bk-bs-btn-xs" data-bk-bs-toggle="dropdown"></button>');
        text = typeof value === 'number' ? options[value] : value;
        button.text(text);
        button.append('&nbsp;');
        button.append($('<span class="bk-bs-caret"></span>'));
        return dropdown.append([button.dropdown(), menu]);
      };

      PivotTableView.prototype.makeSortable = function(attr, $el) {
        var _this = this;
        return $el.sortable({
          handle: ".bk-pivot-box-header",
          axis: "y",
          distance: 10
        }).on('sortstop', function(ui) {
          var child, fields;
          fields = (function() {
            var _i, _len, _ref1, _results;
            _ref1 = $el.children();
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              child = _ref1[_i];
              _results.push($(child).data('bk-field'));
            }
            return _results;
          })();
          return _this.mset(attr, _.sortBy(_this.mget(attr), function(item) {
            return fields.indexOf(item.field);
          }));
        });
      };

      PivotTableView.prototype.renderFieldName = function(field) {
        return $('<span class="bk-field"></span').text(field);
      };

      PivotTableView.prototype.renderDType = function(field) {
        return $('<span class="bk-dtype"></span').text('(' + this.getDType(field) + ')');
      };

      PivotTableView.prototype.defaultRowColumn = function(field) {
        return {
          field: field,
          order: "ascending",
          sort_by: field,
          totals: true
        };
      };

      PivotTableView.prototype.usedFields = function() {
        return _.map(this.mget("rows").concat(this.mget("columns")), function(item) {
          return item.field;
        });
      };

      PivotTableView.prototype.renderRows = function() {
        var $rows, add, el, header,
          _this = this;
        el = $("<li></li>");
        header = $("<div>Rows</div>");
        add = this.renderAdd(this.usedFields(), function(field) {
          return _this.mpush("rows", _this.defaultRowColumn(field));
        });
        header.append(add);
        $rows = $('<ul></ul>');
        _.each(this.mget("rows"), function(row, index) {
          var $dtype, $field, $remove, $row, groupBy, order, sortBy, totals;
          groupBy = $('<li class="bk-pivot-box-header">Group by:</li>');
          $field = _this.renderFieldName(row.field);
          $dtype = _this.renderDType(row.field);
          $remove = _this.renderRemove("rows", row.field);
          groupBy.append(["&nbsp;", $field, "&nbsp;", $dtype, $remove]);
          order = $('<li>Order:&nbsp;</li>');
          order.append(_this.renderOptions(["ascending", "descending"], row.order, function(value) {
            return _this.mupdate("rows", function(rows) {
              return rows[index].order = value;
            });
          }));
          sortBy = $('<li>Sort by:&nbsp;</li>');
          sortBy.append(_this.renderOptions([row.field], row.sort_by, function(value) {
            return _this.mupdate("rows", function(rows) {
              return rows[index].sort_by = value;
            });
          }));
          totals = $('<li>Totals:&nbsp;</li>');
          totals.append(_this.renderOptions(["on", "off"], (row.totals ? 0 : 1), function(value) {
            return _this.mupdate("rows", function(rows) {
              return rows[index].totals = value === "on" ? true : false;
            });
          }));
          $row = $('<ul class="bk-pivot-box"></ul>');
          $row.data('bk-field', row.field);
          $row.append([groupBy, order, sortBy, totals]);
          return $rows.append($row);
        });
        this.makeSortable("rows", $rows);
        return el.append([header, $rows]);
      };

      PivotTableView.prototype.renderColumns = function() {
        var $columns, add, el, header,
          _this = this;
        el = $("<li></li>");
        header = $("<div>Columns</div>");
        add = this.renderAdd(this.usedFields(), function(field) {
          return _this.mpush("columns", _this.defaultRowColumn(field));
        });
        header.append(add);
        $columns = $('<ul></ul>');
        _.each(this.mget("columns"), function(column, index) {
          var $column, $dtype, $field, $remove, groupBy, order, sortBy, totals;
          groupBy = $('<li class="bk-pivot-box-header">Group by:</li>');
          $field = _this.renderFieldName(column.field);
          $dtype = _this.renderDType(column.field);
          $remove = _this.renderRemove("columns", column.field);
          groupBy.append(["&nbsp;", $field, "&nbsp;", $dtype, $remove]);
          order = $('<li>Order:&nbsp;</li>');
          order.append(_this.renderOptions(["ascending", "descending"], column.order, function(value) {
            return _this.mupdate("columns", function(columns) {
              return columns[index].order = value;
            });
          }));
          sortBy = $('<li>Sort by:&nbsp;</li>');
          sortBy.append(_this.renderOptions([column.field], column.sort_by, function(value) {
            return _this.mupdate("columns", function(columns) {
              return columns[index].sort_by = value;
            });
          }));
          totals = $('<li>Totals:&nbsp;</li>');
          totals.append(_this.renderOptions(["on", "off"], (column.totals ? 0 : 1), function(value) {
            return _this.mupdate("columns", function(columns) {
              return columns[index].totals = value === "on" ? true : false;
            });
          }));
          $column = $('<ul class="bk-pivot-box"></ul>');
          $column.data('bk-field', column.field);
          $column.append([groupBy, order, sortBy, totals]);
          return $columns.append($column);
        });
        this.makeSortable("columns", $columns);
        return el.append([header, $columns]);
      };

      PivotTableView.prototype.defaultValue = function(field) {
        return {
          field: field,
          aggregate: "count",
          renderer: "default",
          formatter: "none"
        };
      };

      PivotTableView.prototype.renderValues = function() {
        var $values, add, el, header,
          _this = this;
        el = $("<li></li>");
        header = $("<div>Values</div>");
        add = this.renderAdd([], function(field) {
          return _this.mpush("values", _this.defaultValue(field));
        });
        header.append(add);
        $values = $('<ul></ul>');
        _.each(this.mget("values"), function(value, index) {
          var $dtype, $field, $remove, $value, aggregate, display, formatter, renderer;
          display = $('<li class="bk-pivot-box-header">Display:</li>');
          $field = _this.renderFieldName(value.field);
          $dtype = _this.renderDType(value.field);
          $remove = _this.renderRemove("values", value.field);
          display.append(["&nbsp;", $field, "&nbsp;", $dtype, $remove]);
          aggregate = $('<li>Aggregate:&nbsp;</li>');
          aggregate.append(_this.renderOptions(_this.model.aggregates, value.aggregate, function(aggregate) {
            return _this.mupdate("values", function(values) {
              return values[index].aggregate = aggregate;
            });
          }));
          renderer = $('<li>Renderer:&nbsp;</li>');
          renderer.append(_this.renderOptions(_this.model.renderers, value.renderer, function(renderer) {
            return _this.mupdate("values", function(values) {
              return values[index].renderer = renderer;
            });
          }));
          formatter = $('<li>Formatter:&nbsp;</li>');
          formatter.append(_this.renderOptions(_this.model.formatters, value.formatter, function(formatter) {
            return _this.mupdate("values", function(values) {
              return values[index].formatter = formatter;
            });
          }));
          $value = $('<ul class="bk-pivot-box"></ul>');
          $value.data('bk-field', value.field);
          $value.append([display, aggregate, renderer, formatter]);
          return $values.append($value);
        });
        this.makeSortable("values", $values);
        return el.append([header, $values]);
      };

      PivotTableView.prototype.defaultFilter = function(field) {
        return {
          field: field
        };
      };

      PivotTableView.prototype.renderFilters = function() {
        var $filters, add, el, header,
          _this = this;
        el = $("<li></li>");
        header = $("<div>Filters</div>");
        add = this.renderAdd([], function(field) {
          return _this.mpush("filters", _this.defaultFilter(field));
        });
        header.append(add);
        $filters = $('<ul></ul>');
        _.each(this.mget("filters"), function(filter) {
          var $dtype, $field, $filter, $remove, display;
          display = $('<li class="bk-pivot-box-header">Filter:</li>');
          $field = _this.renderFieldName(filter.field);
          $dtype = _this.renderDType(filter.field);
          $remove = _this.renderRemove("filters", filter.field);
          display.append(["&nbsp;", $field, "&nbsp;", $dtype, $remove]);
          $filter = $('<ul class="bk-pivot-box"></ul>');
          $filter.data('bk-field', filter.field);
          $filter.append([display]);
          return $filters.append($filter);
        });
        this.makeSortable("filters", $filters);
        return el.append([header, $filters]);
      };

      PivotTableView.prototype.renderUpdate = function() {
        var button, el, manual_update, update,
          _this = this;
        manual_update = this.mget("manual_update");
        el = $("<li></li>");
        update = $('<div>Update:&nbsp;</div>');
        update.append(this.renderOptions(["Manual", "Automatic"], (manual_update ? 0 : 1), function(value) {
          return _this.mset("manual_update", value === "Manual" ? true : false);
        }));
        el.append(update);
        if (manual_update) {
          button = $('<button type="button" class="bk-bs-btn bk-bs-btn-primary">Update</button>');
          button.click(function(event) {
            return _this.model.save();
          });
          el.append(button);
        }
        return el;
      };

      PivotTableView.prototype.renderDescription = function() {
        return $('<div></div>').text(this.mget("description"));
      };

      PivotTableView.prototype.spanSize = function(arr, i, j) {
        var len, noDraw, stop, x, _i, _j;
        if (i !== 0) {
          noDraw = true;
          for (x = _i = 0; 0 <= j ? _i <= j : _i >= j; x = 0 <= j ? ++_i : --_i) {
            if (arr[i - 1][x] !== arr[i][x]) {
              noDraw = false;
            }
          }
          if (noDraw) {
            return -1;
          }
        }
        len = 0;
        while (i + len < arr.length) {
          stop = false;
          for (x = _j = 0; 0 <= j ? _j <= j : _j >= j; x = 0 <= j ? ++_j : --_j) {
            if (arr[i][x] !== arr[i + len][x]) {
              stop = true;
            }
          }
          if (stop) {
            break;
          }
          len++;
        }
        return len;
      };

      PivotTableView.prototype.getAggregator = function(rowKey, colKey) {
        var col, data, row, value;
        data = this.mget("data");
        row = data.rows.indexOf(rowKey);
        col = data.cols.indexOf(colKey);
        if (row === -1) {
          row = data.rows.length - 1;
        }
        if (col === -1) {
          col = data.cols.length - 1;
        }
        if (row === -1 || col === -1) {
          value = null;
        } else {
          value = data.values[row][col];
        }
        return {
          value: (function() {
            return value;
          }),
          format: (function(value) {
            return "" + value;
          })
        };
      };

      PivotTableView.prototype.renderPivotTable = function() {
        var aggregator, c, colAttrs, colKey, colKeys, i, j, r, result, rowAttrs, rowKey, rowKeys, th, totalAggregator, tr, txt, val, x;
        rowAttrs = this.mget("rows");
        colAttrs = this.mget("columns");
        rowKeys = this.mget("data").rows;
        colKeys = this.mget("data").cols;
        result = $("<table class='bk-pivot-table pvtTable'>");
        for (j in colAttrs) {
          if (!__hasProp.call(colAttrs, j)) continue;
          c = colAttrs[j];
          tr = $("<tr>");
          if (parseInt(j) === 0 && rowAttrs.length !== 0) {
            tr.append($("<th>").attr("colspan", rowAttrs.length).attr("rowspan", colAttrs.length));
          }
          tr.append($("<th class='pvtAxisLabel'>").text(c.field));
          for (i in colKeys) {
            if (!__hasProp.call(colKeys, i)) continue;
            colKey = colKeys[i];
            x = this.spanSize(colKeys, parseInt(i), parseInt(j));
            if (x !== -1) {
              th = $("<th class='pvtColLabel'>").text(colKey[j]).attr("colspan", x);
              if (parseInt(j) === colAttrs.length - 1 && rowAttrs.length !== 0) {
                th.attr("rowspan", 2);
              }
              tr.append(th);
            }
          }
          if (parseInt(j) === 0) {
            tr.append($("<th class='pvtTotalLabel'>").text("Totals").attr("rowspan", colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)));
          }
          result.append(tr);
        }
        if (rowAttrs.length !== 0) {
          tr = $("<tr>");
          for (i in rowAttrs) {
            if (!__hasProp.call(rowAttrs, i)) continue;
            r = rowAttrs[i];
            tr.append($("<th class='pvtAxisLabel'>").text(r.field));
          }
          th = $("<th>");
          if (colAttrs.length === 0) {
            th.addClass("pvtTotalLabel").text("Totals");
          }
          tr.append(th);
          result.append(tr);
        }
        for (i in rowKeys) {
          if (!__hasProp.call(rowKeys, i)) continue;
          rowKey = rowKeys[i];
          tr = $("<tr>");
          for (j in rowKey) {
            if (!__hasProp.call(rowKey, j)) continue;
            txt = rowKey[j];
            x = this.spanSize(rowKeys, parseInt(i), parseInt(j));
            if (x !== -1) {
              th = $("<th class='pvtRowLabel'>").text(txt).attr("rowspan", x);
              if (parseInt(j) === rowAttrs.length - 1 && colAttrs.length !== 0) {
                th.attr("colspan", 2);
              }
              tr.append(th);
            }
          }
          for (j in colKeys) {
            if (!__hasProp.call(colKeys, j)) continue;
            colKey = colKeys[j];
            aggregator = this.getAggregator(rowKey, colKey);
            val = aggregator.value();
            tr.append($("<td class='pvtVal row" + i + " col" + j + "'>").text(aggregator.format(val)).data("value", val));
          }
          totalAggregator = this.getAggregator(rowKey, []);
          val = totalAggregator.value();
          tr.append($("<td class='pvtTotal rowTotal'>").text(totalAggregator.format(val)).data("value", val).data("for", "row" + i));
          result.append(tr);
        }
        tr = $("<tr>");
        th = $("<th class='pvtTotalLabel'>").text("Totals");
        th.attr("colspan", rowAttrs.length + (colAttrs.length === 0 ? 0 : 1));
        tr.append(th);
        for (j in colKeys) {
          if (!__hasProp.call(colKeys, j)) continue;
          colKey = colKeys[j];
          totalAggregator = this.getAggregator([], colKey);
          val = totalAggregator.value();
          tr.append($("<td class='pvtTotal colTotal'>").text(totalAggregator.format(val)).data("value", val).data("for", "col" + j));
        }
        totalAggregator = this.getAggregator([], []);
        val = totalAggregator.value();
        tr.append($("<td class='pvtGrandTotal'>").text(totalAggregator.format(val)).data("value", val));
        result.append(tr);
        return result;
      };

      return PivotTableView;

    })(ContinuumView);
    PivotTable = (function(_super) {
      __extends(PivotTable, _super);

      function PivotTable() {
        _ref1 = PivotTable.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PivotTable.prototype.default_view = PivotTableView;

      PivotTable.prototype.type = "PivotTable";

      PivotTable.prototype.defaults = function() {
        return _.extend({}, PivotTable.__super__.defaults.call(this), {
          title: "Pivot Table",
          description: "",
          source: null,
          data: {},
          fields: [],
          rows: [],
          columns: [],
          values: [],
          filters: [],
          manual_update: true
        });
      };

      PivotTable.prototype.aggregates = ["count", "counta", "countunique", "average", "max", "min", "median", "sum", "product", "stdev", "stdevp", "var", "varp"];

      PivotTable.prototype.renderers = ["default", "heatmap"];

      PivotTable.prototype.formatters = ["none"];

      PivotTable.prototype.mset = function() {
        if (this.get("manual_update")) {
          return this.set.apply(this, arguments);
        } else {
          return this.save.apply(this, arguments);
        }
      };

      return PivotTable;

    })(HasParent);
    PivotTables = (function(_super) {
      __extends(PivotTables, _super);

      function PivotTables() {
        _ref2 = PivotTables.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PivotTables.prototype.model = PivotTable;

      return PivotTables;

    })(Collection);
    return {
      Model: PivotTable,
      Collection: new PivotTables(),
      View: PivotTableView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=pivot_table.js.map
*/