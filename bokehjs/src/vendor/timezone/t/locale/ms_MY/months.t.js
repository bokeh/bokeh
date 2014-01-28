#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/ms_MY"));
  //ms_MY abbreviated months
  equal(tz("2000-01-01", "%b", "ms_MY"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "ms_MY"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "ms_MY"), "Mac", "Mar");
  equal(tz("2000-04-01", "%b", "ms_MY"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "ms_MY"), "Mei", "May");
  equal(tz("2000-06-01", "%b", "ms_MY"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "ms_MY"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "ms_MY"), "Ogos", "Aug");
  equal(tz("2000-09-01", "%b", "ms_MY"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "ms_MY"), "Okt", "Oct");
  equal(tz("2000-11-01", "%b", "ms_MY"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "ms_MY"), "Dis", "Dec");

  // ms_MY months
  equal(tz("2000-01-01", "%B", "ms_MY"), "Januari", "January");
  equal(tz("2000-02-01", "%B", "ms_MY"), "Februari", "February");
  equal(tz("2000-03-01", "%B", "ms_MY"), "Mac", "March");
  equal(tz("2000-04-01", "%B", "ms_MY"), "April", "April");
  equal(tz("2000-05-01", "%B", "ms_MY"), "Mei", "May");
  equal(tz("2000-06-01", "%B", "ms_MY"), "Jun", "June");
  equal(tz("2000-07-01", "%B", "ms_MY"), "Julai", "July");
  equal(tz("2000-08-01", "%B", "ms_MY"), "Ogos", "August");
  equal(tz("2000-09-01", "%B", "ms_MY"), "September", "September");
  equal(tz("2000-10-01", "%B", "ms_MY"), "Oktober", "October");
  equal(tz("2000-11-01", "%B", "ms_MY"), "November", "November");
  equal(tz("2000-12-01", "%B", "ms_MY"), "Disember", "December");
});
