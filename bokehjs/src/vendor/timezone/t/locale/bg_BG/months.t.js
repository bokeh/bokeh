#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/bg_BG"));
  //bg_BG abbreviated months
  equal(tz("2000-01-01", "%b", "bg_BG"), "яну", "Jan");
  equal(tz("2000-02-01", "%b", "bg_BG"), "фев", "Feb");
  equal(tz("2000-03-01", "%b", "bg_BG"), "мар", "Mar");
  equal(tz("2000-04-01", "%b", "bg_BG"), "апр", "Apr");
  equal(tz("2000-05-01", "%b", "bg_BG"), "май", "May");
  equal(tz("2000-06-01", "%b", "bg_BG"), "юни", "Jun");
  equal(tz("2000-07-01", "%b", "bg_BG"), "юли", "Jul");
  equal(tz("2000-08-01", "%b", "bg_BG"), "авг", "Aug");
  equal(tz("2000-09-01", "%b", "bg_BG"), "сеп", "Sep");
  equal(tz("2000-10-01", "%b", "bg_BG"), "окт", "Oct");
  equal(tz("2000-11-01", "%b", "bg_BG"), "ное", "Nov");
  equal(tz("2000-12-01", "%b", "bg_BG"), "дек", "Dec");

  // bg_BG months
  equal(tz("2000-01-01", "%B", "bg_BG"), "януари", "January");
  equal(tz("2000-02-01", "%B", "bg_BG"), "февруари", "February");
  equal(tz("2000-03-01", "%B", "bg_BG"), "март", "March");
  equal(tz("2000-04-01", "%B", "bg_BG"), "април", "April");
  equal(tz("2000-05-01", "%B", "bg_BG"), "май", "May");
  equal(tz("2000-06-01", "%B", "bg_BG"), "юни", "June");
  equal(tz("2000-07-01", "%B", "bg_BG"), "юли", "July");
  equal(tz("2000-08-01", "%B", "bg_BG"), "август", "August");
  equal(tz("2000-09-01", "%B", "bg_BG"), "септември", "September");
  equal(tz("2000-10-01", "%B", "bg_BG"), "октомври", "October");
  equal(tz("2000-11-01", "%B", "bg_BG"), "ноември", "November");
  equal(tz("2000-12-01", "%B", "bg_BG"), "декември", "December");
});
