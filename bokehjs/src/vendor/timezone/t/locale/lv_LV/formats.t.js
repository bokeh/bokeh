#!/usr/bin/env node
require("../../proof")(5, function (tz, equal) {
  var tz = tz(require("timezone/lv_LV"));
  // lv_LV date representation
  equal(tz("2000-09-03", "%x", "lv_LV"), "2000.09.03.", "date format");

  // lv_LV time representation
  equal(tz("2000-09-03 08:05:04", "%X", "lv_LV"), "08:05:04", "long time format morning");
  equal(tz("2000-09-03 23:05:04", "%X", "lv_LV"), "23:05:04", "long time format evening");

  // lv_LV date time representation
  equal(tz("2000-09-03 08:05:04", "%c", "lv_LV"), "svētdiena, 2000. gada  3. septembris, plkst. 08 un 05", "long date format morning");
  equal(tz("2000-09-03 23:05:04", "%c", "lv_LV"), "svētdiena, 2000. gada  3. septembris, plkst. 23 un 05", "long date format evening");
});
