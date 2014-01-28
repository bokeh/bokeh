#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/nds_DE"));
  // nds_DE date representation
  equal(tz("2000-09-03", "%x", "nds_DE"), "03.09.2000", "date format");

  // nds_DE time representation
  equal(tz("2000-09-03 08:05:04", "%X", "nds_DE"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "nds_DE"), "23:05:04", "long time format evening");

  // nds_DE date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "nds_DE"), "Sdag 03. Sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "nds_DE"), "Sdag 03. Sep 2000 23:05:04 UTC", "long date format evening");
});
