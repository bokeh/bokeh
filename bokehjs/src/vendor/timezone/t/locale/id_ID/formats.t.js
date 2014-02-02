#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/id_ID"));
  // id_ID date representation
  equal(tz("2000-09-03", "%x", "id_ID"), "03/09/00", "date format");

  // id_ID time representation
  equal(tz("2000-09-03 08:05:04", "%X", "id_ID"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "id_ID"), "23:05:04", "long time format evening");

  // id_ID date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "id_ID"), "Min 03 Sep 2000 08:05:04  UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "id_ID"), "Min 03 Sep 2000 11:05:04  UTC", "long date format evening");
});
