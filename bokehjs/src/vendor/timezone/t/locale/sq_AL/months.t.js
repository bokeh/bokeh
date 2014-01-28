#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/sq_AL"));
  //sq_AL abbreviated months
  equal(tz("2000-01-01", "%b", "sq_AL"), "Jan", "Jan");
  equal(tz("2000-02-01", "%b", "sq_AL"), "Shk", "Feb");
  equal(tz("2000-03-01", "%b", "sq_AL"), "Mar", "Mar");
  equal(tz("2000-04-01", "%b", "sq_AL"), "Pri", "Apr");
  equal(tz("2000-05-01", "%b", "sq_AL"), "Maj", "May");
  equal(tz("2000-06-01", "%b", "sq_AL"), "Qer", "Jun");
  equal(tz("2000-07-01", "%b", "sq_AL"), "Kor", "Jul");
  equal(tz("2000-08-01", "%b", "sq_AL"), "Gsh", "Aug");
  equal(tz("2000-09-01", "%b", "sq_AL"), "Sht", "Sep");
  equal(tz("2000-10-01", "%b", "sq_AL"), "Tet", "Oct");
  equal(tz("2000-11-01", "%b", "sq_AL"), "Nën", "Nov");
  equal(tz("2000-12-01", "%b", "sq_AL"), "Dhj", "Dec");

  // sq_AL months
  equal(tz("2000-01-01", "%B", "sq_AL"), "janar", "January");
  equal(tz("2000-02-01", "%B", "sq_AL"), "shkurt", "February");
  equal(tz("2000-03-01", "%B", "sq_AL"), "mars", "March");
  equal(tz("2000-04-01", "%B", "sq_AL"), "prill", "April");
  equal(tz("2000-05-01", "%B", "sq_AL"), "maj", "May");
  equal(tz("2000-06-01", "%B", "sq_AL"), "qershor", "June");
  equal(tz("2000-07-01", "%B", "sq_AL"), "korrik", "July");
  equal(tz("2000-08-01", "%B", "sq_AL"), "gusht", "August");
  equal(tz("2000-09-01", "%B", "sq_AL"), "shtator", "September");
  equal(tz("2000-10-01", "%B", "sq_AL"), "tetor", "October");
  equal(tz("2000-11-01", "%B", "sq_AL"), "nëntor", "November");
  equal(tz("2000-12-01", "%B", "sq_AL"), "dhjetor", "December");
});
