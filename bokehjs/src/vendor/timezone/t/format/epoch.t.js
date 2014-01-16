#!/usr/bin/env node
require("../proof")(3, function (equal, tz, y2k, moonwalk, utc) {
  equal(tz(utc(1970, 0, 4, 5, 0, 1), "%s"), "277201", "shortly after epoch");
  equal(tz(moonwalk, "%s"), "-14159040", "moonwalk epoch");
  equal(tz(y2k, "%s"), "946684800", "y2k epoch");
});
