#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/vi_VN"));
  // vi_VN meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "vi_VN"), "am", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "vi_VN"), "pm", "post meridiem lower case");

  // vi_VN meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "vi_VN"), "AM", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "vi_VN"), "PM", "post meridiem upper case");
});
