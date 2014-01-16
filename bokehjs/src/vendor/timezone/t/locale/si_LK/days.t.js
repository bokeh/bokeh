#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/si_LK"));
  // si_LK abbreviated days of week
  equal(tz("2006-01-01", "%a", "si_LK"), "ඉ", "Sun");
  equal(tz("2006-01-02", "%a", "si_LK"), "ස", "Mon");
  equal(tz("2006-01-03", "%a", "si_LK"), "අ", "Tue");
  equal(tz("2006-01-04", "%a", "si_LK"), "බ", "Wed");
  equal(tz("2006-01-05", "%a", "si_LK"), "බ්‍ර", "Thu");
  equal(tz("2006-01-06", "%a", "si_LK"), "සි", "Fri");
  equal(tz("2006-01-07", "%a", "si_LK"), "සෙ", "Sat");

  // si_LK days of week
  equal(tz("2006-01-01", "%A", "si_LK"), "ඉරිදා", "Sunday");
  equal(tz("2006-01-02", "%A", "si_LK"), "සඳුදා", "Monday");
  equal(tz("2006-01-03", "%A", "si_LK"), "අඟහරුවාදා", "Tuesday");
  equal(tz("2006-01-04", "%A", "si_LK"), "බදාදා", "Wednesday");
  equal(tz("2006-01-05", "%A", "si_LK"), "බ්‍රහස්පතින්දා", "Thursday");
  equal(tz("2006-01-06", "%A", "si_LK"), "සිකුරාදා", "Friday");
  equal(tz("2006-01-07", "%A", "si_LK"), "සෙනසුරාදා", "Saturday");
});
