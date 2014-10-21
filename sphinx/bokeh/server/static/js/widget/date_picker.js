(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "jquery_ui/datepicker", "common/collection", "common/continuum_view", "common/has_properties"], function(_, $, $1, Collection, ContinuumView, HasProperties) {
    var DatePicker, DatePickerView, DatePickers, _ref, _ref1, _ref2;
    DatePickerView = (function(_super) {
      __extends(DatePickerView, _super);

      function DatePickerView() {
        this.onSelect = __bind(this.onSelect, this);
        _ref = DatePickerView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DatePickerView.prototype.initialize = function(options) {
        DatePickerView.__super__.initialize.call(this, options);
        return this.render();
      };

      DatePickerView.prototype.render = function() {
        var $datepicker, $label;
        this.$el.empty();
        $label = $('<label>').text(this.mget("title"));
        $datepicker = $("<div>").datepicker({
          defaultDate: new Date(this.mget('value')),
          minDate: this.mget('min_date') != null ? new Date(this.mget('min_date')) : null,
          maxDate: this.mget('max_date') != null ? new Date(this.mget('max_date')) : null,
          onSelect: this.onSelect
        });
        return this.$el.append([$label, $datepicker]);
      };

      DatePickerView.prototype.onSelect = function(dateText, ui) {
        this.mset('value', new Date(dateText));
        return this.model.save();
      };

      return DatePickerView;

    })(ContinuumView);
    DatePicker = (function(_super) {
      __extends(DatePicker, _super);

      function DatePicker() {
        _ref1 = DatePicker.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DatePicker.prototype.type = "DatePicker";

      DatePicker.prototype.default_view = DatePickerView;

      DatePicker.prototype.defaults = function() {
        return _.extend({}, DatePicker.__super__.defaults.call(this), {
          value: Date.now()
        });
      };

      return DatePicker;

    })(HasProperties);
    DatePickers = (function(_super) {
      __extends(DatePickers, _super);

      function DatePickers() {
        _ref2 = DatePickers.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      DatePickers.prototype.model = DatePicker;

      return DatePickers;

    })(Collection);
    return {
      Model: DatePicker,
      Collection: new DatePickers(),
      View: DatePickerView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=date_picker.js.map
*/