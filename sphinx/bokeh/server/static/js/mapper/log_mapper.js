(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "common/has_properties"], function(Collection, HasProperties) {
    var LogMapper, LogMappers, _ref, _ref1;
    LogMapper = (function(_super) {
      __extends(LogMapper, _super);

      function LogMapper() {
        _ref = LogMapper.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LogMapper.prototype.initialize = function(attrs, options) {
        LogMapper.__super__.initialize.call(this, attrs, options);
        this.register_property('mapper_state', this._mapper_state, true);
        this.add_dependencies('mapper_state', this, ['source_range', 'target_range']);
        this.add_dependencies('mapper_state', this.get('source_range'), ['start', 'end']);
        return this.add_dependencies('mapper_state', this.get('target_range'), ['start', 'end']);
      };

      LogMapper.prototype.map_to_target = function(x) {
        var error, inter_offset, inter_scale, intermediate, offset, result, scale, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1], inter_scale = _ref1[2], inter_offset = _ref1[3];
        intermediate = 0;
        result = 0;
        if (inter_scale === 0) {
          intermediate = 0;
        } else {
          try {
            intermediate = (Math.log(x) - inter_offset) / inter_scale;
            if (isNaN(intermediate)) {
              throw "NaN";
            }
            if (isFinite(intermediate) === false) {
              throw "Infinite";
            }
          } catch (_error) {
            error = _error;
            intermediate = 0;
          }
        }
        result = intermediate * scale + offset;
        return result;
      };

      LogMapper.prototype.v_map_to_target = function(xs) {
        var error, i, idx, inter_offset, inter_scale, intermediate, mask, mask1, mask2, offset, result, scale, x, _i, _j, _len, _len1, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1], inter_scale = _ref1[2], inter_offset = _ref1[3];
        intermediate = new Float64Array(xs.length);
        result = new Float64Array(xs.length);
        if (inter_scale === 0) {
          intermediate = xs.map(function(i) {
            return i * 0;
          });
        } else {
          try {
            mask1 = xs.map(function(i) {
              return i <= 0;
            });
            mask2 = xs.map(function(i) {
              return isNaN(i);
            });
            mask = (function() {
              var _i, _ref2, _results;
              _results = [];
              for (i = _i = 0, _ref2 = xs.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
                _results.push(mask1[i] | mask2[i]);
              }
              return _results;
            })();
            mask = mask.reduce(function(x, y) {
              return x || y;
            });
            if (mask === 1) {
              xs[mask] = 1;
            }
            intermediate = xs.map(function(i) {
              return (Math.log(i) - inter_offset) / inter_scale;
            });
            for (idx = _i = 0, _len = intermediate.length; _i < _len; idx = ++_i) {
              x = intermediate[idx];
              if (isNaN(intermediate[idx])) {
                throw "NaN";
              }
              if (isFinite(intermediate[idx]) === false) {
                throw "Infinite";
              }
            }
          } catch (_error) {
            error = _error;
            intermediate = xs.map(function(i) {
              return i * 0;
            });
          }
        }
        for (idx = _j = 0, _len1 = xs.length; _j < _len1; idx = ++_j) {
          x = xs[idx];
          result[idx] = intermediate[idx] * scale + offset;
        }
        return result;
      };

      LogMapper.prototype.map_from_target = function(xprime) {
        var inter_offset, inter_scale, intermediate, offset, scale, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1], inter_scale = _ref1[2], inter_offset = _ref1[3];
        intermediate = (xprime - offset) / scale;
        intermediate = Math.exp(inter_scale * intermediate + inter_offset);
        return intermediate;
      };

      LogMapper.prototype.v_map_from_target = function(xprimes) {
        var inter_offset, inter_scale, intermediate, offset, scale, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1], inter_scale = _ref1[2], inter_offset = _ref1[3];
        intermediate = xprimes.map(function(i) {
          return (i - offset) / scale;
        });
        intermediate = intermediate.map(function(i) {
          return Math.exp(inter_scale * i + inter_offset);
        });
        return intermediate;
      };

      LogMapper.prototype._get_safe_scale = function(orig_start, orig_end) {
        var end, log_val, start;
        if (orig_start < 0) {
          start = 0;
        } else {
          start = orig_start;
        }
        if (orig_end < 0) {
          end = 0;
        } else {
          end = orig_end;
        }
        if (start === end) {
          if (start === 0) {
            start = 1;
            end = 10;
          } else {
            log_val = Math.log(start) / Math.log(10);
            start = Math.pow(10, Math.floor(log_val));
            if (Math.ceil(log_val) !== Math.floor(log_val)) {
              end = Math.pow(10, Math.ceil(log_val));
            } else {
              end = Math.pow(10, Math.ceil(log_val) + 1);
            }
          }
        }
        return [start, end];
      };

      LogMapper.prototype._mapper_state = function() {
        var end, inter_offset, inter_scale, offset, scale, screen_range, source_end, source_start, start, target_end, target_start, _ref1;
        source_start = this.get('source_range').get('start');
        source_end = this.get('source_range').get('end');
        target_start = this.get('target_range').get('start');
        target_end = this.get('target_range').get('end');
        screen_range = target_end - target_start;
        _ref1 = this._get_safe_scale(source_start, source_end), start = _ref1[0], end = _ref1[1];
        if (start === 0) {
          inter_scale = Math.log(end);
          inter_offset = 0;
        } else {
          inter_scale = Math.log(end) - Math.log(start);
          inter_offset = Math.log(start);
        }
        scale = screen_range;
        offset = target_start;
        return [scale, offset, inter_scale, inter_offset];
      };

      return LogMapper;

    })(HasProperties);
    LogMappers = (function(_super) {
      __extends(LogMappers, _super);

      function LogMappers() {
        _ref1 = LogMappers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LogMappers.prototype.model = LogMapper;

      return LogMappers;

    })(Collection);
    return {
      "Model": LogMapper,
      "Collection": new LogMappers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=log_mapper.js.map
*/