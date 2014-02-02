#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/af_ZA"));
  // af_ZA abbreviated days of week
  equal(tz("2006-01-01", "%a", "af_ZA"), "So", "Sun");
  equal(tz("2006-01-02", "%a", "af_ZA"), "Ma", "Mon");
  equal(tz("2006-01-03", "%a", "af_ZA"), "Di", "Tue");
  equal(tz("2006-01-04", "%a", "af_ZA"), "Wo", "Wed");
  equal(tz("2006-01-05", "%a", "af_ZA"), "Do", "Thu");
  equal(tz("2006-01-06", "%a", "af_ZA"), "Vr", "Fri");
  equal(tz("2006-01-07", "%a", "af_ZA"), "Sa", "Sat");

  // af_ZA days of week
  equal(tz("2006-01-01", "%A", "af_ZA"), "Sondag", "Sunday");
  equal(tz("2006-01-02", "%A", "af_ZA"), "Maandag", "Monday");
  equal(tz("2006-01-03", "%A", "af_ZA"), "Dinsdag", "Tuesday");
  equal(tz("2006-01-04", "%A", "af_ZA"), "Woensdag", "Wednesday");
  equal(tz("2006-01-05", "%A", "af_ZA"), "Donderdag", "Thursday");
  equal(tz("2006-01-06", "%A", "af_ZA"), "Vrydag", "Friday");
  equal(tz("2006-01-07", "%A", "af_ZA"), "Saterdag", "Saturday");
});
