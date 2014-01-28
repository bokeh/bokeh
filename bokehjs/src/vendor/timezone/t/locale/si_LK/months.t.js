#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/si_LK"));
  //si_LK abbreviated months
  equal(tz("2000-01-01", "%b", "si_LK"), "ජන", "Jan");
  equal(tz("2000-02-01", "%b", "si_LK"), "පෙබ", "Feb");
  equal(tz("2000-03-01", "%b", "si_LK"), "මාර්", "Mar");
  equal(tz("2000-04-01", "%b", "si_LK"), "අප්‍රි", "Apr");
  equal(tz("2000-05-01", "%b", "si_LK"), "මැයි", "May");
  equal(tz("2000-06-01", "%b", "si_LK"), "ජූනි", "Jun");
  equal(tz("2000-07-01", "%b", "si_LK"), "ජූලි", "Jul");
  equal(tz("2000-08-01", "%b", "si_LK"), "අගෝ", "Aug");
  equal(tz("2000-09-01", "%b", "si_LK"), "සැප්", "Sep");
  equal(tz("2000-10-01", "%b", "si_LK"), "ඔක්", "Oct");
  equal(tz("2000-11-01", "%b", "si_LK"), "නෙවැ", "Nov");
  equal(tz("2000-12-01", "%b", "si_LK"), "දෙසැ", "Dec");

  // si_LK months
  equal(tz("2000-01-01", "%B", "si_LK"), "ජනවාරි", "January");
  equal(tz("2000-02-01", "%B", "si_LK"), "පෙබරවාරි", "February");
  equal(tz("2000-03-01", "%B", "si_LK"), "මාර්තු", "March");
  equal(tz("2000-04-01", "%B", "si_LK"), "අප්‍රියෙල්", "April");
  equal(tz("2000-05-01", "%B", "si_LK"), "මැයි", "May");
  equal(tz("2000-06-01", "%B", "si_LK"), "ජූනි", "June");
  equal(tz("2000-07-01", "%B", "si_LK"), "ජූලි", "July");
  equal(tz("2000-08-01", "%B", "si_LK"), "අගෝස්තු", "August");
  equal(tz("2000-09-01", "%B", "si_LK"), "සැප්තැම්බර්", "September");
  equal(tz("2000-10-01", "%B", "si_LK"), "ඔක්තෝබර්", "October");
  equal(tz("2000-11-01", "%B", "si_LK"), "නොවැම්බර්", "November");
  equal(tz("2000-12-01", "%B", "si_LK"), "දෙසැම්බර්", "December");
});
