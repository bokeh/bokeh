#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/es_NI"));
  // es_NI meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "es_NI"), "am", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "es_NI"), "pm", "post meridiem lower case");

  // es_NI meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "es_NI"), "AM", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "es_NI"), "PM", "post meridiem upper case");
});
