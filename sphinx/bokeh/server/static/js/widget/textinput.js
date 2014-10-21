(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "common/build_views", "common/continuum_view", "common/has_parent", "common/logging", "./textinputtemplate"], function(Collection, build_views, ContinuumView, HasParent, Logging, template) {
    var TextInput, TextInputView, TextInputs, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    TextInputView = (function(_super) {
      __extends(TextInputView, _super);

      function TextInputView() {
        _ref = TextInputView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TextInputView.prototype.tagName = "div";

      TextInputView.prototype.attributes = {
        "class": "bk-widget-form-group"
      };

      TextInputView.prototype.template = template;

      TextInputView.prototype.events = {
        "change input": "change_input"
      };

      TextInputView.prototype.change_input = function() {
        var value;
        value = this.$('input').val();
        logger.debug("textinput: value = " + value);
        this.mset('value', value);
        return this.model.save();
      };

      TextInputView.prototype.initialize = function(options) {
        TextInputView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      TextInputView.prototype.render = function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
      };

      return TextInputView;

    })(ContinuumView);
    TextInput = (function(_super) {
      __extends(TextInput, _super);

      function TextInput() {
        _ref1 = TextInput.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      TextInput.prototype.type = "TextInput";

      TextInput.prototype.default_view = TextInputView;

      TextInput.prototype.defaults = function() {
        return _.extend({}, TextInput.__super__.defaults.call(this), {
          name: "",
          value: "",
          title: ""
        });
      };

      return TextInput;

    })(HasParent);
    TextInputs = (function(_super) {
      __extends(TextInputs, _super);

      function TextInputs() {
        _ref2 = TextInputs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      TextInputs.prototype.model = TextInput;

      return TextInputs;

    })(Collection);
    return {
      Model: TextInput,
      Collection: new TextInputs()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=textinput.js.map
*/