#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/fr_CH"));
  // fr_CH abbreviated days of week
  equal(tz("2006-01-01", "%a", "fr_CH"), "dim", "Sun");
  equal(tz("2006-01-02", "%a", "fr_CH"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "fr_CH"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "fr_CH"), "mer", "Wed");
  equal(tz("2006-01-05", "%a", "fr_CH"), "jeu", "Thu");
  equal(tz("2006-01-06", "%a", "fr_CH"), "ven", "Fri");
  equal(tz("2006-01-07", "%a", "fr_CH"), "sam", "Sat");

  // fr_CH days of week
  equal(tz("2006-01-01", "%A", "fr_CH"), "dimanche", "Sunday");
  equal(tz("2006-01-02", "%A", "fr_CH"), "lundi", "Monday");
  equal(tz("2006-01-03", "%A", "fr_CH"), "mardi", "Tuesday");
  equal(tz("2006-01-04", "%A", "fr_CH"), "mercredi", "Wednesday");
  equal(tz("2006-01-05", "%A", "fr_CH"), "jeudi", "Thursday");
  equal(tz("2006-01-06", "%A", "fr_CH"), "vendredi", "Friday");
  equal(tz("2006-01-07", "%A", "fr_CH"), "samedi", "Saturday");
});
