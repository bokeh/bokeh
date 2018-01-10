/* XXX: partial */
import * as Numbro from "numbro";
import * as compile_template from "underscore.template";
import * as tz from "timezone";

import * as p from "core/properties";
import {span, i} from "core/dom";
import {extend} from "core/util/object";
import {isString} from "core/util/types";
import {Model} from "../../../model"

export class CellFormatter extends Model {
  doFormat(row, cell, value, columnDef, dataContext) {
    if ((value == null)) {
      return "";
    } else {
      return (value + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }
}

export class StringFormatter extends CellFormatter {
  static initClass() {
    this.prototype.type = 'StringFormatter';

    this.define({
      font_style: [ p.FontStyle, "normal" ],
      text_align: [ p.TextAlign, "left"   ],
      text_color: [ p.Color ]
    });
  }

  doFormat(row, cell, value, columnDef, dataContext) {
    const { font_style } = this;
    const { text_align } = this;
    const { text_color } = this;

    let text = span({}, (value == null) ? "" : `${value}`);
    switch (font_style) {
      case "bold":
        text.style.fontWeight = "bold";
        break;
      case "italic":
        text.style.fontStyle = "italic";
        break;
    }

    if (text_align != null) {
      text.style.textAlign = text_align;
    }
    if (text_color != null) {
      text.style.color = text_color;
    }

    text = text.outerHTML;
    return text;
  }
}
StringFormatter.initClass();

export class NumberFormatter extends StringFormatter {
  static initClass() {
    this.prototype.type = 'NumberFormatter';

    this.define({
      format:     [ p.String, '0,0'       ], // TODO (bev)
      language:   [ p.String, 'en'        ], // TODO (bev)
      rounding:   [ p.String, 'round'     ] // TODO (bev)
    });
  }

  doFormat(row, cell, value, columnDef, dataContext) {
    const { format } = this;
    const { language } = this;
    const rounding = (() => { switch (this.rounding) {
      case "round": case "nearest":   return Math.round;
      case "floor": case "rounddown": return Math.floor;
      case "ceil":  case "roundup":   return Math.ceil;
    } })();
    value = Numbro.format(value, format, language, rounding);
    return super.doFormat(row, cell, value, columnDef, dataContext);
  }
}
NumberFormatter.initClass();

export class BooleanFormatter extends CellFormatter {
  static initClass() {
    this.prototype.type = 'BooleanFormatter';

    this.define({
      icon: [ p.String, 'check' ]
    });
  }

  doFormat(row, cell, value, columnDef, dataContext) {
    if (!!value) { return i({class: this.icon}).outerHTML; } else { return ""; }
  }
}
BooleanFormatter.initClass();

export class DateFormatter extends CellFormatter {
  static initClass() {
    this.prototype.type = 'DateFormatter';

    this.define({
      format: [ p.String, 'ISO-8601' ]
    });
  }

  getFormat() {
    // using definitions provided here: https://api.jqueryui.com/datepicker/
    // except not implementing TICKS
    const fmt = (() => { switch (this.format) {
      case "ATOM": case "W3C": case "RFC-3339": case "ISO-8601": return "%Y-%m-%d";
      case "COOKIE":                              return "%a, %d %b %Y";
      case "RFC-850":                             return "%A, %d-%b-%y";
      case "RFC-1123": case "RFC-2822":                return "%a, %e %b %Y";
      case "RSS": case "RFC-822": case "RFC-1036":          return "%a, %e %b %y";
      case "TIMESTAMP":                           return null;
      default:                                       return "__CUSTOM__";
    } })();
    if (fmt === "__CUSTOM__") { return this.format; } else { return fmt; }
  }

  doFormat(row, cell, value, columnDef, dataContext) {
    value = isString(value) ? parseInt(value, 10) : value;
    const date = tz(value, this.getFormat());
    return super.doFormat(row, cell, date, columnDef, dataContext);
  }
}
DateFormatter.initClass();

export class HTMLTemplateFormatter extends CellFormatter {
  static initClass() {
    this.prototype.type = 'HTMLTemplateFormatter';

    this.define({
      template: [ p.String, '<%= value %>' ]
    });
  }

  doFormat(row, cell, value, columnDef, dataContext) {
    const { template } = this;
    if (value === null) {
      return "";
    } else {
      dataContext = extend({}, dataContext, {value});
      const compiled_template = compile_template(template);
      return compiled_template(dataContext);
    }
  }
}
HTMLTemplateFormatter.initClass();
