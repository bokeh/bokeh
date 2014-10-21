(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/has_parent", "common/continuum_view", "common/collection", "underscore", "./multiselecttemplate"], function(HasParent, ContinuumView, Collection, _, multiselecttemplate) {
    var MultiSelect, MultiSelectView, MultiSelects, multiselectboxes, _ref, _ref1, _ref2;
    MultiSelectView = (function(_super) {
      __extends(MultiSelectView, _super);

      function MultiSelectView() {
        _ref = MultiSelectView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      MultiSelectView.prototype.events = {
        "change select": "change_input"
      };

      MultiSelectView.prototype.change_input = function() {
        this.mset('value', this.$('select').val(), {
          'silent': true
        });
        return this.model.save();
      };

      MultiSelectView.prototype.tagName = "div";

      MultiSelectView.prototype.template = multiselecttemplate;

      MultiSelectView.prototype.initialize = function(options) {
        MultiSelectView.__super__.initialize.call(this, options);
        this.render();
        this.listenTo(this.model, 'change:value', this.render_selection);
        this.listenTo(this.model, 'change:options', this.render);
        this.listenTo(this.model, 'change:name', this.render);
        return this.listenTo(this.model, 'change:title', this.render);
      };

      MultiSelectView.prototype.render = function() {
        var html;
        this.$el.empty();
        html = this.template(this.model.attributes);
        this.$el.html(html);
        this.render_selection();
        return this;
      };

      MultiSelectView.prototype.render_selection = function() {
        var values;
        values = {};
        _.map(this.mget('value'), function(x) {
          return values[x] = true;
        });
        return this.$('option').each(function(el) {
          el = $(el);
          if (values[el.attr('value')]) {
            return el.attr('selected', 'selected');
          }
        });
      };

      return MultiSelectView;

    })(ContinuumView);
    MultiSelect = (function(_super) {
      __extends(MultiSelect, _super);

      function MultiSelect() {
        _ref1 = MultiSelect.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      MultiSelect.prototype.type = "MultiSelect";

      MultiSelect.prototype.default_view = MultiSelectView;

      MultiSelect.prototype.defaults = function() {
        return _.extend({}, MultiSelect.__super__.defaults.call(this), {
          title: '',
          value: [],
          options: []
        });
      };

      return MultiSelect;

    })(HasParent);
    MultiSelects = (function(_super) {
      __extends(MultiSelects, _super);

      function MultiSelects() {
        _ref2 = MultiSelects.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      MultiSelects.prototype.model = MultiSelect;

      return MultiSelects;

    })(Collection);
    multiselectboxes = new MultiSelects();
    return {
      "Model": MultiSelect,
      "Collection": multiselectboxes,
      "View": MultiSelectView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=multiselect.js.map
*/