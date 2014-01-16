#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/nl_BE"));
  //nl_BE abbreviated months
  equal(tz("2000-01-01", "%b", "nl_BE"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "nl_BE"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "nl_BE"), "mrt", "Mar");
  equal(tz("2000-04-01", "%b", "nl_BE"), "apr", "Apr");
  equal(tz("2000-05-01", "%b", "nl_BE"), "mei", "May");
  equal(tz("2000-06-01", "%b", "nl_BE"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "nl_BE"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "nl_BE"), "aug", "Aug");
  equal(tz("2000-09-01", "%b", "nl_BE"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "nl_BE"), "okt", "Oct");
  equal(tz("2000-11-01", "%b", "nl_BE"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "nl_BE"), "dec", "Dec");

  // nl_BE months
  equal(tz("2000-01-01", "%B", "nl_BE"), "januari", "January");
  equal(tz("2000-02-01", "%B", "nl_BE"), "februari", "February");
  equal(tz("2000-03-01", "%B", "nl_BE"), "maart", "March");
  equal(tz("2000-04-01", "%B", "nl_BE"), "april", "April");
  equal(tz("2000-05-01", "%B", "nl_BE"), "mei", "May");
  equal(tz("2000-06-01", "%B", "nl_BE"), "juni", "June");
  equal(tz("2000-07-01", "%B", "nl_BE"), "juli", "July");
  equal(tz("2000-08-01", "%B", "nl_BE"), "augustus", "August");
  equal(tz("2000-09-01", "%B", "nl_BE"), "september", "September");
  equal(tz("2000-10-01", "%B", "nl_BE"), "oktober", "October");
  equal(tz("2000-11-01", "%B", "nl_BE"), "november", "November");
  equal(tz("2000-12-01", "%B", "nl_BE"), "december", "December");
});
