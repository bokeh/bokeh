#!/usr/bin/env node
require("../proof")(8, function (equal, tz, utc) {
  equal(tz(utc(2011, 0, 1, 0), "%P"), "am", "lower case AM midnight");
  equal(tz(utc(2011, 0, 1, 1), "%P"), "am", "lower case AM");
  equal(tz(utc(2011, 0, 1, 12), "%P"), "pm", "lower case PM noon");
  equal(tz(utc(2011, 0, 1, 13), "%P"), "pm", "lower case PM");
  equal(tz(utc(2011, 0, 1, 0), "%p"), "AM", "upper case AM midnight");
  equal(tz(utc(2011, 0, 1, 1), "%p"), "AM", "lower case AM");
  equal(tz(utc(2011, 0, 1, 12), "%p"), "PM", "upper case PM noon");
  equal(tz(utc(2011, 0, 1, 13), "%p"), "PM", "upper case PM");
});
