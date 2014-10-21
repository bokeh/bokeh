(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "common/has_properties"], function(Collection, HasProperties) {
    var LinearMapper, LinearMappers, _ref, _ref1;
    LinearMapper = (function(_super) {
      __extends(LinearMapper, _super);

      function LinearMapper() {
        _ref = LinearMapper.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LinearMapper.prototype.initialize = function(attrs, options) {
        LinearMapper.__super__.initialize.call(this, attrs, options);
        this.register_property('mapper_state', this._mapper_state, true);
        this.add_dependencies('mapper_state', this, ['source_range', 'target_range']);
        this.add_dependencies('mapper_state', this.get('source_range'), ['start', 'end']);
        return this.add_dependencies('mapper_state', this.get('target_range'), ['start', 'end']);
      };

      LinearMapper.prototype.map_to_target = function(x) {
        var offset, scale, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
        return scale * x + offset;
      };

      LinearMapper.prototype.v_map_to_target = function(xs) {
        var idx, offset, result, scale, x, _i, _len, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
        result = new Float64Array(xs.length);
        for (idx = _i = 0, _len = xs.length; _i < _len; idx = ++_i) {
          x = xs[idx];
          result[idx] = scale * x + offset;
        }
        return result;
      };

      LinearMapper.prototype.map_from_target = function(xprime) {
        var offset, scale, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
        return (xprime - offset) / scale;
      };

      LinearMapper.prototype.v_map_from_target = function(xprimes) {
        var idx, offset, result, scale, xprime, _i, _len, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
        result = new Float64Array(xprimes.length);
        for (idx = _i = 0, _len = xprimes.length; _i < _len; idx = ++_i) {
          xprime = xprimes[idx];
          result[idx] = (xprime - offset) / scale;
        }
        return result;
      };

      LinearMapper.prototype._mapper_state = function() {
        var offset, scale, source_end, source_start, target_end, target_start;
        source_start = this.get('source_range').get('start');
        source_end = this.get('source_range').get('end');
        target_start = this.get('target_range').get('start');
        target_end = this.get('target_range').get('end');
        scale = (target_end - target_start) / (source_end - source_start);
        offset = -(scale * source_start) + target_start;
        return [scale, offset];
      };

      return LinearMapper;

    })(HasProperties);
    LinearMappers = (function(_super) {
      __extends(LinearMappers, _super);

      function LinearMappers() {
        _ref1 = LinearMappers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LinearMappers.prototype.model = LinearMapper;

      return LinearMappers;

    })(Collection);
    return {
      "Model": LinearMapper,
      "Collection": new LinearMappers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=linear_mapper.js.map
*/