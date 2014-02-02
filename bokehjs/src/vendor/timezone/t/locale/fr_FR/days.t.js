#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/fr_FR"));
  // fr_FR abbreviated days of week
  equal(tz("2006-01-01", "%a", "fr_FR"), "dim.", "Sun");
  equal(tz("2006-01-02", "%a", "fr_FR"), "lun.", "Mon");
  equal(tz("2006-01-03", "%a", "fr_FR"), "mar.", "Tue");
  equal(tz("2006-01-04", "%a", "fr_FR"), "mer.", "Wed");
  equal(tz("2006-01-05", "%a", "fr_FR"), "jeu.", "Thu");
  equal(tz("2006-01-06", "%a", "fr_FR"), "ven.", "Fri");
  equal(tz("2006-01-07", "%a", "fr_FR"), "sam.", "Sat");

  // fr_FR days of week
  equal(tz("2006-01-01", "%A", "fr_FR"), "dimanche", "Sunday");
  equal(tz("2006-01-02", "%A", "fr_FR"), "lundi", "Monday");
  equal(tz("2006-01-03", "%A", "fr_FR"), "mardi", "Tuesday");
  equal(tz("2006-01-04", "%A", "fr_FR"), "mercredi", "Wednesday");
  equal(tz("2006-01-05", "%A", "fr_FR"), "jeudi", "Thursday");
  equal(tz("2006-01-06", "%A", "fr_FR"), "vendredi", "Friday");
  equal(tz("2006-01-07", "%A", "fr_FR"), "samedi", "Saturday");
});
