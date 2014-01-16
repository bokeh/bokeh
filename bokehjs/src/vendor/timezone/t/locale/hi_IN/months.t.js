#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/hi_IN"));
  //hi_IN abbreviated months
  equal(tz("2000-01-01", "%b", "hi_IN"), "जनवरी", "Jan");
  equal(tz("2000-02-01", "%b", "hi_IN"), "फ़रवरी", "Feb");
  equal(tz("2000-03-01", "%b", "hi_IN"), "मार्च", "Mar");
  equal(tz("2000-04-01", "%b", "hi_IN"), "अप्रेल", "Apr");
  equal(tz("2000-05-01", "%b", "hi_IN"), "मई", "May");
  equal(tz("2000-06-01", "%b", "hi_IN"), "जून", "Jun");
  equal(tz("2000-07-01", "%b", "hi_IN"), "जुलाई", "Jul");
  equal(tz("2000-08-01", "%b", "hi_IN"), "अगस्त", "Aug");
  equal(tz("2000-09-01", "%b", "hi_IN"), "सितम्बर", "Sep");
  equal(tz("2000-10-01", "%b", "hi_IN"), "अक्टूबर", "Oct");
  equal(tz("2000-11-01", "%b", "hi_IN"), "नवम्बर", "Nov");
  equal(tz("2000-12-01", "%b", "hi_IN"), "दिसम्बर", "Dec");

  // hi_IN months
  equal(tz("2000-01-01", "%B", "hi_IN"), "जनवरी", "January");
  equal(tz("2000-02-01", "%B", "hi_IN"), "फ़रवरी", "February");
  equal(tz("2000-03-01", "%B", "hi_IN"), "मार्च", "March");
  equal(tz("2000-04-01", "%B", "hi_IN"), "अप्रेल", "April");
  equal(tz("2000-05-01", "%B", "hi_IN"), "मई", "May");
  equal(tz("2000-06-01", "%B", "hi_IN"), "जून", "June");
  equal(tz("2000-07-01", "%B", "hi_IN"), "जुलाई", "July");
  equal(tz("2000-08-01", "%B", "hi_IN"), "अगस्त", "August");
  equal(tz("2000-09-01", "%B", "hi_IN"), "सितम्बर", "September");
  equal(tz("2000-10-01", "%B", "hi_IN"), "अक्टूबर", "October");
  equal(tz("2000-11-01", "%B", "hi_IN"), "नवम्बर", "November");
  equal(tz("2000-12-01", "%B", "hi_IN"), "दिसम्बर", "December");
});
