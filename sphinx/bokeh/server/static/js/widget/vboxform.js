(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/has_parent", "common/continuum_view", "common/build_views", "common/collection"], function(HasParent, ContinuumView, build_views, Collection) {
    var VBoxForm, VBoxFormView, VBoxForms, vboxforms, _ref, _ref1, _ref2;
    VBoxFormView = (function(_super) {
      __extends(VBoxFormView, _super);

      function VBoxFormView() {
        _ref = VBoxFormView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      VBoxFormView.prototype.tagName = "form";

      VBoxFormView.prototype.attributes = {
        "class": "bk-widget-form",
        role: "form"
      };

      VBoxFormView.prototype.initialize = function(options) {
        VBoxFormView.__super__.initialize.call(this, options);
        this.views = {};
        return this.render();
      };

      VBoxFormView.prototype.render = function() {
        var child, children, key, val, _i, _len, _ref1, _results;
        children = this.mget('children');
        build_views(this.views, children);
        _ref1 = this.views;
        for (key in _ref1) {
          if (!__hasProp.call(_ref1, key)) continue;
          val = _ref1[key];
          val.$el.detach();
        }
        this.$el.empty();
        _results = [];
        for (_i = 0, _len = children.length; _i < _len; _i++) {
          child = children[_i];
          this.$el.append("<br/");
          _results.push(this.$el.append(this.views[child.id].$el));
        }
        return _results;
      };

      return VBoxFormView;

    })(ContinuumView);
    VBoxForm = (function(_super) {
      __extends(VBoxForm, _super);

      function VBoxForm() {
        _ref1 = VBoxForm.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      VBoxForm.prototype.type = "VBoxForm";

      VBoxForm.prototype.default_view = VBoxFormView;

      VBoxForm.prototype.defaults = function() {
        return _.extend({}, VBoxForm.__super__.defaults.call(this), {
          children: []
        });
      };

      return VBoxForm;

    })(HasParent);
    VBoxForms = (function(_super) {
      __extends(VBoxForms, _super);

      function VBoxForms() {
        _ref2 = VBoxForms.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      VBoxForms.prototype.model = VBoxForm;

      return VBoxForms;

    })(Collection);
    vboxforms = new VBoxForms();
    return {
      "Model": VBoxForm,
      "Collection": vboxforms,
      "View": VBoxFormView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=vboxform.js.map
*/