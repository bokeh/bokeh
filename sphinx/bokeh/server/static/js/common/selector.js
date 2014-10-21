(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./has_properties", "./logging"], function(_, HasProperties, Logging) {
    var Selector, logger, _ref;
    logger = Logging.logger;
    return Selector = (function(_super) {
      __extends(Selector, _super);

      function Selector() {
        _ref = Selector.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Selector.prototype.type = 'Selector';

      Selector.prototype.update = function(indices, geometry, final, append) {
        this.set('timestamp', new Date());
        this.set('geometry', geometry);
        this.set('final', final);
        if (append) {
          indices = _.union(this.get('indices'), indices);
        }
        return this.set('indices', indices);
      };

      Selector.prototype.clear = function() {
        this.set('timestamp', new Date());
        this.set('geometry', null);
        this.set('final', true);
        return this.set('indices', []);
      };

      Selector.prototype.defaults = function() {
        return _.extend({}, Selector.__super__.defaults.call(this), {
          indices: []
        });
      };

      return Selector;

    })(HasProperties);
  });

}).call(this);

/*
//@ sourceMappingURL=selector.js.map
*/