(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "jquery", "bootstrap/modal", "common/has_properties", "common/continuum_view", "./dialog_template"], function(_, Collection, $, $1, HasProperties, ContinuumView, dialog_template) {
    var Dialog, DialogView, Dialogs, _ref, _ref1, _ref2;
    DialogView = (function(_super) {
      __extends(DialogView, _super);

      function DialogView() {
        this.changeContent = __bind(this.changeContent, this);
        this.changeVisibility = __bind(this.changeVisibility, this);
        this.onHide = __bind(this.onHide, this);
        _ref = DialogView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DialogView.prototype.initialize = function(options) {
        DialogView.__super__.initialize.call(this, options);
        this.render();
        this.listenTo(this.model, 'destroy', this.remove);
        this.listenTo(this.model, 'change:visible', this.changeVisibility);
        return this.listenTo(this.model, 'change:content', this.changeContent);
      };

      DialogView.prototype.render = function() {
        this.$modal = $(dialog_template(this.model.attributes));
        this.$modal.modal({
          show: this.mget("visible")
        });
        this.$modal.on('hidden.bk-bs.modal', this.onHide);
        return this.$el.html(this.$modal);
      };

      DialogView.prototype.onHide = function(event) {
        return this.mset("visible", false, {
          silent: true
        });
      };

      DialogView.prototype.changeVisibility = function() {
        return this.$modal.modal(this.mget("visible") ? "show" : "hide");
      };

      DialogView.prototype.changeContent = function() {
        return this.$modal.find(".bk-bs-modal-body").text(this.mget("content"));
      };

      return DialogView;

    })(ContinuumView);
    Dialog = (function(_super) {
      __extends(Dialog, _super);

      function Dialog() {
        _ref1 = Dialog.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Dialog.prototype.type = "Dialog";

      Dialog.prototype.default_view = DialogView;

      Dialog.prototype.defaults = function() {
        return _.extend({}, Dialog.__super__.defaults.call(this), {
          visible: false,
          closable: true,
          title: "",
          content: "",
          buttons: []
        });
      };

      return Dialog;

    })(HasProperties);
    Dialogs = (function(_super) {
      __extends(Dialogs, _super);

      function Dialogs() {
        _ref2 = Dialogs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Dialogs.prototype.model = Dialog;

      return Dialogs;

    })(Collection);
    return {
      Model: Dialog,
      Collection: new Dialogs(),
      View: DialogView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=dialog.js.map
*/