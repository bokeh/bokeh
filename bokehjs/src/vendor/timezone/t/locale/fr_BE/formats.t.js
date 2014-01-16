#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/fr_BE"));
  // fr_BE date representation
  equal(tz("2000-09-03", "%x", "fr_BE"), "03/09/00", "date format");

  // fr_BE time representation
  equal(tz("2000-09-03 08:05:04", "%X", "fr_BE"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "fr_BE"), "23:05:04", "long time format evening");

  // fr_BE date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "fr_BE"), "dim 03 sep 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "fr_BE"), "dim 03 sep 2000 23:05:04 UTC", "long date format evening");
});
