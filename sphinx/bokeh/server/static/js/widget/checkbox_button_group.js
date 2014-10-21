(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["underscore", "common/collection", "jquery", "bootstrap/button", "common/continuum_view", "common/has_parent", "common/logging"], function(_, Collection, $, $1, ContinuumView, HasParent, Logging) {
    var CheckboxButtonGroup, CheckboxButtonGroupView, CheckboxButtonGroups, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    CheckboxButtonGroupView = (function(_super) {
      __extends(CheckboxButtonGroupView, _super);

      function CheckboxButtonGroupView() {
        _ref = CheckboxButtonGroupView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CheckboxButtonGroupView.prototype.tagName = "div";

      CheckboxButtonGroupView.prototype.events = {
        "change input": "change_input"
      };

      CheckboxButtonGroupView.prototype.change_input = function() {
        var active, checkbox, i;
        active = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.$("input");
          _results = [];
          for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
            checkbox = _ref1[i];
            if (checkbox.checked) {
              _results.push(i);
            }
          }
          return _results;
        }).call(this);
        this.mset('active', active);
        return this.model.save();
      };

      CheckboxButtonGroupView.prototype.initialize = function(options) {
        CheckboxButtonGroupView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      CheckboxButtonGroupView.prototype.render = function() {
        this.$el.empty();
        return this;
      };

      CheckboxButtonGroupView.prototype.render = function() {
        var $input, $label, active, i, label, _i, _len, _ref1;
        this.$el.empty();
        this.$el.addClass("bk-bs-btn-group");
        this.$el.attr("data-bk-bs-toggle", "buttons");
        active = this.mget("active");
        _ref1 = this.mget("labels");
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          label = _ref1[i];
          $input = $('<input type="checkbox">').attr({
            value: "" + i
          });
          if (__indexOf.call(active, i) >= 0) {
            $input.prop("checked", true);
          }
          $label = $('<label class="bk-bs-btn"></label>');
          $label.text(label).prepend($input);
          $label.addClass("bk-bs-btn-" + this.mget("type"));
          if (__indexOf.call(active, i) >= 0) {
            $label.addClass("bk-bs-active");
          }
          this.$el.append($label);
        }
        return this;
      };

      return CheckboxButtonGroupView;

    })(ContinuumView);
    CheckboxButtonGroup = (function(_super) {
      __extends(CheckboxButtonGroup, _super);

      function CheckboxButtonGroup() {
        _ref1 = CheckboxButtonGroup.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CheckboxButtonGroup.prototype.type = "CheckboxButtonGroup";

      CheckboxButtonGroup.prototype.default_view = CheckboxButtonGroupView;

      CheckboxButtonGroup.prototype.defaults = function() {
        return _.extend({}, CheckboxButtonGroup.__super__.defaults.call(this), {
          active: [],
          labels: [],
          type: "default",
          disabled: false
        });
      };

      return CheckboxButtonGroup;

    })(HasParent);
    CheckboxButtonGroups = (function(_super) {
      __extends(CheckboxButtonGroups, _super);

      function CheckboxButtonGroups() {
        _ref2 = CheckboxButtonGroups.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      CheckboxButtonGroups.prototype.model = CheckboxButtonGroup;

      return CheckboxButtonGroups;

    })(Collection);
    return {
      Model: CheckboxButtonGroup,
      Collection: new CheckboxButtonGroups(),
      View: CheckboxButtonGroupView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=checkbox_button_group.js.map
*/