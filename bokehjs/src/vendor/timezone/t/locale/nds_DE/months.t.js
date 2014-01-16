#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/nds_DE"));
  //nds_DE abbreviated months
  equal(tz("2000-01-01", "%b", "nds_DE"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "nds_DE"), "Feb", "Feb");
  equal(tz("2000-03-01", "%b", "nds_DE"), "Mär", "Mar");
  equal(tz("2000-04-01", "%b", "nds_DE"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "nds_DE"), "Mai", "May");
  equal(tz("2000-06-01", "%b", "nds_DE"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "nds_DE"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "nds_DE"), "Aug", "Aug");
  equal(tz("2000-09-01", "%b", "nds_DE"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "nds_DE"), "Okt", "Oct");
  equal(tz("2000-11-01", "%b", "nds_DE"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "nds_DE"), "Dez", "Dec");

  // nds_DE months
  equal(tz("2000-01-01", "%B", "nds_DE"), "Jannuaar", "January");
  equal(tz("2000-02-01", "%B", "nds_DE"), "Feberwaar", "February");
  equal(tz("2000-03-01", "%B", "nds_DE"), "März", "March");
  equal(tz("2000-04-01", "%B", "nds_DE"), "April", "April");
  equal(tz("2000-05-01", "%B", "nds_DE"), "Mai", "May");
  equal(tz("2000-06-01", "%B", "nds_DE"), "Juni", "June");
  equal(tz("2000-07-01", "%B", "nds_DE"), "Juli", "July");
  equal(tz("2000-08-01", "%B", "nds_DE"), "August", "August");
  equal(tz("2000-09-01", "%B", "nds_DE"), "September", "September");
  equal(tz("2000-10-01", "%B", "nds_DE"), "Oktober", "October");
  equal(tz("2000-11-01", "%B", "nds_DE"), "November", "November");
  equal(tz("2000-12-01", "%B", "nds_DE"), "Dezember", "December");
});
