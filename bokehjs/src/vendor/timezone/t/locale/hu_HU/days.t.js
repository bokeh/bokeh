#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/hu_HU"));
  // hu_HU abbreviated days of week
  equal(tz("2006-01-01", "%a", "hu_HU"), "v", "Sun");
  equal(tz("2006-01-02", "%a", "hu_HU"), "h", "Mon");
  equal(tz("2006-01-03", "%a", "hu_HU"), "k", "Tue");
  equal(tz("2006-01-04", "%a", "hu_HU"), "sze", "Wed");
  equal(tz("2006-01-05", "%a", "hu_HU"), "cs", "Thu");
  equal(tz("2006-01-06", "%a", "hu_HU"), "p", "Fri");
  equal(tz("2006-01-07", "%a", "hu_HU"), "szo", "Sat");

  // hu_HU days of week
  equal(tz("2006-01-01", "%A", "hu_HU"), "vasárnap", "Sunday");
  equal(tz("2006-01-02", "%A", "hu_HU"), "hétfő", "Monday");
  equal(tz("2006-01-03", "%A", "hu_HU"), "kedd", "Tuesday");
  equal(tz("2006-01-04", "%A", "hu_HU"), "szerda", "Wednesday");
  equal(tz("2006-01-05", "%A", "hu_HU"), "csütörtök", "Thursday");
  equal(tz("2006-01-06", "%A", "hu_HU"), "péntek", "Friday");
  equal(tz("2006-01-07", "%A", "hu_HU"), "szombat", "Saturday");
});
