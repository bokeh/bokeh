(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "./paragraph"], function(Collection, Paragraph) {
    var PreText, PreTextView, PreTexts, pretexts, _ref, _ref1, _ref2;
    PreTextView = (function(_super) {
      __extends(PreTextView, _super);

      function PreTextView() {
        _ref = PreTextView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PreTextView.prototype.tagName = "pre";

      PreTextView.prototype.attributes = {
        style: "overflow:scroll"
      };

      return PreTextView;

    })(Paragraph.View);
    PreText = (function(_super) {
      __extends(PreText, _super);

      function PreText() {
        _ref1 = PreText.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PreText.prototype.type = "PreText";

      PreText.prototype.default_view = PreTextView;

      PreText.prototype.defaults = function() {
        return _.extend({}, PreText.__super__.defaults.call(this), {
          text: '',
          height: 400,
          width: 400
        });
      };

      return PreText;

    })(Paragraph.Model);
    PreTexts = (function(_super) {
      __extends(PreTexts, _super);

      function PreTexts() {
        _ref2 = PreTexts.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PreTexts.prototype.model = PreText;

      return PreTexts;

    })(Collection);
    pretexts = new PreTexts();
    return {
      "Model": PreText,
      "Collection": pretexts,
      "View": PreTextView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=pretext.js.map
*/