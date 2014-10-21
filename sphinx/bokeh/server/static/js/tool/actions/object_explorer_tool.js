(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "bootstrap/modal", "common/collection", "widget/object_explorer", "./action_tool", "./object_explorer_tool_template"], function(_, $, $$1, Collection, ObjectExplorer, ActionTool, object_explorer_tool_template) {
    var ObjectExplorerTool, ObjectExplorerToolView, ObjectExplorerTools, _ref, _ref1, _ref2;
    ObjectExplorerToolView = (function(_super) {
      var className;

      __extends(ObjectExplorerToolView, _super);

      function ObjectExplorerToolView() {
        _ref = ObjectExplorerToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      className = "bk-bs-modal";

      ObjectExplorerToolView.prototype.template = object_explorer_tool_template;

      ObjectExplorerToolView.prototype.initialize = function(options) {
        var object_explorer_view,
          _this = this;
        ObjectExplorerToolView.__super__.initialize.call(this, options);
        this.$el.html(this.template());
        this.$el.attr("tabindex", "-1");
        object_explorer_view = new ObjectExplorer.View({
          el: this.$el.find(".bk-bs-modal-body")
        });
        $('body').append(this.$el);
        return this.$el.on('hidden', function() {
          return _this.$el.modal({
            show: false
          });
        });
      };

      ObjectExplorerToolView.prototype["do"] = function() {
        return this.$el.modal({
          show: true
        });
      };

      return ObjectExplorerToolView;

    })(ActionTool.View);
    ObjectExplorerTool = (function(_super) {
      __extends(ObjectExplorerTool, _super);

      function ObjectExplorerTool() {
        _ref1 = ObjectExplorerTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ObjectExplorerTool.prototype.default_view = ObjectExplorerToolView;

      ObjectExplorerTool.prototype.type = "ObjectExplorerTool";

      ObjectExplorerTool.prototype.tool_name = "Object Explorer";

      ObjectExplorerTool.prototype.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAJHSURBVEiJvZbPTlNREManQmtSvTvqI7gw4R1cQpP6ABoahKWURxBfgo0ulRfgGYA9lI1dIdEFMSo0sZLY3p+L+514eu85t7dKOskk58838+XMmTNnaoAtUu4tlM3MDLCqpwQ2KMrGPDzREwLLQJKmaU3zB2a2pu1fUjOzNaBpZpamaQ1IgOWZzLm1OrADfAQ6wCOgDfwAJsCudKK1dWGeyeYVUA/y5AmBhsh8+QqMNb4EHksvtTYRxpcdoFFKCCx5ZCOgD9xofgOcAm8UgbrGpzlMX7aOdKmMMAEGAve1tgUcA92Sa+kKs6V5Xz4GQBIl1KV3gN/AN2Azevlx8k3ZjoGOl3ThO9SmC9HJPxCeuPDm1ovPQiFtm9l9MxuZ2X7AYYssY9tAK8C5L9uGMA/zDpx2gQ/e6c4CZKvAoZeJh8BqAHfmJdF7soIxHVKm5ROwl3OyAhxp/4sUra3ksHvy4UuQcET2oJ9QfLhtYa6Ap9Irra3nsHX52OXvE4mWNqRVpAwX9hMJ6QXwOodreSH9LC0L6cWskLqkGQpwF0kzlM9ugVDARHd1C/wEngeclT4L4IVsb4WJVxrPyD2N4/D1xIV5Hr4rbWbWNLPvZvZuXkIzeyvbJl5pKzBrHCveR8B2yam2hXmpebXiTfn3NATOKX5P516iXTPP96SNBtBjWlz1h6yCuA/YVZOxML70mPUBe5uuxRiQtQ2uxbgm+9170lCLMZBttRbDAxSaKODAC7cL2wEVmqiZhJHk+O82sVaV7K5k4Z33H/QTdNyD5wyAAAAAAElFTkSuQmCC";

      return ObjectExplorerTool;

    })(ActionTool.Model);
    ObjectExplorerTools = (function(_super) {
      __extends(ObjectExplorerTools, _super);

      function ObjectExplorerTools() {
        _ref2 = ObjectExplorerTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ObjectExplorerTools.prototype.model = ObjectExplorerTool;

      return ObjectExplorerTools;

    })(Collection);
    return {
      Model: ObjectExplorerTool,
      Collection: new ObjectExplorerTools(),
      View: ObjectExplorerToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=object_explorer_tool.js.map
*/