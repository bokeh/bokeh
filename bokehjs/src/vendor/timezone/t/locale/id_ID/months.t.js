#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/id_ID"));
  //id_ID abbreviated months
  equal(tz("2000-01-01", "%b", "id_ID"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "id_ID"), "Peb", "Feb");
  equal(tz("2000-03-01", "%b", "id_ID"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "id_ID"), "Apr", "Apr");
  equal(tz("2000-05-01", "%b", "id_ID"), "Mei", "May");
  equal(tz("2000-06-01", "%b", "id_ID"), "Jun", "Jun");
  equal(tz("2000-07-01", "%b", "id_ID"), "Jul", "Jul");
  equal(tz("2000-08-01", "%b", "id_ID"), "Agu", "Aug");
  equal(tz("2000-09-01", "%b", "id_ID"), "Sep", "Sep");
  equal(tz("2000-10-01", "%b", "id_ID"), "Okt", "Oct");
  equal(tz("2000-11-01", "%b", "id_ID"), "Nov", "Nov");
  equal(tz("2000-12-01", "%b", "id_ID"), "Des", "Dec");

  // id_ID months
  equal(tz("2000-01-01", "%B", "id_ID"), "Januari", "January");
  equal(tz("2000-02-01", "%B", "id_ID"), "Pebruari", "February");
  equal(tz("2000-03-01", "%B", "id_ID"), "Maret", "March");
  equal(tz("2000-04-01", "%B", "id_ID"), "April", "April");
  equal(tz("2000-05-01", "%B", "id_ID"), "Mei", "May");
  equal(tz("2000-06-01", "%B", "id_ID"), "Juni", "June");
  equal(tz("2000-07-01", "%B", "id_ID"), "Juli", "July");
  equal(tz("2000-08-01", "%B", "id_ID"), "Agustus", "August");
  equal(tz("2000-09-01", "%B", "id_ID"), "September", "September");
  equal(tz("2000-10-01", "%B", "id_ID"), "Oktober", "October");
  equal(tz("2000-11-01", "%B", "id_ID"), "November", "November");
  equal(tz("2000-12-01", "%B", "id_ID"), "Desember", "December");
});
