(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/has_parent", "common/continuum_view", "common/build_views", "common/collection"], function(HasParent, ContinuumView, build_views, Collection) {
    var HBox, HBoxView, HBoxes, hboxes, _ref, _ref1, _ref2;
    HBoxView = (function(_super) {
      __extends(HBoxView, _super);

      function HBoxView() {
        _ref = HBoxView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HBoxView.prototype.tag = "div";

      HBoxView.prototype.attributes = {
        "class": "bk-hbox"
      };

      HBoxView.prototype.initialize = function(options) {
        HBoxView.__super__.initialize.call(this, options);
        this.views = {};
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      HBoxView.prototype.render = function() {
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

      return HBoxView;

    })(ContinuumView);
    HBox = (function(_super) {
      __extends(HBox, _super);

      function HBox() {
        _ref1 = HBox.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      HBox.prototype.type = "HBox";

      HBox.prototype.default_view = HBoxView;

      HBox.prototype.defaults = function() {
        return _.extend({}, HBox.__super__.defaults.call(this), {
          children: []
        });
      };

      return HBox;

    })(HasParent);
    HBoxes = (function(_super) {
      __extends(HBoxes, _super);

      function HBoxes() {
        _ref2 = HBoxes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      HBoxes.prototype.model = HBox;

      return HBoxes;

    })(Collection);
    hboxes = new HBoxes();
    return {
      "Model": HBox,
      "Collection": hboxes,
      "View": HBoxView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=hbox.js.map
*/