#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/nb_NO"));
  // nb_NO abbreviated days of week
  equal(tz("2006-01-01", "%a", "nb_NO"), "sø.", "Sun");
  equal(tz("2006-01-02", "%a", "nb_NO"), "ma.", "Mon");
  equal(tz("2006-01-03", "%a", "nb_NO"), "ti.", "Tue");
  equal(tz("2006-01-04", "%a", "nb_NO"), "on.", "Wed");
  equal(tz("2006-01-05", "%a", "nb_NO"), "to.", "Thu");
  equal(tz("2006-01-06", "%a", "nb_NO"), "fr.", "Fri");
  equal(tz("2006-01-07", "%a", "nb_NO"), "lø.", "Sat");

  // nb_NO days of week
  equal(tz("2006-01-01", "%A", "nb_NO"), "søndag", "Sunday");
  equal(tz("2006-01-02", "%A", "nb_NO"), "mandag", "Monday");
  equal(tz("2006-01-03", "%A", "nb_NO"), "tirsdag", "Tuesday");
  equal(tz("2006-01-04", "%A", "nb_NO"), "onsdag", "Wednesday");
  equal(tz("2006-01-05", "%A", "nb_NO"), "torsdag", "Thursday");
  equal(tz("2006-01-06", "%A", "nb_NO"), "fredag", "Friday");
  equal(tz("2006-01-07", "%A", "nb_NO"), "lørdag", "Saturday");
});
