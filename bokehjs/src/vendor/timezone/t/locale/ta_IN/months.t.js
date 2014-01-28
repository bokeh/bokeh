#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/ta_IN"));
  //ta_IN abbreviated months
  equal(tz("2000-01-01", "%b", "ta_IN"), "ஜன", "Jan");
  equal(tz("2000-02-01", "%b", "ta_IN"), "பிப்", "Feb");
  equal(tz("2000-03-01", "%b", "ta_IN"), "மார்", "Mar");
  equal(tz("2000-04-01", "%b", "ta_IN"), "ஏப்", "Apr");
  equal(tz("2000-05-01", "%b", "ta_IN"), "மே", "May");
  equal(tz("2000-06-01", "%b", "ta_IN"), "ஜூன்", "Jun");
  equal(tz("2000-07-01", "%b", "ta_IN"), "ஜூலை", "Jul");
  equal(tz("2000-08-01", "%b", "ta_IN"), "ஆக", "Aug");
  equal(tz("2000-09-01", "%b", "ta_IN"), "செப்", "Sep");
  equal(tz("2000-10-01", "%b", "ta_IN"), "அக்", "Oct");
  equal(tz("2000-11-01", "%b", "ta_IN"), "நவ", "Nov");
  equal(tz("2000-12-01", "%b", "ta_IN"), "டிச", "Dec");

  // ta_IN months
  equal(tz("2000-01-01", "%B", "ta_IN"), "ஜனவரி", "January");
  equal(tz("2000-02-01", "%B", "ta_IN"), "பிப்ரவரி", "February");
  equal(tz("2000-03-01", "%B", "ta_IN"), "மார்ச்", "March");
  equal(tz("2000-04-01", "%B", "ta_IN"), "ஏப்ரல்", "April");
  equal(tz("2000-05-01", "%B", "ta_IN"), "மே", "May");
  equal(tz("2000-06-01", "%B", "ta_IN"), "ஜூன்", "June");
  equal(tz("2000-07-01", "%B", "ta_IN"), "ஜூலை", "July");
  equal(tz("2000-08-01", "%B", "ta_IN"), "ஆகஸ்ட்", "August");
  equal(tz("2000-09-01", "%B", "ta_IN"), "செப்டம்பர்", "September");
  equal(tz("2000-10-01", "%B", "ta_IN"), "அக்டோபர்", "October");
  equal(tz("2000-11-01", "%B", "ta_IN"), "நவம்பர்", "November");
  equal(tz("2000-12-01", "%B", "ta_IN"), "டிசம்பர்", "December");
});
