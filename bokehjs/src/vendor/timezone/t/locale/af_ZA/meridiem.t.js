#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/af_ZA"));
  // af_ZA meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "af_ZA"), "vm", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "af_ZA"), "nm", "post meridiem lower case");

  // af_ZA meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "af_ZA"), "VM", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "af_ZA"), "NM", "post meridiem upper case");
});
