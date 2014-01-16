#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/ko_KR"));
  //ko_KR abbreviated months
  equal(tz("2000-01-01", "%b", "ko_KR"), " 1월", "Jan");
  equal(tz("2000-02-01", "%b", "ko_KR"), " 2월", "Feb");
  equal(tz("2000-03-01", "%b", "ko_KR"), " 3월", "Mar");
  equal(tz("2000-04-01", "%b", "ko_KR"), " 4월", "Apr");
  equal(tz("2000-05-01", "%b", "ko_KR"), " 5월", "May");
  equal(tz("2000-06-01", "%b", "ko_KR"), " 6월", "Jun");
  equal(tz("2000-07-01", "%b", "ko_KR"), " 7월", "Jul");
  equal(tz("2000-08-01", "%b", "ko_KR"), " 8월", "Aug");
  equal(tz("2000-09-01", "%b", "ko_KR"), " 9월", "Sep");
  equal(tz("2000-10-01", "%b", "ko_KR"), "10월", "Oct");
  equal(tz("2000-11-01", "%b", "ko_KR"), "11월", "Nov");
  equal(tz("2000-12-01", "%b", "ko_KR"), "12월", "Dec");

  // ko_KR months
  equal(tz("2000-01-01", "%B", "ko_KR"), "1월", "January");
  equal(tz("2000-02-01", "%B", "ko_KR"), "2월", "February");
  equal(tz("2000-03-01", "%B", "ko_KR"), "3월", "March");
  equal(tz("2000-04-01", "%B", "ko_KR"), "4월", "April");
  equal(tz("2000-05-01", "%B", "ko_KR"), "5월", "May");
  equal(tz("2000-06-01", "%B", "ko_KR"), "6월", "June");
  equal(tz("2000-07-01", "%B", "ko_KR"), "7월", "July");
  equal(tz("2000-08-01", "%B", "ko_KR"), "8월", "August");
  equal(tz("2000-09-01", "%B", "ko_KR"), "9월", "September");
  equal(tz("2000-10-01", "%B", "ko_KR"), "10월", "October");
  equal(tz("2000-11-01", "%B", "ko_KR"), "11월", "November");
  equal(tz("2000-12-01", "%B", "ko_KR"), "12월", "December");
});
