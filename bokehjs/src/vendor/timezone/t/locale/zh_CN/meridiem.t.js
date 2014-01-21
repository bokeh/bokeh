#!/usr/bin/env node
require("../../proof")(4, function (tz, equal) {
  var tz = tz(require("timezone/zh_CN"));
  // zh_CN meridiem upper case
  equal(tz("2000-09-03 08:05:04", "%P", "zh_CN"), "上午", "ante meridiem lower case");
  equal(tz("2000-09-03 23:05:04", "%P", "zh_CN"), "下午", "post meridiem lower case");

  // zh_CN meridiem lower case
  equal(tz("2000-09-03 08:05:04", "%p", "zh_CN"), "上午", "ante meridiem upper case");
  equal(tz("2000-09-03 23:05:04", "%p", "zh_CN"), "下午", "post meridiem upper case");
});
