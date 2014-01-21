#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/fr_CA"));
  // fr_CA abbreviated days of week
  equal(tz("2006-01-01", "%a", "fr_CA"), "dim", "Sun");
  equal(tz("2006-01-02", "%a", "fr_CA"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "fr_CA"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "fr_CA"), "mer", "Wed");
  equal(tz("2006-01-05", "%a", "fr_CA"), "jeu", "Thu");
  equal(tz("2006-01-06", "%a", "fr_CA"), "ven", "Fri");
  equal(tz("2006-01-07", "%a", "fr_CA"), "sam", "Sat");

  // fr_CA days of week
  equal(tz("2006-01-01", "%A", "fr_CA"), "dimanche", "Sunday");
  equal(tz("2006-01-02", "%A", "fr_CA"), "lundi", "Monday");
  equal(tz("2006-01-03", "%A", "fr_CA"), "mardi", "Tuesday");
  equal(tz("2006-01-04", "%A", "fr_CA"), "mercredi", "Wednesday");
  equal(tz("2006-01-05", "%A", "fr_CA"), "jeudi", "Thursday");
  equal(tz("2006-01-06", "%A", "fr_CA"), "vendredi", "Friday");
  equal(tz("2006-01-07", "%A", "fr_CA"), "samedi", "Saturday");
});
