(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/continuum_view", "common/has_parent", "common/logging"], function(_, Collection, ContinuumView, HasParent, Logging) {
    var RadioGroup, RadioGroupView, RadioGroups, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    RadioGroupView = (function(_super) {
      __extends(RadioGroupView, _super);

      function RadioGroupView() {
        _ref = RadioGroupView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      RadioGroupView.prototype.tagName = "div";

      RadioGroupView.prototype.events = {
        "change input": "change_input"
      };

      RadioGroupView.prototype.change_input = function() {
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

      RadioGroupView.prototype.initialize = function(options) {
        RadioGroupView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      RadioGroupView.prototype.render = function() {
        var $div, $input, $label, active, i, label, name, _i, _len, _ref1;
        this.$el.empty();
        name = _.uniqueId("RadioGroup");
        active = this.mget("active");
        _ref1 = this.mget("labels");
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          label = _ref1[i];
          $input = $('<input type="radio">').attr({
            name: name,
            value: "" + i
          });
          if (this.mget("disabled")) {
            $input.prop("disabled", true);
          }
          if (i === active) {
            $input.prop("checked", true);
          }
          $label = $('<label></label>').text(label).prepend($input);
          if (this.mget("inline")) {
            $label.addClass("bk-bs-radio-inline");
            this.$el.append($label);
          } else {
            $div = $('<div class="bk-bs-radio"></div>').append($label);
            this.$el.append($div);
          }
        }
        return this;
      };

      return RadioGroupView;

    })(ContinuumView);
    RadioGroup = (function(_super) {
      __extends(RadioGroup, _super);

      function RadioGroup() {
        _ref1 = RadioGroup.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      RadioGroup.prototype.type = "RadioGroup";

      RadioGroup.prototype.default_view = RadioGroupView;

      RadioGroup.prototype.defaults = function() {
        return _.extend({}, RadioGroup.__super__.defaults.call(this), {
          active: null,
          labels: [],
          inline: false,
          disabled: false
        });
      };

      return RadioGroup;

    })(HasParent);
    RadioGroups = (function(_super) {
      __extends(RadioGroups, _super);

      function RadioGroups() {
        _ref2 = RadioGroups.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      RadioGroups.prototype.model = RadioGroup;

      return RadioGroups;

    })(Collection);
    return {
      Model: RadioGroup,
      Collection: new RadioGroups(),
      View: RadioGroupView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=radio_group.js.map
*/