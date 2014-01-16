#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/fi_FI"));
  // fi_FI date representation
  equal(tz("2000-09-03", "%x", "fi_FI"), "03.09.2000", "date format");

  // fi_FI time representation
  equal(tz("2000-09-03 08:05:04", "%X", "fi_FI"), "08.05.04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "fi_FI"), "23.05.04", "long time format evening");

  // fi_FI date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "fi_FI"), "su  3. syyskuuta 2000 08.05.04", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "fi_FI"), "su  3. syyskuuta 2000 23.05.04", "long date format evening");
});
