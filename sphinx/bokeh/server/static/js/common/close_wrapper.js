(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./continuum_view"], function(_, ContinuumView) {
    var CloseWrapper, _ref;
    CloseWrapper = (function(_super) {
      __extends(CloseWrapper, _super);

      function CloseWrapper() {
        _ref = CloseWrapper.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CloseWrapper.prototype.attributes = {
        "class": "bk-closewrapper"
      };

      CloseWrapper.prototype.delegateEvents = function(events) {
        return CloseWrapper.__super__.delegateEvents.call(this, events);
      };

      CloseWrapper.prototype.events = {
        "click .bk-close": "close"
      };

      CloseWrapper.prototype.close = function(options) {
        this.view.remove();
        return this.remove();
      };

      CloseWrapper.prototype.initialize = function(options) {
        CloseWrapper.__super__.initialize.call(this, options);
        this.view = options.view;
        return this.render();
      };

      CloseWrapper.prototype.render = function() {
        this.view.$el.detach();
        this.$el.empty();
        this.$el.html("<a href='#' class='bk-close'>[x]</a>");
        return this.$el.append(this.view.$el);
      };

      return CloseWrapper;

    })(ContinuumView);
    return {
      View: CloseWrapper
    };
  });

}).call(this);

/*
//@ sourceMappingURL=close_wrapper.js.map
*/