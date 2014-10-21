(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "range/range1d"], function(_, Collection, Range1d) {
    var DataRange1d, DataRange1ds, _ref, _ref1;
    DataRange1d = (function(_super) {
      __extends(DataRange1d, _super);

      function DataRange1d() {
        _ref = DataRange1d.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DataRange1d.prototype.type = 'DataRange1d';

      DataRange1d.prototype._get_minmax = function() {
        var center, colname, columns, max, min, source, sourceobj, span, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4;
        columns = [];
        _ref1 = this.get('sources');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          source = _ref1[_i];
          sourceobj = this.resolve_ref(source['source']);
          _ref2 = source['columns'];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            colname = _ref2[_j];
            columns.push(sourceobj.get_column(colname));
          }
        }
        columns = _.flatten(columns);
        columns = _.filter(columns, function(x) {
          return typeof x !== "string";
        });
        columns = _.reject(columns, function(x) {
          return isNaN(x);
        });
        _ref3 = [_.min(columns), _.max(columns)], min = _ref3[0], max = _ref3[1];
        if (max !== min) {
          span = (max - min) * (1 + this.get('rangepadding'));
        } else {
          if (max !== 0) {
            span = Math.abs(max) * (1 + this.get('rangepadding'));
          } else {
            span = 2;
          }
        }
        center = (max + min) / 2.0;
        _ref4 = [center - span / 2.0, center + span / 2.0], min = _ref4[0], max = _ref4[1];
        return [min, max];
      };

      DataRange1d.prototype._get_start = function() {
        if (!_.isNullOrUndefined(this.get('_start'))) {
          return this.get('_start');
        } else {
          return this.get('minmax')[0];
        }
      };

      DataRange1d.prototype._set_start = function(start) {
        return this.set('_start', start);
      };

      DataRange1d.prototype._get_end = function() {
        if (!_.isNullOrUndefined(this.get('_end'))) {
          return this.get('_end');
        } else {
          return this.get('minmax')[1];
        }
      };

      DataRange1d.prototype._set_end = function(end) {
        return this.set('_end', end);
      };

      DataRange1d.prototype.initialize = function(attrs, options) {
        var columns_ref, source, _i, _len, _ref1;
        this.register_property('minmax', this._get_minmax, true);
        this.add_dependencies('minmax', this, ['sources'], ['rangepadding']);
        _ref1 = this.get('sources');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          columns_ref = _ref1[_i];
          source = this.resolve_ref(columns_ref.source);
          this.add_dependencies('minmax', source, 'data');
        }
        this.register_property('start', this._get_start, true);
        this.register_setter('start', this._set_start);
        this.add_dependencies('start', this, ['minmax', '_start']);
        this.register_property('end', this._get_end, true);
        this.register_setter('end', this._set_end);
        this.add_dependencies('end', this, ['minmax', '_end']);
        return DataRange1d.__super__.initialize.call(this, attrs, options);
      };

      DataRange1d.prototype.defaults = function() {
        return _.extend({}, DataRange1d.__super__.defaults.call(this), {
          sources: [],
          rangepadding: 0.1
        });
      };

      return DataRange1d;

    })(Range1d.Model);
    DataRange1ds = (function(_super) {
      __extends(DataRange1ds, _super);

      function DataRange1ds() {
        _ref1 = DataRange1ds.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DataRange1ds.prototype.model = DataRange1d;

      return DataRange1ds;

    })(Collection);
    return {
      "Model": DataRange1d,
      "Collection": new DataRange1ds()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=data_range1d.js.map
*/