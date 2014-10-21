(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/has_parent", "common/continuum_view", "./data_table_template"], function(_, Collection, HasParent, ContinuumView, data_table_template) {
    var DataTable, DataTableView, DataTables, ENTER, _ref, _ref1, _ref2;
    ENTER = 13;
    DataTableView = (function(_super) {
      __extends(DataTableView, _super);

      function DataTableView() {
        this.colors = __bind(this.colors, this);
        this.go_last = __bind(this.go_last, this);
        this.go_next = __bind(this.go_next, this);
        this.go_prev = __bind(this.go_prev, this);
        this.go_first = __bind(this.go_first, this);
        this.toggle_more_controls = __bind(this.toggle_more_controls, this);
        this.sort = __bind(this.sort, this);
        this.rowclick = __bind(this.rowclick, this);
        this.toggle_filterselected = __bind(this.toggle_filterselected, this);
        this.clearselected = __bind(this.clearselected, this);
        this.computedtxtbox = __bind(this.computedtxtbox, this);
        this.column_del = __bind(this.column_del, this);
        this.search = __bind(this.search, this);
        _ref = DataTableView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DataTableView.prototype.template = data_table_template;

      DataTableView.prototype.initialize = function(options) {
        DataTableView.__super__.initialize.call(this, options);
        this.listenTo(this.model, 'destroy', this.remove);
        this.listenTo(this.model, 'change', this.render);
        return this.render();
      };

      DataTableView.prototype.events = {
        "keyup .pandasgroup": 'pandasgroup',
        "keyup .pandasoffset": 'pandasoffset',
        "keyup .pandassize": 'pandassize',
        "change .pandasagg": 'pandasagg',
        "click .cdx-go-first": 'go_first',
        "click .cdx-go-prev": 'go_prev',
        "click .cdx-go-next": 'go_next',
        "click .cdx-go-last": 'go_last',
        "click .controlsmore": 'toggle_more_controls',
        "click .cdx-column-sort": 'sort',
        "click .pandasrow": 'rowclick',
        "click .filterselected": 'toggle_filterselected',
        "click .clearselected": 'clearselected',
        "keyup .computedtxtbox": 'computedtxtbox',
        "click .column_del": "column_del",
        "keyup .search": 'search'
      };

      DataTableView.prototype.search = function(e) {
        var code, source;
        if (e.keyCode === ENTER) {
          code = $(e.currentTarget).val();
          source = this.model.get('source');
          source.rpc('search', [code]);
          return e.preventDefault();
        }
      };

      DataTableView.prototype.column_del = function(e) {
        var computed_columns, name, old, source;
        source = this.model.get('source');
        old = source.get('computed_columns');
        name = $(e.currentTarget).attr('name');
        computed_columns = _.filter(old, function(x) {
          return x.name !== name;
        });
        return source.rpc('set_computed_columns', [computed_columns]);
      };

      DataTableView.prototype.computedtxtbox = function(e) {
        var code, name, old, source;
        if (e.keyCode === ENTER) {
          name = this.$('.computedname').val();
          code = this.$('.computedtxtbox').val();
          source = this.model.get('source');
          old = source.get('computed_columns');
          old.push({
            name: name,
            code: code
          });
          source.rpc('set_computed_columns', [old]);
          return e.preventDefault();
        }
      };

      DataTableView.prototype.clearselected = function(e) {
        return this.model.rpc('setselect', [[]]);
      };

      DataTableView.prototype.toggle_filterselected = function(e) {
        var checked;
        checked = this.$('.filterselected').is(":checked");
        this.mset('filterselected', checked);
        return this.model.save();
      };

      DataTableView.prototype.rowclick = function(e) {
        var count, counts, idx, index, ratio, ratios, resp, rownum, select, selected;
        counts = this.counts();
        selected = this.selected();
        ratios = (function() {
          var _i, _len, _ref1, _ref2, _results;
          _ref1 = _.zip(selected, counts);
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            _ref2 = _ref1[_i], select = _ref2[0], count = _ref2[1];
            _results.push(select / count);
          }
          return _results;
        })();
        selected = (function() {
          var _i, _len, _results;
          _results = [];
          for (idx = _i = 0, _len = ratios.length; _i < _len; idx = ++_i) {
            ratio = ratios[idx];
            if (ratio > 0.5) {
              _results.push(idx);
            }
          }
          return _results;
        })();
        rownum = Number($(e.currentTarget).attr('rownum'));
        index = selected.indexOf(rownum);
        if (index === -1) {
          resp = this.model.rpc('select', [[rownum]]);
        } else {
          resp = this.model.rpc('deselect', [[rownum]]);
        }
        return null;
      };

      DataTableView.prototype.sort = function(event) {
        var column;
        column = $(event.currentTarget).parent().data("cdx-column");
        return this.model.toggle_column_sort(column);
      };

      DataTableView.prototype.toggle_more_controls = function() {
        if (this.controls_hide) {
          this.controls_hide = false;
        } else {
          this.controls_hide = true;
        }
        return this.render();
      };

      DataTableView.prototype.go_first = function() {
        return this.model.go_first();
      };

      DataTableView.prototype.go_prev = function() {
        return this.model.go_prev();
      };

      DataTableView.prototype.go_next = function() {
        return this.model.go_next();
      };

      DataTableView.prototype.go_last = function() {
        return this.model.go_last();
      };

      DataTableView.prototype.pandasoffset = function(e) {
        var offset;
        if (e.keyCode === ENTER) {
          offset = this.$el.find('.pandasoffset').val();
          offset = Number(offset);
          if (_.isNaN(offset)) {
            offset = this.model.defaults.offset;
          }
          this.model.save('offset', offset, {
            wait: true
          });
          return e.preventDefault();
        }
      };

      DataTableView.prototype.pandassize = function(e) {
        var size, sizetxt;
        if (e.keyCode === ENTER) {
          sizetxt = this.$el.find('.pandassize').val();
          size = Number(sizetxt);
          if (_.isNaN(size) || sizetxt === "") {
            size = this.model.defaults.length;
          }
          if (size + this.mget('offset') > this.mget('maxlength')) {
            size = this.mget('maxlength') - this.mget('offset');
          }
          this.model.save('length', size, {
            wait: true
          });
          return e.preventDefault();
        }
      };

      DataTableView.prototype.pandasagg = function() {
        return this.model.save('agg', this.$el.find('.pandasagg').val(), {
          'wait': true
        });
      };

      DataTableView.prototype.fromcsv = function(str) {
        if (!str) {
          return [];
        }
        return _.map(str.split(","), function(x) {
          return x.trim();
        });
      };

      DataTableView.prototype.pandasgroup = function(e) {
        if (e.keyCode === ENTER) {
          this.model.set({
            group: this.fromcsv(this.$el.find(".pandasgroup").val()),
            offset: 0
          });
          this.model.save();
          e.preventDefault();
          return false;
        }
      };

      DataTableView.prototype.counts = function() {
        return this.mget('tabledata').data._counts;
      };

      DataTableView.prototype.selected = function() {
        return this.mget('tabledata').data._selected;
      };

      DataTableView.prototype.colors = function() {
        var counts, selected;
        counts = this.counts();
        selected = this.selected();
        if (counts && selected) {
          return _.map(_.zip(counts, selected), function(temp) {
            var alpha, count;
            count = temp[0], selected = temp[1];
            alpha = 0.3 * selected / count;
            return "rgba(0,0,255," + alpha + ")";
          });
        } else {
          return null;
        }
      };

      DataTableView.prototype.render = function() {
        var colors, group, html, obj, sort, sort_ascendings, source, template_data, _i, _len, _ref1;
        group = this.mget('group');
        if (_.isArray(group)) {
          group = group.join(",");
        }
        sort = this.mget('sort');
        if (_.isArray(sort)) {
          sort = sort.join(",");
        }
        colors = this.colors();
        sort_ascendings = {};
        _ref1 = this.mget('sort');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          obj = _ref1[_i];
          sort_ascendings[obj['column']] = obj['ascending'];
        }
        source = this.mget('source');
        template_data = {
          skip: {
            _counts: true,
            _selected: true,
            index: true
          },
          computed_columns: this.mget('source').get('computed_columns'),
          columns: this.mget('tabledata').column_names,
          data: this.mget('tabledata').data,
          group: group,
          sort_ascendings: sort_ascendings,
          offset: this.mget('offset'),
          length: this.model.length(),
          filterselected: this.mget('filterselected'),
          totallength: this.mget('totallength'),
          counts: this.mget('tabledata').data._counts,
          selected: this.mget('tabledata').data._selected,
          controls_hide: this.controls_hide,
          colors: colors,
          index: this.mget('tabledata').data.index
        };
        this.$el.empty();
        html = this.template(template_data);
        this.$el.html(html);
        this.$(".pandasagg").find("option[value=\"" + (this.mget('agg')) + "\"]").attr('selected', 'selected');
        return this.$el.addClass("bk-table");
      };

      return DataTableView;

    })(ContinuumView);
    DataTable = (function(_super) {
      __extends(DataTable, _super);

      function DataTable() {
        this.toggle_column_sort = __bind(this.toggle_column_sort, this);
        _ref1 = DataTable.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DataTable.prototype.type = 'DataTable';

      DataTable.prototype.initialize = function(attrs, options) {
        var _this = this;
        DataTable.__super__.initialize.call(this, attrs, options);
        return this.throttled_fetch = _.throttle((function() {
          return _this.fetch();
        }), 500);
      };

      DataTable.prototype.fetch = function(options) {
        return DataTable.__super__.fetch.call(this, options);
      };

      DataTable.prototype.length = function() {
        return _.values(this.get('tabledata').data)[0].length;
      };

      DataTable.prototype.toggle_column_sort = function(colname) {
        var sort, sorting;
        sorting = this.get('sort');
        this.unset('sort', {
          'silent': true
        });
        sort = _.filter(sorting, function(x) {
          return x['column'] === colname;
        });
        if (sort.length > 0) {
          sort = sort[0];
        } else {
          sorting = _.clone(sorting);
          sorting.push({
            column: colname,
            ascending: true
          });
          this.save('sort', sorting, {
            'wait': true
          });
          return;
        }
        if (sort['ascending']) {
          sort['ascending'] = false;
          this.save('sort', sorting, {
            'wait': true
          });
        } else {
          sorting = _.filter(sorting, function(x) {
            return x['column'] !== colname;
          });
          this.save('sort', sorting, {
            'wait': true
          });
        }
      };

      DataTable.prototype.go_first = function() {
        this.set('offset', 0);
        return this.save();
      };

      DataTable.prototype.go_prev = function() {
        var offset;
        offset = this.get('offset');
        offset = offset - this.length();
        if (offset < 0) {
          offset = 0;
        }
        this.set('offset', offset);
        return this.save();
      };

      DataTable.prototype.go_next = function() {
        var maxoffset, offset;
        offset = this.get('offset');
        offset = offset + this.length();
        maxoffset = this.get('maxlength') - this.length();
        if (offset > maxoffset) {
          offset = maxoffset;
        }
        this.set('offset', offset);
        return this.save();
      };

      DataTable.prototype.go_last = function() {
        var maxoffset;
        maxoffset = this.get('maxlength') - this.length();
        this.set('offset', maxoffset);
        return this.save();
      };

      DataTable.prototype.default_view = DataTableView;

      DataTable.prototype.defaults = function() {
        return _.extend({}, DataTable.__super__.defaults.call(this), {
          sort: [],
          group: [],
          agg: 'sum',
          offset: 0,
          length: 100,
          maxlength: 1000,
          tabledata: null,
          columns_names: []
        });
      };

      return DataTable;

    })(HasParent);
    DataTables = (function(_super) {
      __extends(DataTables, _super);

      function DataTables() {
        _ref2 = DataTables.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      DataTables.prototype.model = DataTable;

      return DataTables;

    })(Collection);
    return {
      "Model": DataTable,
      "Collection": new DataTables(),
      "View": DataTableView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=data_table.js.map
*/