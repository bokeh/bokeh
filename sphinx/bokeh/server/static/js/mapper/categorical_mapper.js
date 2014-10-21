(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "./linear_mapper"], function(Collection, LinearMapper) {
    var CategoricalMapper, CategoricalMappers, _ref, _ref1;
    CategoricalMapper = (function(_super) {
      __extends(CategoricalMapper, _super);

      function CategoricalMapper() {
        _ref = CategoricalMapper.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CategoricalMapper.prototype.map_to_target = function(x) {
        var factor, factors, percent, _ref1;
        if (typeof x === 'number') {
          return CategoricalMapper.__super__.map_to_target.call(this, x);
        }
        factors = this.get('source_range').get('factors');
        if (x.indexOf(':') >= 0) {
          _ref1 = x.split(':'), factor = _ref1[0], percent = _ref1[1];
          percent = parseFloat(percent);
          return CategoricalMapper.__super__.map_to_target.call(this, factors.indexOf(factor) + 0.5 + percent);
        }
        return CategoricalMapper.__super__.map_to_target.call(this, factors.indexOf(x) + 1);
      };

      CategoricalMapper.prototype.v_map_to_target = function(xs) {
        var factor, factors, i, percent, results, x, _i, _ref1, _ref2;
        if (typeof xs[0] === 'number') {
          return CategoricalMapper.__super__.v_map_to_target.call(this, xs);
        }
        factors = this.get('source_range').get('factors');
        results = Array(xs.length);
        for (i = _i = 0, _ref1 = xs.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          x = xs[i];
          if (x.indexOf(':') >= 0) {
            _ref2 = x.split(':'), factor = _ref2[0], percent = _ref2[1];
            percent = parseFloat(percent);
            results[i] = factors.indexOf(factor) + 0.5 + percent;
          } else {
            results[i] = factors.indexOf(x) + 1;
          }
        }
        return CategoricalMapper.__super__.v_map_to_target.call(this, results);
      };

      CategoricalMapper.prototype.map_from_target = function(xprime) {
        var factors;
        xprime = CategoricalMapper.__super__.map_from_target.call(this, xprime) - 0.5;
        factors = this.get('source_range').get('factors');
        return factors[Math.floor(xprime)];
      };

      CategoricalMapper.prototype.v_map_from_target = function(xprimes) {
        var factors, i, result, _i, _ref1;
        result = CategoricalMapper.__super__.v_map_from_target.call(this, xprimes);
        factors = this.get('source_range').get('factors');
        for (i = _i = 0, _ref1 = result.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          result[i] = factors[Math.floor(result[i] - 0.5)];
        }
        return result;
      };

      return CategoricalMapper;

    })(LinearMapper.Model);
    CategoricalMappers = (function(_super) {
      __extends(CategoricalMappers, _super);

      function CategoricalMappers() {
        _ref1 = CategoricalMappers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CategoricalMappers.prototype.model = CategoricalMapper;

      return CategoricalMappers;

    })(Collection);
    return {
      "Model": CategoricalMapper,
      "Collection": new CategoricalMappers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=categorical_mapper.js.map
*/