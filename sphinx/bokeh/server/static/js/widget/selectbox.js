(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "underscore", "common/continuum_view", "common/has_parent", "common/logging", "./selecttemplate"], function(Collection, build_views, ContinuumView, HasParent, Logging, template) {
    var Select, SelectView, Selects, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    SelectView = (function(_super) {
      __extends(SelectView, _super);

      function SelectView() {
        _ref = SelectView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SelectView.prototype.tagName = "div";

      SelectView.prototype.template = template;

      SelectView.prototype.events = {
        "change select": "change_input"
      };

      SelectView.prototype.change_input = function() {
        var value;
        value = this.$('select').val();
        logger.debug("selectbox: value = " + value);
        this.mset('value', value);
        return this.model.save();
      };

      SelectView.prototype.initialize = function(options) {
        SelectView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      SelectView.prototype.render = function() {
        var html;
        this.$el.empty();
        html = this.template(this.model.attributes);
        this.$el.html(html);
        return this;
      };

      return SelectView;

    })(ContinuumView);
    Select = (function(_super) {
      __extends(Select, _super);

      function Select() {
        _ref1 = Select.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Select.prototype.type = "Select";

      Select.prototype.default_view = SelectView;

      Select.prototype.defaults = function() {
        return _.extend({}, Select.__super__.defaults.call(this), {
          title: '',
          value: '',
          options: []
        });
      };

      return Select;

    })(HasParent);
    Selects = (function(_super) {
      __extends(Selects, _super);

      function Selects() {
        _ref2 = Selects.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Selects.prototype.model = Select;

      return Selects;

    })(Collection);
    return {
      Model: Select,
      Collection: new Selects(),
      View: SelectView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=selectbox.js.map
*/