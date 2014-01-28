#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/el_GR"));
  // el_GR date representation
  equal(tz("2000-09-03", "%x", "el_GR"), "03/09/2000", "date format");

  // el_GR time representation
  equal(tz("2000-09-03 08:05:04", "%X", "el_GR"), "08:05:04 πμ", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "el_GR"), "11:05:04 μμ", "long time format evening");

  // el_GR date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "el_GR"), "Κυρ 03 Σεπ 2000 08:05:04 πμ UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "el_GR"), "Κυρ 03 Σεπ 2000 11:05:04 μμ UTC", "long date format evening");
});
