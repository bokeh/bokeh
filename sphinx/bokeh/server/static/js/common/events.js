(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["backbone", "hammer", "jquery_mousewheel", "common/logging"], function(Backbone, Hammer, mousewheel, Logging) {
    var Events, logger, _ref;
    logger = Logging.logger;
    return Events = (function(_super) {
      __extends(Events, _super);

      function Events() {
        _ref = Events.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Events.prototype.initialize = function(attrs, options) {
        var hit_area,
          _this = this;
        Events.__super__.initialize.call(this, attrs, options);
        hit_area = this.get('hit_area');
        this.hammer = new Hammer(hit_area[0]);
        this.hammer.on('tap', function(e) {
          return _this._tap(e);
        });
        this.hammer.on('doubletap', function(e) {
          return _this._doubletap(e);
        });
        this.hammer.on('press', function(e) {
          return _this._press(e);
        });
        this.hammer.get('pan').set({
          direction: Hammer.DIRECTION_ALL
        });
        this.hammer.on('panstart', function(e) {
          return _this._pan_start(e);
        });
        this.hammer.on('pan', function(e) {
          return _this._pan(e);
        });
        this.hammer.on('panend', function(e) {
          return _this._pan_end(e);
        });
        this.hammer.get('pinch').set({
          enable: true
        });
        this.hammer.on('pinchstart', function(e) {
          return _this._pinch_start(e);
        });
        this.hammer.on('pinch', function(e) {
          return _this._pinch(e);
        });
        this.hammer.on('pinchend', function(e) {
          return _this._pinch_end(e);
        });
        this.hammer.get('rotate').set({
          enable: true
        });
        this.hammer.on('rotatestart', function(e) {
          return _this._rotate_start(e);
        });
        this.hammer.on('rotate', function(e) {
          return _this._rotate(e);
        });
        this.hammer.on('rotateend', function(e) {
          return _this._rotate_end(e);
        });
        hit_area.mousemove(function(e) {
          return _this._mouse_move(e);
        });
        hit_area.mouseenter(function(e) {
          return _this._mouse_enter(e);
        });
        hit_area.mouseleave(function(e) {
          return _this._mouse_exit(e);
        });
        hit_area.mousewheel(function(e, delta) {
          return _this._mouse_wheel(e, delta);
        });
        $(document).keydown(function(e) {
          return _this._key_down(e);
        });
        return $(document).keyup(function(e) {
          return _this._key_up(e);
        });
      };

      Events.prototype.register_tool = function(tool_view) {
        var et, id, type;
        et = tool_view.mget('event_type');
        id = tool_view.mget('id');
        type = tool_view.model.type;
        if (et == null) {
          logger.debug("Button tool: " + type);
          return;
        }
        if (et === 'pan' || et === 'pinch' || et === 'rotate') {
          logger.debug("Registering tool: " + type + " for event '" + et + "'");
          if (tool_view["_" + et + "_start"] != null) {
            tool_view.listenTo(this, "" + et + ":start:" + id, tool_view["_" + et + "_start"]);
          }
          if (tool_view["_" + et]) {
            tool_view.listenTo(this, "" + et + ":" + id, tool_view["_" + et]);
          }
          if (tool_view["_" + et + "_end"]) {
            tool_view.listenTo(this, "" + et + ":end:" + id, tool_view["_" + et + "_end"]);
          }
        } else if (et === "move") {
          logger.debug("Registering tool: " + type + " for event '" + et + "'");
          if (tool_view._move_enter != null) {
            tool_view.listenTo(this, "move:enter", tool_view._move_enter);
          }
          tool_view.listenTo(this, "move", tool_view["_move"]);
          if (tool_view._move_exit != null) {
            tool_view.listenTo(this, "move:exit", tool_view._move_exit);
          }
        } else {
          logger.debug("Registering tool: " + type + " for event '" + et + "'");
          tool_view.listenTo(this, "" + et + ":" + id, tool_view["_" + et]);
        }
        if (tool_view._keydown != null) {
          logger.debug("Registering tool: " + type + " for event 'keydown'");
          tool_view.listenTo(this, "keydown", tool_view._keydown);
        }
        if (tool_view._keyup != null) {
          logger.debug("Registering tool: " + type + " for event 'keyup'");
          return tool_view.listenTo(this, "keyup", tool_view._keyup);
        }
      };

      Events.prototype._trigger = function(event_type, e) {
        var active, base_event_type, gestures, tm;
        tm = this.get('tool_manager');
        base_event_type = event_type.split(":")[0];
        gestures = tm.get('gestures');
        active = gestures[base_event_type].active;
        if (active != null) {
          return this.trigger("" + event_type + ":" + active.id, e);
        }
      };

      Events.prototype._bokify_hammer = function(e) {
        var left, offset, top, _ref1, _ref2;
        if (e.pointerType === "mouse") {
          offset = $(e.target).offset();
          left = (_ref1 = offset.left) != null ? _ref1 : 0;
          top = (_ref2 = offset.top) != null ? _ref2 : 0;
          return e.bokeh = {
            sx: e.srcEvent.pageX - left,
            sy: e.srcEvent.pageY - top
          };
        } else {
          return e.bokeh = {
            sx: e.center.x,
            sy: e.center.y
          };
        }
      };

      Events.prototype._bokify_jq = function(e) {
        var left, offset, top, _ref1, _ref2;
        offset = $(e.currentTarget).offset();
        left = (_ref1 = offset.left) != null ? _ref1 : 0;
        top = (_ref2 = offset.top) != null ? _ref2 : 0;
        return e.bokeh = {
          sx: e.pageX - left,
          sy: e.pageY - top
        };
      };

      Events.prototype._tap = function(e) {
        this._bokify_hammer(e);
        return this._trigger('tap', e);
      };

      Events.prototype._doubletap = function(e) {
        this._bokify_hammer(e);
        return this._trigger('doubletap', e);
      };

      Events.prototype._press = function(e) {
        this._bokify_hammer(e);
        return this._trigger('press', e);
      };

      Events.prototype._pan_start = function(e) {
        this._bokify_hammer(e);
        e.bokeh.sx -= e.deltaX;
        e.bokeh.sy -= e.deltaY;
        return this._trigger('pan:start', e);
      };

      Events.prototype._pan = function(e) {
        this._bokify_hammer(e);
        return this._trigger('pan', e);
      };

      Events.prototype._pan_end = function(e) {
        this._bokify_hammer(e);
        return this._trigger('pan:end', e);
      };

      Events.prototype._pinch_start = function(e) {
        this._bokify_hammer(e);
        return this._trigger('pinch:start', e);
      };

      Events.prototype._pinch = function(e) {
        this._bokify_hammer(e);
        return this._trigger('pinch', e);
      };

      Events.prototype._pinch_end = function(e) {
        this._bokify_hammer(e);
        return this._trigger('pinch:end', e);
      };

      Events.prototype._rotate_start = function(e) {
        this._bokify_hammer(e);
        return this._trigger('rotate:start', e);
      };

      Events.prototype._rotate = function(e) {
        this._bokify_hammer(e);
        return this._trigger('rotate', e);
      };

      Events.prototype._rotate_end = function(e) {
        this._bokify_hammer(e);
        return this._trigger('rotate:end', e);
      };

      Events.prototype._mouse_enter = function(e) {
        this._bokify_jq(e);
        return this.trigger('move:enter', e);
      };

      Events.prototype._mouse_move = function(e) {
        this._bokify_jq(e);
        return this.trigger('move', e);
      };

      Events.prototype._mouse_exit = function(e) {
        this._bokify_jq(e);
        return this.trigger('move:exit', e);
      };

      Events.prototype._mouse_wheel = function(e, delta) {
        this._bokify_jq(e);
        e.bokeh.delta = delta;
        this._trigger('scroll', e);
        e.preventDefault();
        return e.stopPropagation();
      };

      Events.prototype._key_down = function(e) {
        return this.trigger('keydown', e);
      };

      Events.prototype._key_up = function(e) {
        return this.trigger('keyup', e);
      };

      return Events;

    })(Backbone.Model);
  });

}).call(this);

/*
//@ sourceMappingURL=events.js.map
*/