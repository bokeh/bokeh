#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/cs_CZ"));
  // cs_CZ abbreviated days of week
  equal(tz("2006-01-01", "%a", "cs_CZ"), "Ne", "Sun");
  equal(tz("2006-01-02", "%a", "cs_CZ"), "Po", "Mon");
  equal(tz("2006-01-03", "%a", "cs_CZ"), "Út", "Tue");
  equal(tz("2006-01-04", "%a", "cs_CZ"), "St", "Wed");
  equal(tz("2006-01-05", "%a", "cs_CZ"), "Čt", "Thu");
  equal(tz("2006-01-06", "%a", "cs_CZ"), "Pá", "Fri");
  equal(tz("2006-01-07", "%a", "cs_CZ"), "So", "Sat");

  // cs_CZ days of week
  equal(tz("2006-01-01", "%A", "cs_CZ"), "Neděle", "Sunday");
  equal(tz("2006-01-02", "%A", "cs_CZ"), "Pondělí", "Monday");
  equal(tz("2006-01-03", "%A", "cs_CZ"), "Úterý", "Tuesday");
  equal(tz("2006-01-04", "%A", "cs_CZ"), "Středa", "Wednesday");
  equal(tz("2006-01-05", "%A", "cs_CZ"), "Čtvrtek", "Thursday");
  equal(tz("2006-01-06", "%A", "cs_CZ"), "Pátek", "Friday");
  equal(tz("2006-01-07", "%A", "cs_CZ"), "Sobota", "Saturday");
});
