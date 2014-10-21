(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var CountCategories, CountCategoriesView, CountCategoriess, _ref, _ref1, _ref2;
    CountCategoriesView = (function(_super) {
      __extends(CountCategoriesView, _super);

      function CountCategoriesView() {
        _ref = CountCategoriesView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CountCategoriesView.prototype.attributes = {
        "class": "CountCategoriesView"
      };

      CountCategoriesView.prototype.initialize = function(options) {
        CountCategoriesView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      CountCategoriesView.prototype.delegateEvents = function(events) {
        CountCategoriesView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      CountCategoriesView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return CountCategoriesView;

    })(ContinuumView);
    CountCategories = (function(_super) {
      __extends(CountCategories, _super);

      function CountCategories() {
        _ref1 = CountCategories.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CountCategories.prototype.type = "CountCategories";

      CountCategories.prototype.default_view = CountCategoriesView;

      return CountCategories;

    })(HasParent);
    CountCategoriess = (function(_super) {
      __extends(CountCategoriess, _super);

      function CountCategoriess() {
        _ref2 = CountCategoriess.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      CountCategoriess.prototype.model = CountCategories;

      return CountCategoriess;

    })(Collection);
    return {
      "Model": CountCategories,
      "Collection": new CountCategoriess()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=countcategories.js.map
*/