#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/gl_ES"));
  // gl_ES date representation
  equal(tz("2000-09-03", "%x", "gl_ES"), "03/09/00", "date format");

  // gl_ES time representation
  equal(tz("2000-09-03 08:05:04", "%X", "gl_ES"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "gl_ES"), "23:05:04", "long time format evening");

  // gl_ES date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "gl_ES"), "Dom 03 Set 2000 08:05:04 UTC", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "gl_ES"), "Dom 03 Set 2000 23:05:04 UTC", "long date format evening");
});
