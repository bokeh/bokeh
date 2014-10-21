(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/logging", "common/svg_colors"], function(_, Logging, svg_colors) {
    var FillProperties, GlyphProperties, LineProperties, Properties, TextProperties, logger;
    logger = Logging.logger;
    Properties = (function() {
      function Properties() {}

      Properties.prototype.source_v_select = function(attrname, datasource) {
        var i, obj, value, _i, _ref, _results;
        obj = this[attrname];
        if (obj == null) {
          throw new Error("requested vector selection of unknown property '" + attrname + "'");
        } else if ((obj.field != null) && (obj.field in datasource.get('data'))) {
          return datasource.get_column(obj.field);
        } else if (_.isObject(obj)) {
          value = obj.value != null ? obj.value : NaN;
          _results = [];
          for (i = _i = 0, _ref = datasource.get_length(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            _results.push(value);
          }
          return _results;
        } else {
          throw new Error("requested vector selection of '" + attrname + "' failed for " + obj);
        }
      };

      Properties.prototype._fix_singleton_array_value = function(obj) {
        var value;
        if (obj.value != null) {
          value = obj.value;
          if (_.isArray(value)) {
            if (value.length === 1) {
              return _.extend({}, obj, {
                value: value[0]
              });
            } else {
              throw new Error("expected an array of length 1, got " + value);
            }
          }
        }
        return obj;
      };

      Properties.prototype.string = function(styleprovider, attrname) {
        var value;
        this[attrname] = {};
        value = styleprovider.mget(attrname);
        if (value == null) {
          return this[attrname].value = null;
        } else if (_.isString(value)) {
          return this[attrname].value = value;
        } else if (_.isObject(value)) {
          value = this._fix_singleton_array_value(value);
          return this[attrname] = _.extend(this[attrname], value);
        } else {
          return logger.warn("string property '" + attrname + "' given invalid value: " + value);
        }
      };

      Properties.prototype.boolean = function(styleprovider, attrname) {
        var value;
        this[attrname] = {};
        value = styleprovider.mget(attrname);
        if (value == null) {
          return this[attrname].value = null;
        } else if (_.isBoolean(value)) {
          return this[attrname].value = value;
        } else if (_.isString(value)) {
          return this[attrname].field = value;
        } else if (_.isObject(value)) {
          value = this._fix_singleton_array_value(value);
          return this[attrname] = _.extend(this[attrname], value);
        } else {
          return logger.warn("boolean property '" + attrname + "' given invalid value: " + value);
        }
      };

      Properties.prototype.number = function(styleprovider, attrname) {
        var units_value, value, _ref;
        this[attrname] = {};
        units_value = (_ref = styleprovider.mget(attrname + '_units')) != null ? _ref : 'data';
        this[attrname].units = units_value;
        value = styleprovider.mget(attrname);
        if (value == null) {
          return this[attrname].value = null;
        } else if (_.isNumber(value)) {
          return this[attrname].value = value;
        } else if (_.isString(value)) {
          return this[attrname].field = value;
        } else if (_.isObject(value)) {
          value = this._fix_singleton_array_value(value);
          return this[attrname] = _.extend(this[attrname], value);
        } else {
          return logger.warn("number property '" + attrname + "' given invalid value: " + value);
        }
      };

      Properties.prototype.color = function(styleprovider, attrname) {
        var value;
        this[attrname] = {};
        value = styleprovider.mget(attrname);
        if (value == null) {
          return this[attrname].value = null;
        } else if (_.isString(value)) {
          if ((svg_colors[value] != null) || value.substring(0, 1) === "#") {
            return this[attrname].value = value;
          } else {
            return this[attrname].field = value;
          }
        } else if (_.isObject(value)) {
          value = this._fix_singleton_array_value(value);
          return this[attrname] = _.extend(this[attrname], value);
        } else {
          return logger.warn("color property '" + attrname + "' given invalid value: " + value);
        }
      };

      Properties.prototype.array = function(styleprovider, attrname) {
        var units_value, value, _ref;
        this[attrname] = {};
        units_value = (_ref = styleprovider.mget(attrname + "_units")) != null ? _ref : 'data';
        this[attrname].units = units_value;
        value = styleprovider.mget(attrname);
        if (value == null) {
          return this[attrname].value = null;
        } else if (_.isString(value)) {
          return this[attrname].field = value;
        } else if (_.isArray(value)) {
          return this[attrname].value = value;
        } else if (_.isObject(value)) {
          value = this._fix_singleton_array_value(value);
          return this[attrname] = _.extend(this[attrname], value);
        } else {
          return logger.warn("array property '" + attrname + "' given invalid value: " + value);
        }
      };

      Properties.prototype["enum"] = function(styleprovider, attrname, vals) {
        var levels, value;
        this[attrname] = {};
        levels = vals.split(" ");
        value = styleprovider.mget(attrname);
        if (value == null) {
          return this[attrname].value = null;
        } else if (_.isString(value)) {
          if (__indexOf.call(levels, value) >= 0) {
            return this[attrname].value = value;
          } else {
            return this[attrname].field = value;
          }
        } else if (_.isObject(value)) {
          value = this._fix_singleton_array_value(value);
          return this[attrname] = _.extend(this[attrname], value);
        } else {
          logger.warn("enum property '" + attrname + "' given invalid value: " + value);
          return logger.warn(" - acceptable values:" + levels);
        }
      };

      Properties.prototype.setattr = function(styleprovider, attrname, attrtype) {
        var values, _ref;
        values = null;
        if (attrtype.indexOf(":") > -1) {
          _ref = attrtype.split(":"), attrtype = _ref[0], values = _ref[1];
        }
        if (attrtype === "string") {
          return this.string(styleprovider, attrname);
        } else if (attrtype === "boolean") {
          return this.boolean(styleprovider, attrname);
        } else if (attrtype === "number") {
          return this.number(styleprovider, attrname);
        } else if (attrtype === "color") {
          return this.color(styleprovider, attrname);
        } else if (attrtype === "array") {
          return this.array(styleprovider, attrname);
        } else if (attrtype === "enum" && values) {
          return this["enum"](styleprovider, attrname, values);
        } else {
          return logger.warn("Unknown type '" + attrtype + "' for glyph property: " + attrname);
        }
      };

      Properties.prototype.select = function(attrname, obj) {
        if (!(attrname in this)) {
          logger.warn("requested selection of unknown property '" + attrname + "' on object: " + obj);
          return;
        }
        if ((this[attrname].field != null) && (this[attrname].field in obj)) {
          return obj[this[attrname].field];
        }
        if (this[attrname].value != null) {
          return this[attrname].value;
        }
        if (obj.get && obj.get(attrname)) {
          return obj.get(attrname);
        }
        if (obj.mget && obj.mget(attrname)) {
          return obj.mget(attrname);
        }
        if (obj[attrname] != null) {
          return obj[attrname];
        }
        return logger.warn("selection for attribute '" + attrname + "' failed on object: " + obj);
      };

      return Properties;

    })();
    LineProperties = (function(_super) {
      __extends(LineProperties, _super);

      function LineProperties(styleprovider, prefix) {
        if (prefix == null) {
          prefix = "";
        }
        this.line_color_name = "" + prefix + "line_color";
        this.line_width_name = "" + prefix + "line_width";
        this.line_alpha_name = "" + prefix + "line_alpha";
        this.line_join_name = "" + prefix + "line_join";
        this.line_cap_name = "" + prefix + "line_cap";
        this.line_dash_name = "" + prefix + "line_dash";
        this.line_dash_offset_name = "" + prefix + "line_dash_offset";
        this.color(styleprovider, this.line_color_name);
        this.number(styleprovider, this.line_width_name);
        this.number(styleprovider, this.line_alpha_name);
        this["enum"](styleprovider, this.line_join_name, "miter round bevel");
        this["enum"](styleprovider, this.line_cap_name, "butt round square");
        this.array(styleprovider, this.line_dash_name);
        this.number(styleprovider, this.line_dash_offset_name);
        this.do_stroke = true;
        if (!_.isUndefined(this[this.line_color_name].value)) {
          if (_.isNull(this[this.line_color_name].value)) {
            this.do_stroke = false;
          }
        }
      }

      LineProperties.prototype.set = function(ctx, obj) {
        ctx.strokeStyle = this.select(this.line_color_name, obj);
        ctx.globalAlpha = this.select(this.line_alpha_name, obj);
        ctx.lineWidth = this.select(this.line_width_name, obj);
        ctx.lineJoin = this.select(this.line_join_name, obj);
        ctx.lineCap = this.select(this.line_cap_name, obj);
        ctx.setLineDash(this.select(this.line_dash_name, obj));
        return ctx.setLineDashOffset(this.select(this.line_dash_offset_name, obj));
      };

      LineProperties.prototype.set_prop_cache = function(datasource) {
        this.cache = {};
        this.cache.strokeStyle = this.source_v_select(this.line_color_name, datasource);
        this.cache.globalAlpha = this.source_v_select(this.line_alpha_name, datasource);
        this.cache.lineWidth = this.source_v_select(this.line_width_name, datasource);
        this.cache.lineJoin = this.source_v_select(this.line_join_name, datasource);
        this.cache.lineCap = this.source_v_select(this.line_cap_name, datasource);
        this.cache.setLineDash = this.source_v_select(this.line_dash_name, datasource);
        return this.cache.setLineDashOffset = this.source_v_select(this.line_dash_offset_name, datasource);
      };

      LineProperties.prototype.clear_prop_cache = function() {
        return this.cache = {};
      };

      LineProperties.prototype.set_vectorize = function(ctx, i) {
        var did_change;
        did_change = false;
        if ((this.cache.strokeStyle[i] != null) && ctx.strokeStyle !== this.cache.strokeStyle[i]) {
          ctx.strokeStyle = this.cache.strokeStyle[i];
          did_change = true;
        }
        if ((this.cache.globalAlpha[i] != null) && ctx.globalAlpha !== this.cache.globalAlpha[i]) {
          ctx.globalAlpha = this.cache.globalAlpha[i];
          did_change = true;
        }
        if ((this.cache.lineWidth[i] != null) && ctx.lineWidth !== this.cache.lineWidth[i]) {
          ctx.lineWidth = this.cache.lineWidth[i];
          did_change = true;
        }
        if ((this.cache.lineJoin[i] != null) && ctx.lineJoin !== this.cache.lineJoin[i]) {
          ctx.lineJoin = this.cache.lineJoin[i];
          did_change = true;
        }
        if ((this.cache.lineCap[i] != null) && ctx.lineCap !== this.cache.lineCap[i]) {
          ctx.lineCap = this.cache.lineCap[i];
          did_change = true;
        }
        if ((this.cache.setLineDash[i] != null) && ctx.getLineDash() !== this.cache.setLineDash[i]) {
          ctx.setLineDash(this.cache.setLineDash[i]);
          did_change = true;
        }
        if ((this.cache.setLineDashOffset[i] != null) && ctx.getLineDashOffset() !== this.cache.setLineDashOffset[i]) {
          ctx.setLineDashOffset(this.cache.setLineDashOffset[i]);
          did_change = true;
        }
        return did_change;
      };

      return LineProperties;

    })(Properties);
    FillProperties = (function(_super) {
      __extends(FillProperties, _super);

      function FillProperties(styleprovider, prefix) {
        if (prefix == null) {
          prefix = "";
        }
        this.fill_color_name = "" + prefix + "fill_color";
        this.fill_alpha_name = "" + prefix + "fill_alpha";
        this.color(styleprovider, this.fill_color_name);
        this.number(styleprovider, this.fill_alpha_name);
        this.do_fill = true;
        if (!_.isUndefined(this[this.fill_color_name].value)) {
          if (_.isNull(this[this.fill_color_name].value)) {
            this.do_fill = false;
          }
        }
      }

      FillProperties.prototype.set = function(ctx, obj) {
        ctx.fillStyle = this.select(this.fill_color_name, obj);
        return ctx.globalAlpha = this.select(this.fill_alpha_name, obj);
      };

      FillProperties.prototype.set_prop_cache = function(datasource) {
        this.cache = {};
        this.cache.fillStyle = this.source_v_select(this.fill_color_name, datasource);
        return this.cache.globalAlpha = this.source_v_select(this.fill_alpha_name, datasource);
      };

      FillProperties.prototype.set_vectorize = function(ctx, i) {
        var did_change;
        did_change = false;
        if (ctx.fillStyle !== this.cache.fillStyle[i]) {
          ctx.fillStyle = this.cache.fillStyle[i];
          did_change = true;
        }
        if (ctx.globalAlpha !== this.cache.globalAlpha[i]) {
          ctx.globalAlpha = this.cache.globalAlpha[i];
          did_change = true;
        }
        return did_change;
      };

      return FillProperties;

    })(Properties);
    TextProperties = (function(_super) {
      __extends(TextProperties, _super);

      function TextProperties(styleprovider, prefix) {
        if (prefix == null) {
          prefix = "";
        }
        this.text_font_name = "" + prefix + "text_font";
        this.text_font_size_name = "" + prefix + "text_font_size";
        this.text_font_style_name = "" + prefix + "text_font_style";
        this.text_color_name = "" + prefix + "text_color";
        this.text_alpha_name = "" + prefix + "text_alpha";
        this.text_align_name = "" + prefix + "text_align";
        this.text_baseline_name = "" + prefix + "text_baseline";
        this.string(styleprovider, this.text_font_name);
        this.string(styleprovider, this.text_font_size_name);
        this["enum"](styleprovider, this.text_font_style_name, "normal italic bold");
        this.color(styleprovider, this.text_color_name);
        this.number(styleprovider, this.text_alpha_name);
        this["enum"](styleprovider, this.text_align_name, "left right center");
        this["enum"](styleprovider, this.text_baseline_name, "top middle bottom alphabetic hanging");
      }

      TextProperties.prototype.font = function(obj, font_size) {
        var font, font_style;
        if (font_size == null) {
          font_size = this.select(this.text_font_size_name, obj);
        }
        font = this.select(this.text_font_name, obj);
        font_style = this.select(this.text_font_style_name, obj);
        font = font_style + " " + font_size + " " + font;
        return font;
      };

      TextProperties.prototype.set = function(ctx, obj) {
        ctx.font = this.font(obj);
        ctx.fillStyle = this.select(this.text_color_name, obj);
        ctx.globalAlpha = this.select(this.text_alpha_name, obj);
        ctx.textAlign = this.select(this.text_align_name, obj);
        return ctx.textBaseline = this.select(this.text_baseline_name, obj);
      };

      TextProperties.prototype.set_prop_cache = function(datasource) {
        var font, font_size, font_style, i;
        this.cache = {};
        font_size = this.source_v_select(this.text_font_size_name, datasource);
        font = this.source_v_select(this.text_font_name, datasource);
        font_style = this.source_v_select(this.text_font_style_name, datasource);
        this.cache.font = (function() {
          var _i, _ref, _results;
          _results = [];
          for (i = _i = 0, _ref = font.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            _results.push("" + font_style[i] + " " + font_size[i] + " " + font[i]);
          }
          return _results;
        })();
        this.cache.fillStyle = this.source_v_select(this.text_color_name, datasource);
        this.cache.globalAlpha = this.source_v_select(this.text_alpha_name, datasource);
        this.cache.textAlign = this.source_v_select(this.text_align_name, datasource);
        return this.cache.textBaseline = this.source_v_select(this.text_baseline_name, datasource);
      };

      TextProperties.prototype.clear_prop_cache = function() {
        return this.cache = {};
      };

      TextProperties.prototype.set_vectorize = function(ctx, i) {
        var did_change;
        did_change = false;
        if (ctx.font !== this.cache.font[i]) {
          ctx.font = this.cache.font[i];
          did_change = true;
        }
        if (ctx.fillStyle !== this.cache.fillStyle[i]) {
          ctx.fillStyle = this.cache.fillStyle[i];
          did_change = true;
        }
        if (ctx.globalAlpha !== this.cache.globalAlpha[i]) {
          ctx.globalAlpha = this.cache.globalAlpha[i];
          did_change = true;
        }
        if (ctx.textAlign !== this.cache.textAlign[i]) {
          ctx.textAlign = this.cache.textAlign[i];
          did_change = true;
        }
        if (ctx.textBaseline !== this.cache.textBaseline[i]) {
          ctx.textBaseline = this.cache.textBaseline[i];
          did_change = true;
        }
        return did_change;
      };

      return TextProperties;

    })(Properties);
    GlyphProperties = (function(_super) {
      __extends(GlyphProperties, _super);

      function GlyphProperties(styleprovider, attrnames) {
        var attrname, attrtype, _i, _len, _ref;
        for (_i = 0, _len = attrnames.length; _i < _len; _i++) {
          attrname = attrnames[_i];
          attrtype = "number";
          if (attrname.indexOf(":") > -1) {
            _ref = attrname.split(":"), attrname = _ref[0], attrtype = _ref[1];
          }
          this.setattr(styleprovider, attrname, attrtype);
        }
      }

      return GlyphProperties;

    })(Properties);
    return {
      Glyph: GlyphProperties,
      Fill: FillProperties,
      Line: LineProperties,
      Text: TextProperties
    };
  });

}).call(this);

/*
//@ sourceMappingURL=properties.js.map
*/