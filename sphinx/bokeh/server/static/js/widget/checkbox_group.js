(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["underscore", "common/collection", "common/continuum_view", "common/has_parent", "common/logging"], function(_, Collection, ContinuumView, HasParent, Logging) {
    var CheckboxGroup, CheckboxGroupView, CheckboxGroups, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    CheckboxGroupView = (function(_super) {
      __extends(CheckboxGroupView, _super);

      function CheckboxGroupView() {
        _ref = CheckboxGroupView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CheckboxGroupView.prototype.tagName = "div";

      CheckboxGroupView.prototype.events = {
        "change input": "change_input"
      };

      CheckboxGroupView.prototype.change_input = function() {
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

      CheckboxGroupView.prototype.initialize = function(options) {
        CheckboxGroupView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      CheckboxGroupView.prototype.render = function() {
        var $div, $input, $label, active, i, label, _i, _len, _ref1;
        this.$el.empty();
        active = this.mget("active");
        _ref1 = this.mget("labels");
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          label = _ref1[i];
          $input = $('<input type="checkbox">').attr({
            value: "" + i
          });
          if (this.mget("disabled")) {
            $input.prop("disabled", true);
          }
          if (__indexOf.call(active, i) >= 0) {
            $input.prop("checked", true);
          }
          $label = $('<label></label>').text(label).prepend($input);
          if (this.mget("inline")) {
            $label.addClass("bk-bs-checkbox-inline");
            this.$el.append($label);
          } else {
            $div = $('<div class="bk-bs-checkbox"></div>').append($label);
            this.$el.append($div);
          }
        }
        return this;
      };

      return CheckboxGroupView;

    })(ContinuumView);
    CheckboxGroup = (function(_super) {
      __extends(CheckboxGroup, _super);

      function CheckboxGroup() {
        _ref1 = CheckboxGroup.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CheckboxGroup.prototype.type = "CheckboxGroup";

      CheckboxGroup.prototype.default_view = CheckboxGroupView;

      CheckboxGroup.prototype.defaults = function() {
        return _.extend({}, CheckboxGroup.__super__.defaults.call(this), {
          active: [],
          labels: [],
          inline: false,
          disabled: false
        });
      };

      return CheckboxGroup;

    })(HasParent);
    CheckboxGroups = (function(_super) {
      __extends(CheckboxGroups, _super);

      function CheckboxGroups() {
        _ref2 = CheckboxGroups.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      CheckboxGroups.prototype.model = CheckboxGroup;

      return CheckboxGroups;

    })(Collection);
    return {
      Model: CheckboxGroup,
      Collection: new CheckboxGroups(),
      View: CheckboxGroupView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=checkbox_group.js.map
*/