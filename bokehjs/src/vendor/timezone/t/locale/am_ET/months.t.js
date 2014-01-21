#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/am_ET"));
  //am_ET abbreviated months
  equal(tz("2000-01-01", "%b", "am_ET"), "ጃንዩ", "Jan");
  equal(tz("2000-02-01", "%b", "am_ET"), "ፌብሩ", "Feb");
  equal(tz("2000-03-01", "%b", "am_ET"), "ማርች", "Mar");
  equal(tz("2000-04-01", "%b", "am_ET"), "ኤፕረ", "Apr");
  equal(tz("2000-05-01", "%b", "am_ET"), "ሜይ ", "May");
  equal(tz("2000-06-01", "%b", "am_ET"), "ጁን ", "Jun");
  equal(tz("2000-07-01", "%b", "am_ET"), "ጁላይ", "Jul");
  equal(tz("2000-08-01", "%b", "am_ET"), "ኦገስ", "Aug");
  equal(tz("2000-09-01", "%b", "am_ET"), "ሴፕቴ", "Sep");
  equal(tz("2000-10-01", "%b", "am_ET"), "ኦክተ", "Oct");
  equal(tz("2000-11-01", "%b", "am_ET"), "ኖቬም", "Nov");
  equal(tz("2000-12-01", "%b", "am_ET"), "ዲሴም", "Dec");

  // am_ET months
  equal(tz("2000-01-01", "%B", "am_ET"), "ጃንዩወሪ", "January");
  equal(tz("2000-02-01", "%B", "am_ET"), "ፌብሩወሪ", "February");
  equal(tz("2000-03-01", "%B", "am_ET"), "ማርች", "March");
  equal(tz("2000-04-01", "%B", "am_ET"), "ኤፕረል", "April");
  equal(tz("2000-05-01", "%B", "am_ET"), "ሜይ", "May");
  equal(tz("2000-06-01", "%B", "am_ET"), "ጁን", "June");
  equal(tz("2000-07-01", "%B", "am_ET"), "ጁላይ", "July");
  equal(tz("2000-08-01", "%B", "am_ET"), "ኦገስት", "August");
  equal(tz("2000-09-01", "%B", "am_ET"), "ሴፕቴምበር", "September");
  equal(tz("2000-10-01", "%B", "am_ET"), "ኦክተውበር", "October");
  equal(tz("2000-11-01", "%B", "am_ET"), "ኖቬምበር", "November");
  equal(tz("2000-12-01", "%B", "am_ET"), "ዲሴምበር", "December");
});
