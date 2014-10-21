(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/continuum_view", "common/has_parent", "common/logging"], function(_, Collection, ContinuumView, HasParent, Logging) {
    var Toggle, ToggleView, Toggles, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    ToggleView = (function(_super) {
      __extends(ToggleView, _super);

      function ToggleView() {
        _ref = ToggleView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ToggleView.prototype.tagName = "button";

      ToggleView.prototype.events = {
        "click": "change_input"
      };

      ToggleView.prototype.change_input = function() {
        this.mset('active', this.$el.hasClass("bk-bs-active"));
        return this.model.save();
      };

      ToggleView.prototype.initialize = function(options) {
        ToggleView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      ToggleView.prototype.render = function() {
        var icon, key, label, val, _ref1;
        icon = this.mget('icon');
        if (icon != null) {
          build_views(this.views, [icon]);
          _ref1 = this.views;
          for (key in _ref1) {
            if (!__hasProp.call(_ref1, key)) continue;
            val = _ref1[key];
            val.$el.detach();
          }
        }
        this.$el.empty();
        this.$el.addClass("bk-bs-btn");
        this.$el.addClass("bk-bs-btn-" + this.mget("type"));
        if (this.mget("disabled")) {
          this.$el.attr("disabled", "disabled");
        }
        label = this.mget("label");
        if (icon != null) {
          this.$el.append(this.views[icon.id].$el);
          label = " " + label;
        }
        this.$el.append(document.createTextNode(label));
        if (this.mget("active")) {
          this.$el.addClass("bk-bs-active");
        }
        this.$el.attr("data-bk-bs-toggle", "button");
        return this;
      };

      return ToggleView;

    })(ContinuumView);
    Toggle = (function(_super) {
      __extends(Toggle, _super);

      function Toggle() {
        _ref1 = Toggle.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Toggle.prototype.type = "Toggle";

      Toggle.prototype.default_view = ToggleView;

      Toggle.prototype.defaults = function() {
        return _.extend({}, Toggle.__super__.defaults.call(this), {
          active: false,
          label: "Toggle",
          icon: null,
          type: "default",
          disabled: false
        });
      };

      return Toggle;

    })(HasParent);
    Toggles = (function(_super) {
      __extends(Toggles, _super);

      function Toggles() {
        _ref2 = Toggles.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Toggles.prototype.model = Toggle;

      return Toggles;

    })(Collection);
    return {
      Model: Toggle,
      Collection: new Toggles(),
      View: ToggleView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=toggle.js.map
*/