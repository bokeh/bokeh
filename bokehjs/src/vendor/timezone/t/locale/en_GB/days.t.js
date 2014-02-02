#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/en_GB"));
  // en_GB abbreviated days of week
  equal(tz("2006-01-01", "%a", "en_GB"), "Sun", "Sun");
  equal(tz("2006-01-02", "%a", "en_GB"), "Mon", "Mon");
  equal(tz("2006-01-03", "%a", "en_GB"), "Tue", "Tue");
  equal(tz("2006-01-04", "%a", "en_GB"), "Wed", "Wed");
  equal(tz("2006-01-05", "%a", "en_GB"), "Thu", "Thu");
  equal(tz("2006-01-06", "%a", "en_GB"), "Fri", "Fri");
  equal(tz("2006-01-07", "%a", "en_GB"), "Sat", "Sat");

  // en_GB days of week
  equal(tz("2006-01-01", "%A", "en_GB"), "Sunday", "Sunday");
  equal(tz("2006-01-02", "%A", "en_GB"), "Monday", "Monday");
  equal(tz("2006-01-03", "%A", "en_GB"), "Tuesday", "Tuesday");
  equal(tz("2006-01-04", "%A", "en_GB"), "Wednesday", "Wednesday");
  equal(tz("2006-01-05", "%A", "en_GB"), "Thursday", "Thursday");
  equal(tz("2006-01-06", "%A", "en_GB"), "Friday", "Friday");
  equal(tz("2006-01-07", "%A", "en_GB"), "Saturday", "Saturday");
});
