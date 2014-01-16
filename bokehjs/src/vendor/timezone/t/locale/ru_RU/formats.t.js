#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/ru_RU"));
  // ru_RU date representation
  equal(tz("2000-09-03", "%x", "ru_RU"), "03.09.2000", "date format");

  // ru_RU time representation
  equal(tz("2000-09-03 08:05:04", "%X", "ru_RU"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "ru_RU"), "23:05:04", "long time format evening");

  // ru_RU date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "ru_RU"), "Вс. 03 сент. 2000 08:05:04", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "ru_RU"), "Вс. 03 сент. 2000 23:05:04", "long date format evening");
});
