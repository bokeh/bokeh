(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/continuum_view", "common/has_parent", "common/build_views", "common/logging"], function(_, Collection, ContinuumView, HasParent, build_views, Logging) {
    var Button, ButtonView, Buttons, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    ButtonView = (function(_super) {
      __extends(ButtonView, _super);

      function ButtonView() {
        _ref = ButtonView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ButtonView.prototype.tagName = "button";

      ButtonView.prototype.events = {
        "click": "change_input"
      };

      ButtonView.prototype.change_input = function() {
        this.mset('clicks', this.mget('clicks') + 1);
        return this.model.save();
      };

      ButtonView.prototype.initialize = function(options) {
        ButtonView.__super__.initialize.call(this, options);
        this.views = {};
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      ButtonView.prototype.render = function() {
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
        return this;
      };

      return ButtonView;

    })(ContinuumView);
    Button = (function(_super) {
      __extends(Button, _super);

      function Button() {
        _ref1 = Button.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Button.prototype.type = "Button";

      Button.prototype.default_view = ButtonView;

      Button.prototype.defaults = function() {
        return _.extend({}, Button.__super__.defaults.call(this), {
          clicks: 0,
          label: "Button",
          icon: null,
          type: "default",
          disabled: false
        });
      };

      return Button;

    })(HasParent);
    Buttons = (function(_super) {
      __extends(Buttons, _super);

      function Buttons() {
        _ref2 = Buttons.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Buttons.prototype.model = Button;

      return Buttons;

    })(Collection);
    return {
      Model: Button,
      Collection: new Buttons(),
      View: ButtonView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=button.js.map
*/