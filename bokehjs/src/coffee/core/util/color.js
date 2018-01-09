/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as svg_colors from "./svg_colors"
import {includes} from "./array";
;

const _component2hex = function(v) {
  let h = Number(v).toString(16);
  return h = h.length === 1 ? `0${h}` : h;
};

export const color2hex = function(color) {
  color = color + '';
  if (color.indexOf('#') === 0) {
    return color;
  } else if (svg_colors[color] != null) {
    return svg_colors[color];
  } else if (color.indexOf('rgb') === 0) {
    const rgb = color.replace(/^rgba?\(|\s+|\)$/g,'').split(',');
    let hex = (rgb.slice(0, 3).map((v) => _component2hex(v))).join('');
    if (rgb.length === 4) {
      hex = hex + _component2hex(Math.floor(parseFloat(rgb.slice(3)) * 255));
    }
    const hex_string = `#${hex.slice(0, 8)}`;  // can also be rgba
    return hex_string;
  } else {
    return color;
  }
};

export const color2rgba = function(color, alpha) {
    if (alpha == null) { alpha = 1; }
    if (!color) {  // NaN, null, '', etc.
      return [0, 0, 0, 0];  // transparent
    }
    // Convert to hex and then to clean version of 6 or 8 chars
    let hex = color2hex(color);
    hex = hex.replace(/ |#/g, '');
    if (hex.length <= 4) {
      hex = hex.replace(/(.)/g, '$1$1');
    }
    // Convert pairs to numbers
    hex = hex.match(/../g);
    const rgba = (hex.map((i) => parseInt(i, 16)/255));
    // Ensure correct length, add alpha if necessary
    while (rgba.length < 3) {
      rgba.push(0);
    }
    if (rgba.length < 4) {
      rgba.push(alpha);
    }
    return rgba.slice(0, 4);  // return 4 elements
  };

export const valid_rgb = function(value) {
  let needle, params;
  switch (value.substring(0, 4)) {
      case "rgba": params = {start: "rgba(", len: 4, alpha: true}; break;
      case "rgb(": params = {start: "rgb(", len: 3, alpha: false}; break;
      default: return false;
  }

  // if '.' and then ',' found, we know decimals are used on rgb
  if (new RegExp(".*?(\\.).*(,)").test(value)) {
    throw new Error(`color expects integers for rgb in rgb/rgba tuple, received ${value}`);
  }

  // extract the numerical values from inside parens
  const contents = value.replace(params.start, "").replace(")", "").split(',').map(parseFloat);

  // check length of array based on rgb/rgba
  if (contents.length !== params.len) {
    throw new Error(`color expects rgba ${expect_len}-tuple, received ${value}`);
  }

  // check for valid numerical values for rgba
  if (params.alpha && !(0 <= contents[3] && contents[3] <= 1)) {
    throw new Error("color expects rgba 4-tuple to have alpha value between 0 and 1");
  }
  if ((needle = false, includes(contents.slice(0, 3).map((rgb) => 0 <= rgb && rgb <= 255), needle))) {
    throw new Error("color expects rgb to have value between 0 and 255");
  }
  return true;
};
