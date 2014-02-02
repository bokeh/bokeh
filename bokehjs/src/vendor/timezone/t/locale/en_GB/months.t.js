#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/en_GB"));
  //en_GB abbreviated months
  equal(tz("2000-01-01", "%b", "en_GB"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "en_GB"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "en_GB"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "en_GB"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "en_GB"), "May", "May");
  equal(tz("2000-06-01", "%b", "en_GB"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "en_GB"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "en_GB"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "en_GB"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "en_GB"), "Oct", "Oct");
  equal(tz("2000-11-01", "%b", "en_GB"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "en_GB"), "Dec", "Dec");

  // en_GB months
  equal(tz("2000-01-01", "%B", "en_GB"), "January", "January");
  equal(tz("2000-02-01", "%B", "en_GB"), "February", "February");
  equal(tz("2000-03-01", "%B", "en_GB"), "March", "March");
  equal(tz("2000-04-01", "%B", "en_GB"), "April", "April");
  equal(tz("2000-05-01", "%B", "en_GB"), "May", "May");
  equal(tz("2000-06-01", "%B", "en_GB"), "June", "June");
  equal(tz("2000-07-01", "%B", "en_GB"), "July", "July");
  equal(tz("2000-08-01", "%B", "en_GB"), "August", "August");
  equal(tz("2000-09-01", "%B", "en_GB"), "September", "September");
  equal(tz("2000-10-01", "%B", "en_GB"), "October", "October");
  equal(tz("2000-11-01", "%B", "en_GB"), "November", "November");
  equal(tz("2000-12-01", "%B", "en_GB"), "December", "December");
});
