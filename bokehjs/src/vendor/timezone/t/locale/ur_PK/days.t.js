#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/ur_PK"));
  // ur_PK abbreviated days of week
  equal(tz("2006-01-01", "%a", "ur_PK"), "اتوار", "Sun");
  equal(tz("2006-01-02", "%a", "ur_PK"), "پير", "Mon");
  equal(tz("2006-01-03", "%a", "ur_PK"), "منگل", "Tue");
  equal(tz("2006-01-04", "%a", "ur_PK"), "بدھ", "Wed");
  equal(tz("2006-01-05", "%a", "ur_PK"), "جمعرات", "Thu");
  equal(tz("2006-01-06", "%a", "ur_PK"), "جمعه", "Fri");
  equal(tz("2006-01-07", "%a", "ur_PK"), "هفته", "Sat");

  // ur_PK days of week
  equal(tz("2006-01-01", "%A", "ur_PK"), "اتوار", "Sunday");
  equal(tz("2006-01-02", "%A", "ur_PK"), "پير", "Monday");
  equal(tz("2006-01-03", "%A", "ur_PK"), "منگل", "Tuesday");
  equal(tz("2006-01-04", "%A", "ur_PK"), "بدھ", "Wednesday");
  equal(tz("2006-01-05", "%A", "ur_PK"), "جمعرات", "Thursday");
  equal(tz("2006-01-06", "%A", "ur_PK"), "جمعه", "Friday");
  equal(tz("2006-01-07", "%A", "ur_PK"), "هفته", "Saturday");
});
