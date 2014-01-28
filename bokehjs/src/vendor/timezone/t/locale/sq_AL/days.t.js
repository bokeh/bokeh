#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/sq_AL"));
  // sq_AL abbreviated days of week
  equal(tz("2006-01-01", "%a", "sq_AL"), "Die ", "Sun");
  equal(tz("2006-01-02", "%a", "sq_AL"), "Hën ", "Mon");
  equal(tz("2006-01-03", "%a", "sq_AL"), "Mar ", "Tue");
  equal(tz("2006-01-04", "%a", "sq_AL"), "Mër ", "Wed");
  equal(tz("2006-01-05", "%a", "sq_AL"), "Enj ", "Thu");
  equal(tz("2006-01-06", "%a", "sq_AL"), "Pre ", "Fri");
  equal(tz("2006-01-07", "%a", "sq_AL"), "Sht ", "Sat");

  // sq_AL days of week
  equal(tz("2006-01-01", "%A", "sq_AL"), "e diel ", "Sunday");
  equal(tz("2006-01-02", "%A", "sq_AL"), "e hënë ", "Monday");
  equal(tz("2006-01-03", "%A", "sq_AL"), "e martë ", "Tuesday");
  equal(tz("2006-01-04", "%A", "sq_AL"), "e mërkurë ", "Wednesday");
  equal(tz("2006-01-05", "%A", "sq_AL"), "e enjte ", "Thursday");
  equal(tz("2006-01-06", "%A", "sq_AL"), "e premte ", "Friday");
  equal(tz("2006-01-07", "%A", "sq_AL"), "e shtunë ", "Saturday");
});
