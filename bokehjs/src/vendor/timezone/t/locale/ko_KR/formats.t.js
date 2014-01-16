#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/ko_KR"));
  // ko_KR date representation
  equal(tz("2000-09-03", "%x", "ko_KR"), "2000년 09월 03일", "date format");

  // ko_KR time representation
  equal(tz("2000-09-03 08:05:04", "%X", "ko_KR"), "08시 05분 04초", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "ko_KR"), "23시 05분 04초", "long time format evening");

  // ko_KR date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "ko_KR"), "2000년 09월 03일 (일) 오전 08시 05분 04초", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "ko_KR"), "2000년 09월 03일 (일) 오후 11시 05분 04초", "long date format evening");
});
