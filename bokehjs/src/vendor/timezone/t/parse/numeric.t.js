#!/usr/bin/env node
require("../proof")(3, function (equal, tz, utc, moonwalk) {
  equal(tz(7), 7, "integer");
  equal(tz(new Date(7)), 7,  "Date");
  equal(tz({ valueOf: function () { return 7 } }), 7, "valueOf");
});
