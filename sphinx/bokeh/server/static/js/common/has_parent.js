(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./has_properties"], function(_, HasProperties) {
    var HasParent, _ref;
    HasParent = (function(_super) {
      __extends(HasParent, _super);

      function HasParent() {
        _ref = HasParent.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HasParent.prototype.initialize = function(attrs, options) {
        HasParent.__super__.initialize.call(this, attrs, options);
        this._parent = HasProperties.prototype.get.apply(this, ['parent']);
        return this._display_defaults = this.display_defaults();
      };

      HasParent.prototype.get = function(attr) {
        var val;
        if (attr === 'parent') {
          return this._parent;
        }
        val = HasParent.__super__.get.call(this, attr);
        if (!_.isUndefined(val)) {
          return val;
        }
        if (this._parent && _.indexOf(this._parent.parent_properties, attr) >= 0) {
          val = this._parent.get(attr);
          if (!_.isUndefined(val)) {
            return val;
          }
        }
        return this._display_defaults[attr];
      };

      HasParent.prototype.display_defaults = function() {
        return {};
      };

      return HasParent;

    })(HasProperties);
    return HasParent;
  });

}).call(this);

/*
//@ sourceMappingURL=has_parent.js.map
*/