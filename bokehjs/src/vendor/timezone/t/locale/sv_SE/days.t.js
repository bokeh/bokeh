#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/sv_SE"));
  // sv_SE abbreviated days of week
  equal(tz("2006-01-01", "%a", "sv_SE"), "sön", "Sun");
  equal(tz("2006-01-02", "%a", "sv_SE"), "mån", "Mon");
  equal(tz("2006-01-03", "%a", "sv_SE"), "tis", "Tue");
  equal(tz("2006-01-04", "%a", "sv_SE"), "ons", "Wed");
  equal(tz("2006-01-05", "%a", "sv_SE"), "tor", "Thu");
  equal(tz("2006-01-06", "%a", "sv_SE"), "fre", "Fri");
  equal(tz("2006-01-07", "%a", "sv_SE"), "lör", "Sat");

  // sv_SE days of week
  equal(tz("2006-01-01", "%A", "sv_SE"), "söndag", "Sunday");
  equal(tz("2006-01-02", "%A", "sv_SE"), "måndag", "Monday");
  equal(tz("2006-01-03", "%A", "sv_SE"), "tisdag", "Tuesday");
  equal(tz("2006-01-04", "%A", "sv_SE"), "onsdag", "Wednesday");
  equal(tz("2006-01-05", "%A", "sv_SE"), "torsdag", "Thursday");
  equal(tz("2006-01-06", "%A", "sv_SE"), "fredag", "Friday");
  equal(tz("2006-01-07", "%A", "sv_SE"), "lördag", "Saturday");
});
