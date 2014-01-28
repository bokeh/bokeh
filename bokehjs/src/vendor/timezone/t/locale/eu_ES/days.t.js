#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/eu_ES"));
  // eu_ES abbreviated days of week
  equal(tz("2006-01-01", "%a", "eu_ES"), "ig.", "Sun");
  equal(tz("2006-01-02", "%a", "eu_ES"), "al.", "Mon");
  equal(tz("2006-01-03", "%a", "eu_ES"), "ar.", "Tue");
  equal(tz("2006-01-04", "%a", "eu_ES"), "az.", "Wed");
  equal(tz("2006-01-05", "%a", "eu_ES"), "og.", "Thu");
  equal(tz("2006-01-06", "%a", "eu_ES"), "or.", "Fri");
  equal(tz("2006-01-07", "%a", "eu_ES"), "lr.", "Sat");

  // eu_ES days of week
  equal(tz("2006-01-01", "%A", "eu_ES"), "igandea", "Sunday");
  equal(tz("2006-01-02", "%A", "eu_ES"), "astelehena", "Monday");
  equal(tz("2006-01-03", "%A", "eu_ES"), "asteartea", "Tuesday");
  equal(tz("2006-01-04", "%A", "eu_ES"), "asteazkena", "Wednesday");
  equal(tz("2006-01-05", "%A", "eu_ES"), "osteguna", "Thursday");
  equal(tz("2006-01-06", "%A", "eu_ES"), "ostirala", "Friday");
  equal(tz("2006-01-07", "%A", "eu_ES"), "larunbata", "Saturday");
});
