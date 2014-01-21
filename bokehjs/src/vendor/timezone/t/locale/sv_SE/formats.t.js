#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/sv_SE"));
  // sv_SE date representation
  equal(tz("2000-09-03", "%x", "sv_SE"), "2000-09-03", "date format");

  // sv_SE time representation
  equal(tz("2000-09-03 08:05:04", "%X", "sv_SE"), "08.05.04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "sv_SE"), "23.05.04", "long time format evening");

  // sv_SE date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "sv_SE"), "sön  3 sep 2000 08.05.04", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "sv_SE"), "sön  3 sep 2000 23.05.04", "long date format evening");
});
