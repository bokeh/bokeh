(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/has_parent", "common/continuum_view", "common/collection"], function(HasParent, ContinuumView, Collection) {
    var Paragraph, ParagraphView, Paragraphs, paragraphs, _ref, _ref1, _ref2;
    ParagraphView = (function(_super) {
      __extends(ParagraphView, _super);

      function ParagraphView() {
        _ref = ParagraphView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ParagraphView.prototype.tagName = "p";

      ParagraphView.prototype.initialize = function(options) {
        ParagraphView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', this.render);
      };

      ParagraphView.prototype.render = function() {
        if (this.mget('height')) {
          this.$el.height(this.mget('height'));
        }
        if (this.mget('width')) {
          this.$el.width(this.mget('width'));
        }
        return this.$el.text(this.mget('text'));
      };

      return ParagraphView;

    })(ContinuumView);
    Paragraph = (function(_super) {
      __extends(Paragraph, _super);

      function Paragraph() {
        _ref1 = Paragraph.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Paragraph.prototype.type = "Paragraph";

      Paragraph.prototype.default_view = ParagraphView;

      Paragraph.prototype.defaults = function() {
        return _.extend({}, Paragraph.__super__.defaults.call(this), {
          text: ''
        });
      };

      return Paragraph;

    })(HasParent);
    Paragraphs = (function(_super) {
      __extends(Paragraphs, _super);

      function Paragraphs() {
        _ref2 = Paragraphs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Paragraphs.prototype.model = Paragraph;

      return Paragraphs;

    })(Collection);
    paragraphs = new Paragraphs();
    return {
      "Model": Paragraph,
      "Collection": paragraphs,
      "View": ParagraphView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=paragraph.js.map
*/