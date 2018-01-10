import {sprintf} from "sprintf-js";
import * as Numbro from "numbro";
import * as tz from "timezone";

import {escape} from "./string";
import {isNumber} from "./types"

const _format_number = function(number) {
  if (isNumber(number)) {
    const format = (() => { switch (false) {
      case Math.floor(number) !== number:
        return "%d";
      case !(Math.abs(number) > 0.1) || !(Math.abs(number) < 1000):
        return "%0.3f";
      default:
        return "%0.3e";
    } })();

    return sprintf(format, number);
  } else {
    return `${number}`; // get strings for categorical types
  }
};

export const replace_placeholders = function(string, data_source, i, formatters, special_vars) {
  if (special_vars == null) { special_vars = {}; }
  string = string.replace(/(^|[^\$])\$(\w+)/g, (match, prefix, name) => `${prefix}@$${name}`);

  string = string.replace(/(^|[^@])@(?:(\$?\w+)|{([^{}]+)})(?:{([^{}]+)})?/g, (match, prefix, name, long_name, format) => {
    name = (long_name != null) ? long_name : name;

    const value =
      name[0] === "$" ?
        special_vars[name.substring(1)]
      :

        __guard__(data_source.get_column(name), x => x[i]);

    let replacement = null;
    if ((value == null)) {
      replacement = "???";

    } else {
      // 'safe' format, just return the value as is
      if (format === 'safe') {
        return `${prefix}${value}`;

      } else if (format != null) {

        // see if the field has an entry in the formatters dict
        if ((formatters != null) && name in formatters) {
          if (formatters[name] === "numeral") {
            replacement = Numbro.format(value, format);
          } else if (formatters[name] === "datetime") {
            replacement = tz(value, format);
          } else if (formatters[name] === "printf") {
            replacement = sprintf(format, value);
          } else {
            throw new Error(`Unknown tooltip field formatter type '${ formatters[name] }'`);
          }

        // if not assume the format string is Numbro
        } else {
          replacement = Numbro.format(value, format);
        }

      // no format supplied, just use a basic default numeric format
      } else {
        replacement = _format_number(value);
      }
    }

    return replacement = `${prefix}${escape(replacement)}`;
  });

  return string;
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
