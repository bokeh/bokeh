#!/usr/bin/env node
require("../../proof")(14, function (equal, tz) {
  equal(tz("2006-01-01", "%a", "en_US"), "Sun", "Sun");
  equal(tz("2006-01-02", "%a", "en_US"), "Mon", "Mon");
  equal(tz("2006-01-03", "%a", "en_US"), "Tue", "Tue");
  equal(tz("2006-01-04", "%a", "en_US"), "Wed", "Wed");
  equal(tz("2006-01-05", "%a", "en_US"), "Thu", "Thu");
  equal(tz("2006-01-06", "%a", "en_US"), "Fri", "Fri");
  equal(tz("2006-01-07", "%a", "en_US"), "Sat", "Sat");
  equal(tz("2006-01-01", "%A", "en_US"), "Sunday", "Sunday");
  equal(tz("2006-01-02", "%A", "en_US"), "Monday", "Monday");
  equal(tz("2006-01-03", "%A", "en_US"), "Tuesday", "Tuesday");
  equal(tz("2006-01-04", "%A", "en_US"), "Wednesday", "Wednesday");
  equal(tz("2006-01-05", "%A", "en_US"), "Thursday", "Thursday");
  equal(tz("2006-01-06", "%A", "en_US"), "Friday", "Friday");
  equal(tz("2006-01-07", "%A", "en_US"), "Saturday", "Saturday");
});
