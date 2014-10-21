(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["backbone", "tool/tool", "./inspect_tool_list_item_template"], function(Backbone, Tool, inspect_tool_list_item_template) {
    var InspectTool, InspectToolListItemView, InspectToolView, _ref, _ref1, _ref2;
    InspectToolListItemView = (function(_super) {
      __extends(InspectToolListItemView, _super);

      function InspectToolListItemView() {
        _ref = InspectToolListItemView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      InspectToolListItemView.prototype.className = "bk-toolbar-inspector";

      InspectToolListItemView.prototype.template = inspect_tool_list_item_template;

      InspectToolListItemView.prototype.events = {
        'click [type="checkbox"]': '_clicked'
      };

      InspectToolListItemView.prototype.initialize = function(options) {
        this.listenTo(this.model, 'change:active', this.render);
        return this.render();
      };

      InspectToolListItemView.prototype.render = function() {
        this.$el.html(this.template(this.model.attrs_and_props()));
        return this;
      };

      InspectToolListItemView.prototype._clicked = function(e) {
        var active;
        active = this.model.get('active');
        return this.model.set('active', !active);
      };

      return InspectToolListItemView;

    })(Backbone.View);
    InspectToolView = (function(_super) {
      __extends(InspectToolView, _super);

      function InspectToolView() {
        _ref1 = InspectToolView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      return InspectToolView;

    })(Tool.View);
    InspectTool = (function(_super) {
      __extends(InspectTool, _super);

      function InspectTool() {
        _ref2 = InspectTool.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      InspectTool.prototype.event_type = "move";

      InspectTool.prototype.bind_bokeh_events = function() {
        InspectTool.__super__.bind_bokeh_events.call(this);
        return this.listenTo(events, 'move', this._inspect);
      };

      InspectTool.prototype.initialize = function(attrs, options) {
        var all_renderers, names, r, renderers;
        InspectTool.__super__.initialize.call(this, attrs, options);
        names = this.get('names');
        renderers = this.get('renderers');
        if (renderers.length === 0) {
          all_renderers = this.get('plot').get('renderers');
          renderers = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = all_renderers.length; _i < _len; _i++) {
              r = all_renderers[_i];
              if (r.type === "Glyph") {
                _results.push(r);
              }
            }
            return _results;
          })();
        }
        if (names.length > 0) {
          renderers = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = renderers.length; _i < _len; _i++) {
              r = renderers[_i];
              if (names.indexOf(r.get('name')) >= 0) {
                _results.push(r);
              }
            }
            return _results;
          })();
        }
        return this.set('renderers', renderers);
      };

      InspectTool.prototype._inspect = function(vx, vy, e) {};

      InspectTool.prototype._exit_inner = function() {};

      InspectTool.prototype._exit_outer = function() {};

      InspectTool.prototype.defaults = function() {
        return _.extend({}, InspectTool.__super__.defaults.call(this), {
          renderers: [],
          names: [],
          inner_only: true,
          active: true,
          event_type: 'move'
        });
      };

      return InspectTool;

    })(Tool.Model);
    return {
      "Model": InspectTool,
      "View": InspectToolView,
      "ListItemView": InspectToolListItemView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=inspect_tool.js.map
*/