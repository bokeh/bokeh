#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/sr_RS"));
  //sr_RS abbreviated months
  equal(tz("2000-01-01", "%b", "sr_RS"), "јан", "Jan");
  equal(tz("2000-02-01", "%b", "sr_RS"), "феб", "Feb");
  equal(tz("2000-03-01", "%b", "sr_RS"), "мар", "Mar");
  equal(tz("2000-04-01", "%b", "sr_RS"), "апр", "Apr");
  equal(tz("2000-05-01", "%b", "sr_RS"), "мај", "May");
  equal(tz("2000-06-01", "%b", "sr_RS"), "јун", "Jun");
  equal(tz("2000-07-01", "%b", "sr_RS"), "јул", "Jul");
  equal(tz("2000-08-01", "%b", "sr_RS"), "авг", "Aug");
  equal(tz("2000-09-01", "%b", "sr_RS"), "сеп", "Sep");
  equal(tz("2000-10-01", "%b", "sr_RS"), "окт", "Oct");
  equal(tz("2000-11-01", "%b", "sr_RS"), "нов", "Nov");
  equal(tz("2000-12-01", "%b", "sr_RS"), "дец", "Dec");

  // sr_RS months
  equal(tz("2000-01-01", "%B", "sr_RS"), "јануар", "January");
  equal(tz("2000-02-01", "%B", "sr_RS"), "фебруар", "February");
  equal(tz("2000-03-01", "%B", "sr_RS"), "март", "March");
  equal(tz("2000-04-01", "%B", "sr_RS"), "април", "April");
  equal(tz("2000-05-01", "%B", "sr_RS"), "мај", "May");
  equal(tz("2000-06-01", "%B", "sr_RS"), "јун", "June");
  equal(tz("2000-07-01", "%B", "sr_RS"), "јул", "July");
  equal(tz("2000-08-01", "%B", "sr_RS"), "август", "August");
  equal(tz("2000-09-01", "%B", "sr_RS"), "септембар", "September");
  equal(tz("2000-10-01", "%B", "sr_RS"), "октобар", "October");
  equal(tz("2000-11-01", "%B", "sr_RS"), "новембар", "November");
  equal(tz("2000-12-01", "%B", "sr_RS"), "децембар", "December");
});
