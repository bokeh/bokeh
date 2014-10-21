(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "jquery", "bootstrap/button", "common/continuum_view", "common/has_parent", "common/logging", "bootstrap/button"], function(_, Collection, $, $1, ContinuumView, HasParent, Logging) {
    var RadioButtonGroup, RadioButtonGroupView, RadioButtonGroups, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    RadioButtonGroupView = (function(_super) {
      __extends(RadioButtonGroupView, _super);

      function RadioButtonGroupView() {
        _ref = RadioButtonGroupView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      RadioButtonGroupView.prototype.tagName = "div";

      RadioButtonGroupView.prototype.events = {
        "change input": "change_input"
      };

      RadioButtonGroupView.prototype.change_input = function() {
        var active, i, radio;
        active = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.$("input");
          _results = [];
          for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
            radio = _ref1[i];
            if (radio.checked) {
              _results.push(i);
            }
          }
          return _results;
        }).call(this);
        this.mset('active', active[0]);
        return this.model.save();
      };

      RadioButtonGroupView.prototype.initialize = function(options) {
        RadioButtonGroupView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      RadioButtonGroupView.prototype.render = function() {
        var $input, $label, active, i, label, name, _i, _len, _ref1;
        this.$el.empty();
        this.$el.addClass("bk-bs-btn-group");
        this.$el.attr("data-bk-bs-toggle", "buttons");
        name = _.uniqueId("RadioButtonGroup");
        active = this.mget("active");
        _ref1 = this.mget("labels");
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          label = _ref1[i];
          $input = $('<input type="radio">').attr({
            name: name,
            value: "" + i
          });
          if (i === active) {
            $input.prop("checked", true);
          }
          $label = $('<label class="bk-bs-btn"></label>');
          $label.text(label).prepend($input);
          $label.addClass("bk-bs-btn-" + this.mget("type"));
          if (i === active) {
            $label.addClass("bk-bs-active");
          }
          this.$el.append($label);
        }
        return this;
      };

      return RadioButtonGroupView;

    })(ContinuumView);
    RadioButtonGroup = (function(_super) {
      __extends(RadioButtonGroup, _super);

      function RadioButtonGroup() {
        _ref1 = RadioButtonGroup.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      RadioButtonGroup.prototype.type = "RadioButtonGroup";

      RadioButtonGroup.prototype.default_view = RadioButtonGroupView;

      RadioButtonGroup.prototype.defaults = function() {
        return _.extend({}, RadioButtonGroup.__super__.defaults.call(this), {
          active: null,
          labels: [],
          type: "default",
          disabled: false
        });
      };

      return RadioButtonGroup;

    })(HasParent);
    RadioButtonGroups = (function(_super) {
      __extends(RadioButtonGroups, _super);

      function RadioButtonGroups() {
        _ref2 = RadioButtonGroups.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      RadioButtonGroups.prototype.model = RadioButtonGroup;

      return RadioButtonGroups;

    })(Collection);
    return {
      Model: RadioButtonGroup,
      Collection: new RadioButtonGroups(),
      View: RadioButtonGroupView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=radio_button_group.js.map
*/