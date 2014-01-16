#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/sl_SI"));
  // sl_SI abbreviated days of week
  equal(tz("2006-01-01", "%a", "sl_SI"), "ned", "Sun");
  equal(tz("2006-01-02", "%a", "sl_SI"), "pon", "Mon");
  equal(tz("2006-01-03", "%a", "sl_SI"), "tor", "Tue");
  equal(tz("2006-01-04", "%a", "sl_SI"), "sre", "Wed");
  equal(tz("2006-01-05", "%a", "sl_SI"), "čet", "Thu");
  equal(tz("2006-01-06", "%a", "sl_SI"), "pet", "Fri");
  equal(tz("2006-01-07", "%a", "sl_SI"), "sob", "Sat");

  // sl_SI days of week
  equal(tz("2006-01-01", "%A", "sl_SI"), "nedelja", "Sunday");
  equal(tz("2006-01-02", "%A", "sl_SI"), "ponedeljek", "Monday");
  equal(tz("2006-01-03", "%A", "sl_SI"), "torek", "Tuesday");
  equal(tz("2006-01-04", "%A", "sl_SI"), "sreda", "Wednesday");
  equal(tz("2006-01-05", "%A", "sl_SI"), "četrtek", "Thursday");
  equal(tz("2006-01-06", "%A", "sl_SI"), "petek", "Friday");
  equal(tz("2006-01-07", "%A", "sl_SI"), "sobota", "Saturday");
});
