#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/en_AU"));
  // en_AU abbreviated days of week
  equal(tz("2006-01-01", "%a", "en_AU"), "Sun", "Sun");
  equal(tz("2006-01-02", "%a", "en_AU"), "Mon", "Mon");
  equal(tz("2006-01-03", "%a", "en_AU"), "Tue", "Tue");
  equal(tz("2006-01-04", "%a", "en_AU"), "Wed", "Wed");
  equal(tz("2006-01-05", "%a", "en_AU"), "Thu", "Thu");
  equal(tz("2006-01-06", "%a", "en_AU"), "Fri", "Fri");
  equal(tz("2006-01-07", "%a", "en_AU"), "Sat", "Sat");

  // en_AU days of week
  equal(tz("2006-01-01", "%A", "en_AU"), "Sunday", "Sunday");
  equal(tz("2006-01-02", "%A", "en_AU"), "Monday", "Monday");
  equal(tz("2006-01-03", "%A", "en_AU"), "Tuesday", "Tuesday");
  equal(tz("2006-01-04", "%A", "en_AU"), "Wednesday", "Wednesday");
  equal(tz("2006-01-05", "%A", "en_AU"), "Thursday", "Thursday");
  equal(tz("2006-01-06", "%A", "en_AU"), "Friday", "Friday");
  equal(tz("2006-01-07", "%A", "en_AU"), "Saturday", "Saturday");
});
