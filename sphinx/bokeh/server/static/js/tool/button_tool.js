(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["backbone", "./tool", "./button_tool_template"], function(Backbone, Tool, button_tool_template) {
    var ButtonTool, ButtonToolButtonView, ButtonToolView, _ref, _ref1, _ref2;
    ButtonToolButtonView = (function(_super) {
      __extends(ButtonToolButtonView, _super);

      function ButtonToolButtonView() {
        _ref = ButtonToolButtonView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ButtonToolButtonView.prototype.tagName = "li";

      ButtonToolButtonView.prototype.template = button_tool_template;

      ButtonToolButtonView.prototype.events = {
        'click .bk-toolbar-button': '_clicked'
      };

      ButtonToolButtonView.prototype.initialize = function(options) {
        ButtonToolButtonView.__super__.initialize.call(this, options);
        this.$el.html(this.template(this.model.attrs_and_props()));
        this.listenTo(this.model, 'change:active', this.render);
        return this.render();
      };

      ButtonToolButtonView.prototype.render = function() {
        if (this.model.get('active')) {
          this.$el.children('button').addClass('active');
        } else {
          this.$el.children('button').removeClass('active');
        }
        return this;
      };

      ButtonToolButtonView.prototype._clicked = function(e) {};

      return ButtonToolButtonView;

    })(Backbone.View);
    ButtonToolView = (function(_super) {
      __extends(ButtonToolView, _super);

      function ButtonToolView() {
        _ref1 = ButtonToolView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      return ButtonToolView;

    })(Tool.View);
    ButtonTool = (function(_super) {
      __extends(ButtonTool, _super);

      function ButtonTool() {
        _ref2 = ButtonTool.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ButtonTool.prototype.initialize = function(attrs, options) {
        ButtonTool.__super__.initialize.call(this, attrs, options);
        return this.register_property('tooltip', function() {
          return this.get('tool_name');
        });
      };

      ButtonTool.prototype.defaults = function() {
        return _.extend({}, ButtonTool.__super__.defaults.call(this), {
          active: false,
          tool_name: this.tool_name,
          icon: this.icon
        });
      };

      return ButtonTool;

    })(Tool.Model);
    return {
      "Model": ButtonTool,
      "View": ButtonToolView,
      "ButtonView": ButtonToolButtonView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=button_tool.js.map
*/