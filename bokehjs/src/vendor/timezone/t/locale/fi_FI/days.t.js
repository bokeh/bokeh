#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/fi_FI"));
  // fi_FI abbreviated days of week
  equal(tz("2006-01-01", "%a", "fi_FI"), "su", "Sun");
  equal(tz("2006-01-02", "%a", "fi_FI"), "ma", "Mon");
  equal(tz("2006-01-03", "%a", "fi_FI"), "ti", "Tue");
  equal(tz("2006-01-04", "%a", "fi_FI"), "ke", "Wed");
  equal(tz("2006-01-05", "%a", "fi_FI"), "to", "Thu");
  equal(tz("2006-01-06", "%a", "fi_FI"), "pe", "Fri");
  equal(tz("2006-01-07", "%a", "fi_FI"), "la", "Sat");

  // fi_FI days of week
  equal(tz("2006-01-01", "%A", "fi_FI"), "sunnuntai", "Sunday");
  equal(tz("2006-01-02", "%A", "fi_FI"), "maanantai", "Monday");
  equal(tz("2006-01-03", "%A", "fi_FI"), "tiistai", "Tuesday");
  equal(tz("2006-01-04", "%A", "fi_FI"), "keskiviikko", "Wednesday");
  equal(tz("2006-01-05", "%A", "fi_FI"), "torstai", "Thursday");
  equal(tz("2006-01-06", "%A", "fi_FI"), "perjantai", "Friday");
  equal(tz("2006-01-07", "%A", "fi_FI"), "lauantai", "Saturday");
});
