#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/hr_HR"));
  // hr_HR abbreviated days of week
  equal(tz("2006-01-01", "%a", "hr_HR"), "Ned", "Sun");
  equal(tz("2006-01-02", "%a", "hr_HR"), "Pon", "Mon");
  equal(tz("2006-01-03", "%a", "hr_HR"), "Uto", "Tue");
  equal(tz("2006-01-04", "%a", "hr_HR"), "Sri", "Wed");
  equal(tz("2006-01-05", "%a", "hr_HR"), "Čet", "Thu");
  equal(tz("2006-01-06", "%a", "hr_HR"), "Pet", "Fri");
  equal(tz("2006-01-07", "%a", "hr_HR"), "Sub", "Sat");

  // hr_HR days of week
  equal(tz("2006-01-01", "%A", "hr_HR"), "Nedjelja", "Sunday");
  equal(tz("2006-01-02", "%A", "hr_HR"), "Ponedjeljak", "Monday");
  equal(tz("2006-01-03", "%A", "hr_HR"), "Utorak", "Tuesday");
  equal(tz("2006-01-04", "%A", "hr_HR"), "Srijeda", "Wednesday");
  equal(tz("2006-01-05", "%A", "hr_HR"), "Četvrtak", "Thursday");
  equal(tz("2006-01-06", "%A", "hr_HR"), "Petak", "Friday");
  equal(tz("2006-01-07", "%A", "hr_HR"), "Subota", "Saturday");
});
