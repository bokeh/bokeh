#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/bn_BD"));
  // bn_BD meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "bn_BD"), "পূর্বাহ্ণ", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "bn_BD"), "অপরাহ্ণ", "post meridiem lower case");

  // bn_BD meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "bn_BD"), "পূর্বাহ্ণ", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "bn_BD"), "অপরাহ্ণ", "post meridiem upper case");
});
