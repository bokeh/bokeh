#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/ja_JP"));
  // ja_JP meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "ja_JP"), "午前", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "ja_JP"), "午後", "post meridiem lower case");

  // ja_JP meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "ja_JP"), "午前", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "ja_JP"), "午後", "post meridiem upper case");
});
