#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/nl_NL"));
  //nl_NL abbreviated months
  equal(tz("2000-01-01", "%b", "nl_NL"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "nl_NL"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "nl_NL"), "mrt", "Mar");
  equal(tz("2000-04-01", "%b", "nl_NL"), "apr", "Apr");
  equal(tz("2000-05-01", "%b", "nl_NL"), "mei", "May");
  equal(tz("2000-06-01", "%b", "nl_NL"), "jun", "Jun");
  equal(tz("2000-07-01", "%b", "nl_NL"), "jul", "Jul");
  equal(tz("2000-08-01", "%b", "nl_NL"), "aug", "Aug");
  equal(tz("2000-09-01", "%b", "nl_NL"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "nl_NL"), "okt", "Oct");
  equal(tz("2000-11-01", "%b", "nl_NL"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "nl_NL"), "dec", "Dec");

  // nl_NL months
  equal(tz("2000-01-01", "%B", "nl_NL"), "januari", "January");
  equal(tz("2000-02-01", "%B", "nl_NL"), "februari", "February");
  equal(tz("2000-03-01", "%B", "nl_NL"), "maart", "March");
  equal(tz("2000-04-01", "%B", "nl_NL"), "april", "April");
  equal(tz("2000-05-01", "%B", "nl_NL"), "mei", "May");
  equal(tz("2000-06-01", "%B", "nl_NL"), "juni", "June");
  equal(tz("2000-07-01", "%B", "nl_NL"), "juli", "July");
  equal(tz("2000-08-01", "%B", "nl_NL"), "augustus", "August");
  equal(tz("2000-09-01", "%B", "nl_NL"), "september", "September");
  equal(tz("2000-10-01", "%B", "nl_NL"), "oktober", "October");
  equal(tz("2000-11-01", "%B", "nl_NL"), "november", "November");
  equal(tz("2000-12-01", "%B", "nl_NL"), "december", "December");
});
