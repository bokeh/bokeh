(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["backbone", "tool/button_tool"], function(Backbone, ButtonTool) {
    var GestureTool, GestureToolButtonView, GestureToolView, _ref, _ref1, _ref2;
    GestureToolButtonView = (function(_super) {
      __extends(GestureToolButtonView, _super);

      function GestureToolButtonView() {
        _ref = GestureToolButtonView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GestureToolButtonView.prototype._clicked = function() {
        return this.model.set('active', true);
      };

      return GestureToolButtonView;

    })(ButtonTool.ButtonView);
    GestureToolView = (function(_super) {
      __extends(GestureToolView, _super);

      function GestureToolView() {
        _ref1 = GestureToolView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      return GestureToolView;

    })(ButtonTool.View);
    GestureTool = (function(_super) {
      __extends(GestureTool, _super);

      function GestureTool() {
        _ref2 = GestureTool.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      GestureTool.prototype.defaults = function() {
        return _.extend({}, GestureTool.__super__.defaults.call(this), {
          event_type: this.event_type,
          default_order: this.default_order
        });
      };

      return GestureTool;

    })(ButtonTool.Model);
    return {
      "Model": GestureTool,
      "View": GestureToolView,
      "ButtonView": GestureToolButtonView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=gesture_tool.js.map
*/