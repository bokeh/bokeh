#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/it_IT"));
  // it_IT date representation
  equal(tz("2000-09-03", "%x", "it_IT"), "03/09/2000", "date format");

  // it_IT time representation
  equal(tz("2000-09-03 08:05:04", "%X", "it_IT"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "it_IT"), "23:05:04", "long time format evening");

  // it_IT date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "it_IT"), "dom 03 set 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "it_IT"), "dom 03 set 2000 23:05:04 UTC", "long date format evening");
});
