#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/uk_UA"));
  //uk_UA abbreviated months
  equal(tz("2000-01-01", "%b", "uk_UA"), "січ", "Jan");
  equal(tz("2000-02-01", "%b", "uk_UA"), "лют", "Feb");
  equal(tz("2000-03-01", "%b", "uk_UA"), "бер", "Mar");
  equal(tz("2000-04-01", "%b", "uk_UA"), "кві", "Apr");
  equal(tz("2000-05-01", "%b", "uk_UA"), "тра", "May");
  equal(tz("2000-06-01", "%b", "uk_UA"), "чер", "Jun");
  equal(tz("2000-07-01", "%b", "uk_UA"), "лип", "Jul");
  equal(tz("2000-08-01", "%b", "uk_UA"), "сер", "Aug");
  equal(tz("2000-09-01", "%b", "uk_UA"), "вер", "Sep");
  equal(tz("2000-10-01", "%b", "uk_UA"), "жов", "Oct");
  equal(tz("2000-11-01", "%b", "uk_UA"), "лис", "Nov");
  equal(tz("2000-12-01", "%b", "uk_UA"), "гру", "Dec");

  // uk_UA months
  equal(tz("2000-01-01", "%B", "uk_UA"), "січень", "January");
  equal(tz("2000-02-01", "%B", "uk_UA"), "лютий", "February");
  equal(tz("2000-03-01", "%B", "uk_UA"), "березень", "March");
  equal(tz("2000-04-01", "%B", "uk_UA"), "квітень", "April");
  equal(tz("2000-05-01", "%B", "uk_UA"), "травень", "May");
  equal(tz("2000-06-01", "%B", "uk_UA"), "червень", "June");
  equal(tz("2000-07-01", "%B", "uk_UA"), "липень", "July");
  equal(tz("2000-08-01", "%B", "uk_UA"), "серпень", "August");
  equal(tz("2000-09-01", "%B", "uk_UA"), "вересень", "September");
  equal(tz("2000-10-01", "%B", "uk_UA"), "жовтень", "October");
  equal(tz("2000-11-01", "%B", "uk_UA"), "листопад", "November");
  equal(tz("2000-12-01", "%B", "uk_UA"), "грудень", "December");
});
