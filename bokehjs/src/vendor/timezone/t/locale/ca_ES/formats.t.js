#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/ca_ES"));
  // ca_ES date representation
  equal(tz("2000-09-03", "%x", "ca_ES"), "03/09/00", "date format");

  // ca_ES time representation
  equal(tz("2000-09-03 08:05:04", "%X", "ca_ES"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "ca_ES"), "23:05:04", "long time format evening");

  // ca_ES date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "ca_ES"), "dg 03 set 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "ca_ES"), "dg 03 set 2000 23:05:04 UTC", "long date format evening");
});
