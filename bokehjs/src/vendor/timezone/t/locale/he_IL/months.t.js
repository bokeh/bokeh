#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/he_IL"));
  //he_IL abbreviated months
  equal(tz("2000-01-01", "%b", "he_IL"), "ינו", "Jan");
  equal(tz("2000-02-01", "%b", "he_IL"), "פבר", "Feb");
  equal(tz("2000-03-01", "%b", "he_IL"), "מרץ", "Mar");
  equal(tz("2000-04-01", "%b", "he_IL"), "אפר", "Apr");
  equal(tz("2000-05-01", "%b", "he_IL"), "מאי", "May");
  equal(tz("2000-06-01", "%b", "he_IL"), "יונ", "Jun");
  equal(tz("2000-07-01", "%b", "he_IL"), "יול", "Jul");
  equal(tz("2000-08-01", "%b", "he_IL"), "אוג", "Aug");
  equal(tz("2000-09-01", "%b", "he_IL"), "ספט", "Sep");
  equal(tz("2000-10-01", "%b", "he_IL"), "אוק", "Oct");
  equal(tz("2000-11-01", "%b", "he_IL"), "נוב", "Nov");
  equal(tz("2000-12-01", "%b", "he_IL"), "דצמ", "Dec");

  // he_IL months
  equal(tz("2000-01-01", "%B", "he_IL"), "ינואר", "January");
  equal(tz("2000-02-01", "%B", "he_IL"), "פברואר", "February");
  equal(tz("2000-03-01", "%B", "he_IL"), "מרץ", "March");
  equal(tz("2000-04-01", "%B", "he_IL"), "אפריל", "April");
  equal(tz("2000-05-01", "%B", "he_IL"), "מאי", "May");
  equal(tz("2000-06-01", "%B", "he_IL"), "יוני", "June");
  equal(tz("2000-07-01", "%B", "he_IL"), "יולי", "July");
  equal(tz("2000-08-01", "%B", "he_IL"), "אוגוסט", "August");
  equal(tz("2000-09-01", "%B", "he_IL"), "ספטמבר", "September");
  equal(tz("2000-10-01", "%B", "he_IL"), "אוקטובר", "October");
  equal(tz("2000-11-01", "%B", "he_IL"), "נובמבר", "November");
  equal(tz("2000-12-01", "%B", "he_IL"), "דצמבר", "December");
});
