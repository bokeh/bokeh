#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/am_ET"));
  // am_ET meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "am_ET"), "ጡዋት", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "am_ET"), "ከሰዓት", "post meridiem lower case");

  // am_ET meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "am_ET"), "ጡዋት", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "am_ET"), "ከሰዓት", "post meridiem upper case");
});
