(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["./gesture_tool"], function(GestureTool) {
    var SelectTool, SelectToolView, _ref, _ref1;
    SelectToolView = (function(_super) {
      __extends(SelectToolView, _super);

      function SelectToolView() {
        _ref = SelectToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SelectToolView.prototype._keyup = function(e) {
        var ds, r, sm, _i, _len, _ref1, _results;
        if (e.keyCode === 27) {
          _ref1 = this.mget('renderers');
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            r = _ref1[_i];
            ds = r.get('data_source');
            sm = ds.get('selection_manager');
            _results.push(sm.clear());
          }
          return _results;
        }
      };

      return SelectToolView;

    })(GestureTool.View);
    SelectTool = (function(_super) {
      __extends(SelectTool, _super);

      function SelectTool() {
        _ref1 = SelectTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      SelectTool.prototype.initialize = function(attrs, options) {
        var all_renderers, names, r, renderers;
        SelectTool.__super__.initialize.call(this, attrs, options);
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

      SelectTool.prototype.defaults = function() {
        return _.extend({}, SelectTool.__super__.defaults.call(this), {
          renderers: [],
          names: [],
          multi_select_modifier: "shift"
        });
      };

      return SelectTool;

    })(GestureTool.Model);
    return {
      "Model": SelectTool,
      "View": SelectToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=select_tool.js.map
*/