(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "jstree", "common/collection", "common/continuum_view", "common/has_properties", "common/logging", "source/column_data_source"], function(_, $, $1, Collection, ContinuumView, HasProperties, Logging, ColumnDataSource) {
    var ObjectExplorer, ObjectExplorerView, ObjectExplorers, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    ObjectExplorerView = (function(_super) {
      __extends(ObjectExplorerView, _super);

      function ObjectExplorerView() {
        this.createContextMenu = __bind(this.createContextMenu, this);
        this.onEvent = __bind(this.onEvent, this);
        _ref = ObjectExplorerView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ObjectExplorerView.prototype.initialize = function(options) {
        ObjectExplorerView.__super__.initialize.call(this, options);
        this.onEvent = _.debounce(this.onEvent, options.debounce || 200);
        this.showToolbar = options.showToolbar || false;
        this.arrayLimit = options.arrayLimit || 100;
        return this.render();
      };

      ObjectExplorerView.prototype.base = function() {
        if (this._base == null) {
          this._base = require("common/base");
        }
        return this._base;
      };

      ObjectExplorerView.prototype.resolve_ref = function(ref) {
        return this.base().Collections(ref.type).get(ref.id);
      };

      ObjectExplorerView.prototype.delegateEvents = function(events) {
        var type, _i, _len, _ref1, _results;
        ObjectExplorerView.__super__.delegateEvents.call(this, events);
        _ref1 = _.keys(this.base().locations);
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          type = _ref1[_i];
          _results.push(this.base().Collections(type).on("all", this.onEvent));
        }
        return _results;
      };

      ObjectExplorerView.prototype.onEvent = function(event) {
        return this.reRender();
      };

      ObjectExplorerView.prototype.createTree = function(nonempty) {
        var children, collection, node, nodes, type, _i, _len, _results;
        if (nonempty == null) {
          nonempty = true;
        }
        nodes = (function() {
          var _i, _len, _ref1, _results,
            _this = this;
          _ref1 = _.keys(this.base().locations);
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            type = _ref1[_i];
            collection = this.base().Collections(type);
            children = collection.map(function(obj, index) {
              var visited;
              visited = {};
              visited[obj.id] = 1;
              return _this.descend(index, obj, visited);
            });
            _results.push(this.node(type, collection, null, children));
          }
          return _results;
        }).call(this);
        if (nonempty) {
          _results = [];
          for (_i = 0, _len = nodes.length; _i < _len; _i++) {
            node = nodes[_i];
            if (node.children.length > 0) {
              _results.push(node);
            }
          }
          return _results;
        } else {
          return nodes;
        }
      };

      ObjectExplorerView.prototype.descend = function(label, obj, visited) {
        var arrayLimit, attr, children, color, html, icon, index, key, ref, truncate, type, value, _ref1;
        if (this.isRef(obj)) {
          ref = true;
          if (visited[obj.id] == null) {
            obj = this.base().Collections(obj.type).get(obj.id);
          } else {
            logger.info("object_explorer:descend Cyclic reference to " + obj.type + ":" + obj.id);
          }
        }
        if (obj instanceof HasProperties) {
          visited = _.clone(visited);
          visited[obj.id] = 1;
          children = (function() {
            var _ref1, _results;
            _ref1 = obj.attributes;
            _results = [];
            for (attr in _ref1) {
              if (!__hasProp.call(_ref1, attr)) continue;
              value = _ref1[attr];
              if (this.isAttr(attr)) {
                _results.push(this.descend(attr, value, visited));
              }
            }
            return _results;
          }).call(this);
          type = obj.type;
          icon = "object";
          value = null;
          color = null;
        } else if (_.isArray(obj)) {
          truncate = obj.length > this.arrayLimit;
          arrayLimit = this.arrayLimit || obj.length;
          children = (function() {
            var _i, _len, _ref1, _results;
            _ref1 = obj.slice(0, +this.arrayLimit + 1 || 9e9);
            _results = [];
            for (index = _i = 0, _len = _ref1.length; _i < _len; index = ++_i) {
              value = _ref1[index];
              _results.push(this.descend(index, value, visited));
            }
            return _results;
          }).call(this);
          type = ("Array[" + obj.length + "]") + (truncate ? " (showing first " + this.arrayLimit + " items)" : "");
          icon = "array";
          value = null;
          color = null;
        } else if (_.isObject(obj)) {
          children = (function() {
            var _results;
            _results = [];
            for (key in obj) {
              if (!__hasProp.call(obj, key)) continue;
              value = obj[key];
              _results.push(this.descend(key, value, visited));
            }
            return _results;
          }).call(this);
          type = "Object[" + (_.keys(obj).length) + "]";
          icon = "object";
          value = null;
          color = null;
        } else {
          children = [];
          _ref1 = _.isUndefined(obj) ? [null, "object", null, 'orchid'] : _.isNull(obj) ? [null, "object", null, 'teal'] : _.isBoolean(obj) ? ["Boolean", "boolean", null, 'darkmagenta'] : _.isNumber(obj) ? ["Number", "number", null, 'green'] : _.isString(obj) ? ["String", "string", "\"" + obj + "\"", 'firebrick'] : _.isFunction(obj) ? ["Function", "function", null, null] : _.isDate(obj) ? ["Date", "date", null, null] : _.isRegExp(obj) ? ["RegExp", "regexp", null, null] : _.isElement(obj) ? ["Element", "domnode", null, null] : [typeof obj, "object", null, null], type = _ref1[0], icon = _ref1[1], value = _ref1[2], color = _ref1[3];
          if (value == null) {
            value = "" + obj;
          }
          if (color == null) {
            color = "black";
          }
        }
        html = ["<span style=\"color:gray\">" + label + "</span>"];
        if (type != null) {
          html = html.concat([": ", "<span style=\"color:blue\">" + type + (ref ? "<span style=\"color:red\">*</span>" : "") + "</span>"]);
        }
        if (value != null) {
          html = html.concat([" = ", "<span style=\"color:" + color + "\">" + value + "</span>"]);
        }
        return this.node(html.join(""), obj, icon, children);
      };

      ObjectExplorerView.prototype.isRef = function(obj) {
        return _.isObject(obj) && (_.isEqual(_.keys(obj), ["id", "type"]) || _.isEqual(_.keys(obj), ["type", "id"]));
      };

      ObjectExplorerView.prototype.isAttr = function(attr) {
        return attr.length > 0 && attr[0] !== '_';
      };

      ObjectExplorerView.prototype.node = function(text, obj, icon, children, open) {
        return {
          text: text,
          data: {
            obj: obj instanceof HasProperties ? {
              type: obj.type,
              id: obj.id
            } : null
          },
          icon: icon ? "bk-icon-type-" + icon : null,
          children: children || [],
          state: {
            open: open || false
          }
        };
      };

      ObjectExplorerView.prototype.renderToolbar = function() {
        var $refresh, $toolbar,
          _this = this;
        $toolbar = $('<div class="bk-bs-btn-group"></div>');
        $refresh = $('<button type="button" class="bk-bs-btn bk-bs-btn-default">Refresh</button>');
        $refresh.click(function(event) {
          return _this.reRender();
        });
        $toolbar.append($refresh);
        if (!this.showToolbar) {
          $toolbar.hide();
        }
        return $toolbar;
      };

      ObjectExplorerView.prototype.themeUrl = function() {
        return null;
      };

      ObjectExplorerView.prototype.createContextMenu = function(node) {
        var data, menu;
        data = node.original;
        menu = {};
        return menu;
      };

      ObjectExplorerView.prototype.renderTree = function() {
        var tree,
          _this = this;
        tree = $('<div/>');
        tree.on('changed.jstree', function(event, data) {
          var i, obj, ref, _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = data.selected.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            ref = data.instance.get_node(data.selected[i]).data.ref;
            if (ref != null) {
              obj = _this.resolve_ref(ref);
              if (obj instanceof ColumnDataSource.Model && (_this.mget("data_widget") != null)) {
                _results.push(_this.mget("data_widget").set_obj("source", obj));
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        });
        tree.jstree({
          core: {
            data: this.createTree(),
            themes: {
              url: this.themeUrl()
            }
          },
          contextmenu: {
            items: this.createContextMenu
          },
          plugins: ["contextmenu"]
        });
        return tree;
      };

      ObjectExplorerView.prototype.render = function() {
        this.$toolbar = this.renderToolbar();
        this.$tree = this.renderTree();
        return this.$el.append([this.$toolbar, this.$tree]);
      };

      ObjectExplorerView.prototype.reRender = function() {
        this.$tree.jstree('destroy');
        this.$el.empty();
        return this.render();
      };

      return ObjectExplorerView;

    })(ContinuumView);
    ObjectExplorer = (function(_super) {
      __extends(ObjectExplorer, _super);

      function ObjectExplorer() {
        _ref1 = ObjectExplorer.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ObjectExplorer.prototype.type = 'ObjectExplorer';

      ObjectExplorer.prototype.default_view = ObjectExplorerView;

      ObjectExplorer.prototype.defaults = function() {
        return _.extend({}, ObjectExplorer.__super__.defaults.call(this), {
          data_widget: null
        });
      };

      return ObjectExplorer;

    })(HasProperties);
    ObjectExplorers = (function(_super) {
      __extends(ObjectExplorers, _super);

      function ObjectExplorers() {
        _ref2 = ObjectExplorers.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ObjectExplorers.prototype.model = ObjectExplorer;

      return ObjectExplorers;

    })(Collection);
    return {
      Model: ObjectExplorer,
      Collection: new ObjectExplorers(),
      View: ObjectExplorerView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=object_explorer.js.map
*/