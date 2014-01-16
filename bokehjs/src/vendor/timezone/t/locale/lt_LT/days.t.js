#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/lt_LT"));
  // lt_LT abbreviated days of week
  equal(tz("2006-01-01", "%a", "lt_LT"), "Sk", "Sun");
  equal(tz("2006-01-02", "%a", "lt_LT"), "Pr", "Mon");
  equal(tz("2006-01-03", "%a", "lt_LT"), "An", "Tue");
  equal(tz("2006-01-04", "%a", "lt_LT"), "Tr", "Wed");
  equal(tz("2006-01-05", "%a", "lt_LT"), "Kt", "Thu");
  equal(tz("2006-01-06", "%a", "lt_LT"), "Pn", "Fri");
  equal(tz("2006-01-07", "%a", "lt_LT"), "Št", "Sat");

  // lt_LT days of week
  equal(tz("2006-01-01", "%A", "lt_LT"), "Sekmadienis", "Sunday");
  equal(tz("2006-01-02", "%A", "lt_LT"), "Pirmadienis", "Monday");
  equal(tz("2006-01-03", "%A", "lt_LT"), "Antradienis", "Tuesday");
  equal(tz("2006-01-04", "%A", "lt_LT"), "Trečiadienis", "Wednesday");
  equal(tz("2006-01-05", "%A", "lt_LT"), "Ketvirtadienis", "Thursday");
  equal(tz("2006-01-06", "%A", "lt_LT"), "Penktadienis", "Friday");
  equal(tz("2006-01-07", "%A", "lt_LT"), "Šeštadienis", "Saturday");
});
