#!/usr/bin/env node
require("../../proof")(14, function (tz, equal) {
  var tz = tz(require("timezone/hi_IN"));
  // hi_IN abbreviated days of week
  equal(tz("2006-01-01", "%a", "hi_IN"), "रवि ", "Sun");
  equal(tz("2006-01-02", "%a", "hi_IN"), "सोम ", "Mon");
  equal(tz("2006-01-03", "%a", "hi_IN"), "मंगल ", "Tue");
  equal(tz("2006-01-04", "%a", "hi_IN"), "बुध ", "Wed");
  equal(tz("2006-01-05", "%a", "hi_IN"), "गुरु ", "Thu");
  equal(tz("2006-01-06", "%a", "hi_IN"), "शुक्र ", "Fri");
  equal(tz("2006-01-07", "%a", "hi_IN"), "शनि ", "Sat");

  // hi_IN days of week
  equal(tz("2006-01-01", "%A", "hi_IN"), "रविवार ", "Sunday");
  equal(tz("2006-01-02", "%A", "hi_IN"), "सोमवार ", "Monday");
  equal(tz("2006-01-03", "%A", "hi_IN"), "मंगलवार ", "Tuesday");
  equal(tz("2006-01-04", "%A", "hi_IN"), "बुधवार ", "Wednesday");
  equal(tz("2006-01-05", "%A", "hi_IN"), "गुरुवार ", "Thursday");
  equal(tz("2006-01-06", "%A", "hi_IN"), "शुक्रवार ", "Friday");
  equal(tz("2006-01-07", "%A", "hi_IN"), "शनिवार ", "Saturday");
});
