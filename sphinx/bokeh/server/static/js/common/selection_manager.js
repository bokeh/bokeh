(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./has_properties", "./logging", "./selector"], function(_, HasProperties, Logging, Selector) {
    var SelectionManager, logger, _ref;
    logger = Logging.logger;
    return SelectionManager = (function(_super) {
      __extends(SelectionManager, _super);

      function SelectionManager() {
        _ref = SelectionManager.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SelectionManager.prototype.type = 'SelectionManager';

      SelectionManager.prototype.initialize = function(attrs, options) {
        SelectionManager.__super__.initialize.call(this, attrs, options);
        return this.selectors = {};
      };

      SelectionManager.prototype.set_selection = function(indices) {
        this._save(null, indices);
        return source.trigger('select');
      };

      SelectionManager.prototype.select = function(tool, renderer_view, geometry, final, append) {
        var indices, selector, source;
        if (append == null) {
          append = false;
        }
        source = this.get('source');
        if (source !== renderer_view.mget('data_source')) {
          logger.warn('select called with mis-matched data sources');
        }
        indices = renderer_view.hit_test(geometry);
        selector = this._get_selector(tool);
        selector.update(indices, geometry, final, append);
        this._save(selector, selector.get('indices'));
        source.trigger('select');
        return source.trigger('select-' + renderer_view.mget('id'));
      };

      SelectionManager.prototype.inspect = function(tool, renderer_view, geometry, data) {
        var indices, source;
        source = this.get('source');
        if (source !== renderer_view.mget('data_source')) {
          logger.warn('inspect called with mis-matched data sources');
        }
        indices = renderer_view.hit_test(geometry);
        if (indices != null) {
          source.trigger('inspect', indices, tool, renderer_view, source, data);
          return source.trigger('inspect' + renderer_view.mget('id'), indices, tool, renderer_view, source, data);
        }
      };

      SelectionManager.prototype.clear = function(tool) {
        var selector;
        if (tool != null) {
          selector = this._get_selector(tool);
          selector.clear();
        }
        return this._save(null, []);
      };

      SelectionManager.prototype._get_selector = function(tool) {
        _.setdefault(this.selectors, tool.model.id, new Selector());
        return this.selectors[tool.model.id];
      };

      SelectionManager.prototype._save = function(selector, indices) {
        return this.get('source').save({
          "selector": selector,
          "selected": indices
        }, {
          patch: true
        });
      };

      return SelectionManager;

    })(HasProperties);
  });

}).call(this);

/*
//@ sourceMappingURL=selection_manager.js.map
*/