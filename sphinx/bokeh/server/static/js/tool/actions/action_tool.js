(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["backbone", "tool/button_tool"], function(Backbone, ButtonTool) {
    var ActionTool, ActionToolButtonView, ActionToolView, _ref, _ref1, _ref2;
    ActionToolButtonView = (function(_super) {
      __extends(ActionToolButtonView, _super);

      function ActionToolButtonView() {
        _ref = ActionToolButtonView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ActionToolButtonView.prototype._clicked = function() {
        return this.model.trigger('do');
      };

      return ActionToolButtonView;

    })(ButtonTool.ButtonView);
    ActionToolView = (function(_super) {
      __extends(ActionToolView, _super);

      function ActionToolView() {
        _ref1 = ActionToolView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ActionToolView.prototype.initialize = function(options) {
        ActionToolView.__super__.initialize.call(this, options);
        return this.listenTo(this.model, 'do', this["do"]);
      };

      return ActionToolView;

    })(ButtonTool.View);
    ActionTool = (function(_super) {
      __extends(ActionTool, _super);

      function ActionTool() {
        _ref2 = ActionTool.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      return ActionTool;

    })(ButtonTool.Model);
    return {
      "Model": ActionTool,
      "View": ActionToolView,
      "ButtonView": ActionToolButtonView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=action_tool.js.map
*/