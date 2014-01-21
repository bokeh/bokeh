#!/usr/bin/env node
require("../../proof")(24, function (equal, tz) {
  equal(tz("2000-01-01", "%b", "en_US"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "en_US"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "en_US"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "en_US"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "en_US"), "May", "May");
  equal(tz("2000-06-01", "%b", "en_US"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "en_US"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "en_US"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "en_US"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "en_US"), "Oct", "Oct");
  equal(tz("2000-11-01", "%b", "en_US"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "en_US"), "Dec", "Dec");
  equal(tz("2000-01-01", "%B", "en_US"), "January", "January");
  equal(tz("2000-02-01", "%B", "en_US"), "February", "February");
  equal(tz("2000-03-01", "%B", "en_US"), "March", "March");
  equal(tz("2000-04-01", "%B", "en_US"), "April", "April");
  equal(tz("2000-05-01", "%B", "en_US"), "May", "May");
  equal(tz("2000-06-01", "%B", "en_US"), "June", "June");
  equal(tz("2000-07-01", "%B", "en_US"), "July", "July");
  equal(tz("2000-08-01", "%B", "en_US"), "August", "August");
  equal(tz("2000-09-01", "%B", "en_US"), "September", "September");
  equal(tz("2000-10-01", "%B", "en_US"), "October", "October");
  equal(tz("2000-11-01", "%B", "en_US"), "November", "November");
  equal(tz("2000-12-01", "%B", "en_US"), "December", "December");
});
