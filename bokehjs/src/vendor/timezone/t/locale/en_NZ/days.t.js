#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/en_NZ"));
  // en_NZ abbreviated days of week
  equal(tz("2006-01-01", "%a", "en_NZ"), "Sun", "Sun");
  equal(tz("2006-01-02", "%a", "en_NZ"), "Mon", "Mon");
  equal(tz("2006-01-03", "%a", "en_NZ"), "Tue", "Tue");
  equal(tz("2006-01-04", "%a", "en_NZ"), "Wed", "Wed");
  equal(tz("2006-01-05", "%a", "en_NZ"), "Thu", "Thu");
  equal(tz("2006-01-06", "%a", "en_NZ"), "Fri", "Fri");
  equal(tz("2006-01-07", "%a", "en_NZ"), "Sat", "Sat");

  // en_NZ days of week
  equal(tz("2006-01-01", "%A", "en_NZ"), "Sunday", "Sunday");
  equal(tz("2006-01-02", "%A", "en_NZ"), "Monday", "Monday");
  equal(tz("2006-01-03", "%A", "en_NZ"), "Tuesday", "Tuesday");
  equal(tz("2006-01-04", "%A", "en_NZ"), "Wednesday", "Wednesday");
  equal(tz("2006-01-05", "%A", "en_NZ"), "Thursday", "Thursday");
  equal(tz("2006-01-06", "%A", "en_NZ"), "Friday", "Friday");
  equal(tz("2006-01-07", "%A", "en_NZ"), "Saturday", "Saturday");
});
