#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/it_CH"));
  // it_CH date representation
  equal(tz("2000-09-03", "%x", "it_CH"), "03. 09. 00", "date format");

  // it_CH time representation
  equal(tz("2000-09-03 08:05:04", "%X", "it_CH"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "it_CH"), "23:05:04", "long time format evening");

  // it_CH date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "it_CH"), "dom 03 set 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "it_CH"), "dom 03 set 2000 23:05:04 UTC", "long date format evening");
});
