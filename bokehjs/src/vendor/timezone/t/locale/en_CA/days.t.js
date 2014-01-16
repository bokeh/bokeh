#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/en_CA"));
  // en_CA abbreviated days of week
  equal(tz("2006-01-01", "%a", "en_CA"), "Sun", "Sun");
  equal(tz("2006-01-02", "%a", "en_CA"), "Mon", "Mon");
  equal(tz("2006-01-03", "%a", "en_CA"), "Tue", "Tue");
  equal(tz("2006-01-04", "%a", "en_CA"), "Wed", "Wed");
  equal(tz("2006-01-05", "%a", "en_CA"), "Thu", "Thu");
  equal(tz("2006-01-06", "%a", "en_CA"), "Fri", "Fri");
  equal(tz("2006-01-07", "%a", "en_CA"), "Sat", "Sat");

  // en_CA days of week
  equal(tz("2006-01-01", "%A", "en_CA"), "Sunday", "Sunday");
  equal(tz("2006-01-02", "%A", "en_CA"), "Monday", "Monday");
  equal(tz("2006-01-03", "%A", "en_CA"), "Tuesday", "Tuesday");
  equal(tz("2006-01-04", "%A", "en_CA"), "Wednesday", "Wednesday");
  equal(tz("2006-01-05", "%A", "en_CA"), "Thursday", "Thursday");
  equal(tz("2006-01-06", "%A", "en_CA"), "Friday", "Friday");
  equal(tz("2006-01-07", "%A", "en_CA"), "Saturday", "Saturday");
});
