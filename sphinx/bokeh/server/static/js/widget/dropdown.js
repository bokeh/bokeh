(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/continuum_view", "common/has_parent", "common/logging"], function(_, Collection, ContinuumView, HasParent, Logging) {
    var Dropdown, DropdownView, Dropdowns, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    DropdownView = (function(_super) {
      __extends(DropdownView, _super);

      function DropdownView() {
        _ref = DropdownView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DropdownView.prototype.tagName = "div";

      DropdownView.prototype.change_input = function(action) {
        this.mset('action', action);
        return this.model.save();
      };

      DropdownView.prototype.initialize = function(options) {
        DropdownView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      DropdownView.prototype.render = function() {
        var $a, $button, $caret, $divider, $item, $menu, $toggle, action, item, label, split, _i, _len, _ref1,
          _this = this;
        this.$el.empty();
        split = this.mget("default_action") != null;
        $button = $('<button></button>');
        $button.addClass("bk-bs-btn");
        $button.addClass("bk-bs-btn-" + this.mget("type"));
        $button.text(this.mget("label"));
        $caret = $('<span class="bk-bs-caret"></span>');
        if (!split) {
          $button.addClass("bk-bs-dropdown-toggle");
          $button.attr("data-bk-bs-toggle", "dropdown");
          $button.append(document.createTextNode(" "));
          $button.append($caret);
          $toggle = $('');
        } else {
          $button.click(function() {
            return _this.change_input(_this.mget("default_action"));
          });
          $toggle = $('<button></button>');
          $toggle.addClass("bk-bs-btn");
          $toggle.addClass("bk-bs-btn-" + this.mget("type"));
          $toggle.addClass("bk-bs-dropdown-toggle");
          $toggle.attr("data-bk-bs-toggle", "dropdown");
          $toggle.append($caret);
        }
        $menu = $('<ul class="bk-bs-dropdown-menu"></ul>');
        $divider = $('<li class="bk-bs-divider"></li>');
        _ref1 = this.mget("menu");
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          item = _ref1[_i];
          $item = item != null ? ((label = item[0], action = item[1], item), $a = $('<a></a>').text(label), $a.click(function() {
            return _this.change_input(action);
          }), $('<li></li>').append($a)) : $divider;
          $menu.append($item);
        }
        this.$el.addClass("bk-bs-btn-group");
        this.$el.append([$button, $toggle, $menu]);
        return this;
      };

      return DropdownView;

    })(ContinuumView);
    Dropdown = (function(_super) {
      __extends(Dropdown, _super);

      function Dropdown() {
        _ref1 = Dropdown.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Dropdown.prototype.type = "Dropdown";

      Dropdown.prototype.default_view = DropdownView;

      Dropdown.prototype.defaults = function() {
        return _.extend({}, Dropdown.__super__.defaults.call(this), {
          action: null,
          default_action: null,
          label: "Dropdown",
          icon: null,
          type: "default",
          menu: [],
          disabled: false
        });
      };

      return Dropdown;

    })(HasParent);
    Dropdowns = (function(_super) {
      __extends(Dropdowns, _super);

      function Dropdowns() {
        _ref2 = Dropdowns.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Dropdowns.prototype.model = Dropdown;

      return Dropdowns;

    })(Collection);
    return {
      Model: Dropdown,
      Collection: new Dropdowns(),
      View: DropdownView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=dropdown.js.map
*/