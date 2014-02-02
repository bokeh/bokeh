#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/en_AU"));
  //en_AU abbreviated months
  equal(tz("2000-01-01", "%b", "en_AU"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "en_AU"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "en_AU"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "en_AU"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "en_AU"), "May", "May");
  equal(tz("2000-06-01", "%b", "en_AU"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "en_AU"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "en_AU"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "en_AU"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "en_AU"), "Oct", "Oct");
  equal(tz("2000-11-01", "%b", "en_AU"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "en_AU"), "Dec", "Dec");

  // en_AU months
  equal(tz("2000-01-01", "%B", "en_AU"), "January", "January");
  equal(tz("2000-02-01", "%B", "en_AU"), "February", "February");
  equal(tz("2000-03-01", "%B", "en_AU"), "March", "March");
  equal(tz("2000-04-01", "%B", "en_AU"), "April", "April");
  equal(tz("2000-05-01", "%B", "en_AU"), "May", "May");
  equal(tz("2000-06-01", "%B", "en_AU"), "June", "June");
  equal(tz("2000-07-01", "%B", "en_AU"), "July", "July");
  equal(tz("2000-08-01", "%B", "en_AU"), "August", "August");
  equal(tz("2000-09-01", "%B", "en_AU"), "September", "September");
  equal(tz("2000-10-01", "%B", "en_AU"), "October", "October");
  equal(tz("2000-11-01", "%B", "en_AU"), "November", "November");
  equal(tz("2000-12-01", "%B", "en_AU"), "December", "December");
});
