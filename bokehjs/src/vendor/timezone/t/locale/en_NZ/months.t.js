#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/en_NZ"));
  //en_NZ abbreviated months
  equal(tz("2000-01-01", "%b", "en_NZ"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "en_NZ"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "en_NZ"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "en_NZ"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "en_NZ"), "May", "May");
  equal(tz("2000-06-01", "%b", "en_NZ"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "en_NZ"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "en_NZ"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "en_NZ"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "en_NZ"), "Oct", "Oct");
  equal(tz("2000-11-01", "%b", "en_NZ"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "en_NZ"), "Dec", "Dec");

  // en_NZ months
  equal(tz("2000-01-01", "%B", "en_NZ"), "January", "January");
  equal(tz("2000-02-01", "%B", "en_NZ"), "February", "February");
  equal(tz("2000-03-01", "%B", "en_NZ"), "March", "March");
  equal(tz("2000-04-01", "%B", "en_NZ"), "April", "April");
  equal(tz("2000-05-01", "%B", "en_NZ"), "May", "May");
  equal(tz("2000-06-01", "%B", "en_NZ"), "June", "June");
  equal(tz("2000-07-01", "%B", "en_NZ"), "July", "July");
  equal(tz("2000-08-01", "%B", "en_NZ"), "August", "August");
  equal(tz("2000-09-01", "%B", "en_NZ"), "September", "September");
  equal(tz("2000-10-01", "%B", "en_NZ"), "October", "October");
  equal(tz("2000-11-01", "%B", "en_NZ"), "November", "November");
  equal(tz("2000-12-01", "%B", "en_NZ"), "December", "December");
});
