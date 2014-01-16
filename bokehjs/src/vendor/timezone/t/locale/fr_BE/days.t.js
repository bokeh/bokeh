#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/fr_BE"));
  // fr_BE abbreviated days of week
  equal(tz("2006-01-01", "%a", "fr_BE"), "dim", "Sun");
  equal(tz("2006-01-02", "%a", "fr_BE"), "lun", "Mon");
  equal(tz("2006-01-03", "%a", "fr_BE"), "mar", "Tue");
  equal(tz("2006-01-04", "%a", "fr_BE"), "mer", "Wed");
  equal(tz("2006-01-05", "%a", "fr_BE"), "jeu", "Thu");
  equal(tz("2006-01-06", "%a", "fr_BE"), "ven", "Fri");
  equal(tz("2006-01-07", "%a", "fr_BE"), "sam", "Sat");

  // fr_BE days of week
  equal(tz("2006-01-01", "%A", "fr_BE"), "dimanche", "Sunday");
  equal(tz("2006-01-02", "%A", "fr_BE"), "lundi", "Monday");
  equal(tz("2006-01-03", "%A", "fr_BE"), "mardi", "Tuesday");
  equal(tz("2006-01-04", "%A", "fr_BE"), "mercredi", "Wednesday");
  equal(tz("2006-01-05", "%A", "fr_BE"), "jeudi", "Thursday");
  equal(tz("2006-01-06", "%A", "fr_BE"), "vendredi", "Friday");
  equal(tz("2006-01-07", "%A", "fr_BE"), "samedi", "Saturday");
});
