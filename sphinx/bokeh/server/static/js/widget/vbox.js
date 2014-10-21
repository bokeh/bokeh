(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/has_parent", "common/continuum_view", "common/build_views", "common/collection"], function(HasParent, ContinuumView, build_views, Collection) {
    var VBox, VBoxView, VBoxes, vboxes, _ref, _ref1, _ref2;
    VBoxView = (function(_super) {
      __extends(VBoxView, _super);

      function VBoxView() {
        _ref = VBoxView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      VBoxView.prototype.tag = "div";

      VBoxView.prototype.attributes = {
        "class": "bk-vbox"
      };

      VBoxView.prototype.initialize = function(options) {
        VBoxView.__super__.initialize.call(this, options);
        this.views = {};
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      VBoxView.prototype.render = function() {
        var child, children, height, key, val, width, _i, _len, _ref1, _results;
        children = this.mget('children');
        build_views(this.views, children);
        _ref1 = this.views;
        for (key in _ref1) {
          if (!__hasProp.call(_ref1, key)) continue;
          val = _ref1[key];
          val.$el.detach();
        }
        this.$el.empty();
        width = this.mget("width");
        if (width != null) {
          this.$el.css({
            width: width + "px"
          });
        }
        height = this.mget("height");
        if (height != null) {
          this.$el.css({
            height: height + "px"
          });
        }
        _results = [];
        for (_i = 0, _len = children.length; _i < _len; _i++) {
          child = children[_i];
          _results.push(this.$el.append(this.views[child.id].$el));
        }
        return _results;
      };

      return VBoxView;

    })(ContinuumView);
    VBox = (function(_super) {
      __extends(VBox, _super);

      function VBox() {
        _ref1 = VBox.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      VBox.prototype.type = "VBox";

      VBox.prototype.default_view = VBoxView;

      VBox.prototype.defaults = function() {
        return _.extend({}, VBox.__super__.defaults.call(this), {
          children: []
        });
      };

      return VBox;

    })(HasParent);
    VBoxes = (function(_super) {
      __extends(VBoxes, _super);

      function VBoxes() {
        _ref2 = VBoxes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      VBoxes.prototype.model = VBox;

      return VBoxes;

    })(Collection);
    vboxes = new VBoxes();
    return {
      "Model": VBox,
      "Collection": vboxes,
      "View": VBoxView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=vbox.js.map
*/