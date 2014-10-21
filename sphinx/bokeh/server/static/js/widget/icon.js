(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/continuum_view", "common/has_parent", "common/logging"], function(_, Collection, ContinuumView, HasParent, Logging) {
    var Icon, IconView, Icons, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    IconView = (function(_super) {
      __extends(IconView, _super);

      function IconView() {
        _ref = IconView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      IconView.prototype.tagName = "i";

      IconView.prototype.initialize = function(options) {
        IconView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      IconView.prototype.render = function() {
        var flip, size;
        this.$el.empty();
        this.$el.addClass("bk-fa");
        this.$el.addClass("bk-fa-" + this.mget("name"));
        size = this.mget("size");
        if (size != null) {
          this.$el.css({
            "font-size": size + "em"
          });
        }
        flip = this.mget("flip");
        if (flip != null) {
          this.$el.addClass("bk-fa-flip-" + flip);
        }
        if (this.mget("spin")) {
          this.$el.addClass("bk-fa-spin");
        }
        return this;
      };

      return IconView;

    })(ContinuumView);
    Icon = (function(_super) {
      __extends(Icon, _super);

      function Icon() {
        _ref1 = Icon.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Icon.prototype.type = "Icon";

      Icon.prototype.default_view = IconView;

      Icon.prototype.defaults = function() {
        return _.extend({}, Icon.__super__.defaults.call(this), {
          name: "",
          size: null,
          flip: null,
          spin: false
        });
      };

      return Icon;

    })(HasParent);
    Icons = (function(_super) {
      __extends(Icons, _super);

      function Icons() {
        _ref2 = Icons.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Icons.prototype.model = Icon;

      return Icons;

    })(Collection);
    return {
      Model: Icon,
      Collection: new Icons(),
      View: IconView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=icon.js.map
*/