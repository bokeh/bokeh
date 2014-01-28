#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/hr_HR"));
  //hr_HR abbreviated months
  equal(tz("2000-01-01", "%b", "hr_HR"), "Sij", "Jan");
  equal(tz("2000-02-01", "%b", "hr_HR"), "Vel", "Feb");
  equal(tz("2000-03-01", "%b", "hr_HR"), "Ožu", "Mar");
  equal(tz("2000-04-01", "%b", "hr_HR"), "Tra", "Apr");
  equal(tz("2000-05-01", "%b", "hr_HR"), "Svi", "May");
  equal(tz("2000-06-01", "%b", "hr_HR"), "Lip", "Jun");
  equal(tz("2000-07-01", "%b", "hr_HR"), "Srp", "Jul");
  equal(tz("2000-08-01", "%b", "hr_HR"), "Kol", "Aug");
  equal(tz("2000-09-01", "%b", "hr_HR"), "Ruj", "Sep");
  equal(tz("2000-10-01", "%b", "hr_HR"), "Lis", "Oct");
  equal(tz("2000-11-01", "%b", "hr_HR"), "Stu", "Nov");
  equal(tz("2000-12-01", "%b", "hr_HR"), "Pro", "Dec");

  // hr_HR months
  equal(tz("2000-01-01", "%B", "hr_HR"), "Siječanj", "January");
  equal(tz("2000-02-01", "%B", "hr_HR"), "Veljača", "February");
  equal(tz("2000-03-01", "%B", "hr_HR"), "Ožujak", "March");
  equal(tz("2000-04-01", "%B", "hr_HR"), "Travanj", "April");
  equal(tz("2000-05-01", "%B", "hr_HR"), "Svibanj", "May");
  equal(tz("2000-06-01", "%B", "hr_HR"), "Lipanj", "June");
  equal(tz("2000-07-01", "%B", "hr_HR"), "Srpanj", "July");
  equal(tz("2000-08-01", "%B", "hr_HR"), "Kolovoz", "August");
  equal(tz("2000-09-01", "%B", "hr_HR"), "Rujan", "September");
  equal(tz("2000-10-01", "%B", "hr_HR"), "Listopad", "October");
  equal(tz("2000-11-01", "%B", "hr_HR"), "Studeni", "November");
  equal(tz("2000-12-01", "%B", "hr_HR"), "Prosinac", "December");
});
