(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(["underscore", "jquery", "bootstrap/dropdown", "backbone", "./logging", "./toolbar_template", "common/has_properties", "tool/actions/action_tool", "tool/gestures/gesture_tool", "tool/inspectors/inspect_tool"], function(_, $, $$1, Backbone, Logging, toolbar_template, HasProperties, ActionTool, GestureTool, InspectTool) {
    var ToolManager, ToolManagerView, logger, _ref, _ref1;
    logger = Logging.logger;
    ToolManagerView = (function(_super) {
      __extends(ToolManagerView, _super);

      function ToolManagerView() {
        _ref = ToolManagerView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ToolManagerView.prototype.className = "bk-sidebar";

      ToolManagerView.prototype.template = toolbar_template;

      ToolManagerView.prototype.initialize = function(options) {
        ToolManagerView.__super__.initialize.call(this, options);
        return this.listenTo(this.model, 'change', this.render);
      };

      ToolManagerView.prototype.render = function() {
        var anchor, button_bar_list, et, gestures, inspectors, ul,
          _this = this;
        this.$el.html(this.template());
        button_bar_list = this.$('.bk-button-bar-list');
        inspectors = this.model.get('inspectors');
        button_bar_list = this.$(".bk-bs-dropdown[type='inspectors']");
        if (inspectors.length === 0) {
          button_bar_list.hide();
        } else {
          anchor = $('<a href="#" data-bk-bs-toggle="dropdown" class="bk-bs-dropdown-toggle">inspect <span class="bk-bs-caret"></a>');
          anchor.appendTo(button_bar_list);
          ul = $('<ul class="bk-bs-dropdown-menu" />');
          _.each(inspectors, function(tool) {
            var item;
            item = $('<li />');
            item.append(new InspectTool.ListItemView({
              model: tool
            }).el);
            return item.appendTo(ul);
          });
          ul.on('click', function(e) {
            return e.stopPropagation();
          });
          ul.appendTo(button_bar_list);
          anchor.dropdown();
        }
        button_bar_list = this.$(".bk-button-bar-list[type='actions']");
        _.each(this.model.get('actions'), function(item) {
          return button_bar_list.append(new ActionTool.ButtonView({
            model: item
          }).el);
        });
        gestures = this.model.get('gestures');
        for (et in gestures) {
          button_bar_list = this.$(".bk-button-bar-list[type='" + et + "']");
          _.each(gestures[et].tools, function(item) {
            return button_bar_list.append(new GestureTool.ButtonView({
              model: item
            }).el);
          });
        }
        return this;
      };

      return ToolManagerView;

    })(Backbone.View);
    ToolManager = (function(_super) {
      __extends(ToolManager, _super);

      function ToolManager() {
        this._active_change = __bind(this._active_change, this);
        _ref1 = ToolManager.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ToolManager.prototype.initialize = function(attrs, options) {
        ToolManager.__super__.initialize.call(this, attrs, options);
        return this._init_tools();
      };

      ToolManager.prototype._init_tools = function() {
        var actions, et, gestures, inspectors, tool, tools, _i, _len, _ref2, _results;
        gestures = this.get('gestures');
        _ref2 = this.get('tools');
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          tool = _ref2[_i];
          if (tool instanceof InspectTool.Model) {
            inspectors = this.get('inspectors');
            inspectors.push(tool);
            this.set('inspectors', inspectors);
          } else if (tool instanceof ActionTool.Model) {
            actions = this.get('actions');
            actions.push(tool);
            this.set('actions', actions);
          } else if (tool instanceof GestureTool.Model) {
            et = tool.get('event_type');
            if (!(et in gestures)) {
              logger.warn("ToolManager: unknown event type '" + et + "' for tool: " + tool.type + " (" + tool.id + ")");
              continue;
            }
            gestures[et].tools.push(tool);
            this.listenTo(tool, 'change:active', _.bind(this._active_change, tool));
          }
        }
        _results = [];
        for (et in gestures) {
          tools = gestures[et].tools;
          if (tools.length === 0) {
            continue;
          }
          gestures[et].tools = _.sortBy(tools, function(tool) {
            return tool.get('default_order');
          });
          _results.push(gestures[et].tools[0].set('active', true));
        }
        return _results;
      };

      ToolManager.prototype._active_change = function(tool) {
        var active, et, gestures, prev;
        et = tool.get('event_type');
        active = tool.get('active');
        if (!active) {
          return null;
        }
        gestures = this.get('gestures');
        prev = gestures[et].active;
        if (prev != null) {
          logger.debug("ToolManager: deactivating tool: " + prev.type + " (" + prev.id + ") for event type '" + et + "'");
          prev.set('active', false);
        }
        gestures[et].active = tool;
        this.set('gestures', gestures);
        logger.debug("ToolManager: activating tool: " + tool.type + " (" + tool.id + ") for event type '" + et + "'");
        return null;
      };

      ToolManager.prototype.defaults = function() {
        return {
          gestures: {
            pan: {
              tools: [],
              active: null
            },
            tap: {
              tools: [],
              active: null
            },
            doubletap: {
              tools: [],
              active: null
            },
            scroll: {
              tools: [],
              active: null
            },
            pinch: {
              tools: [],
              active: null
            },
            press: {
              tools: [],
              active: null
            },
            rotate: {
              tools: [],
              active: null
            }
          },
          actions: [],
          inspectors: []
        };
      };

      return ToolManager;

    })(HasProperties);
    return {
      "Model": ToolManager,
      "View": ToolManagerView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=tool_manager.js.map
*/