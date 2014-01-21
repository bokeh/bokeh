#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/lv_LV"));
  //lv_LV abbreviated months
  equal(tz("2000-01-01", "%b", "lv_LV"), "jan", "Jan");
  equal(tz("2000-02-01", "%b", "lv_LV"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "lv_LV"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "lv_LV"), "apr", "Apr");
  equal(tz("2000-05-01", "%b", "lv_LV"), "mai", "May");
  equal(tz("2000-06-01", "%b", "lv_LV"), "jūn", "Jun");
  equal(tz("2000-07-01", "%b", "lv_LV"), "jūl", "Jul");
  equal(tz("2000-08-01", "%b", "lv_LV"), "aug", "Aug");
  equal(tz("2000-09-01", "%b", "lv_LV"), "sep", "Sep");
  equal(tz("2000-10-01", "%b", "lv_LV"), "okt", "Oct");
  equal(tz("2000-11-01", "%b", "lv_LV"), "nov", "Nov");
  equal(tz("2000-12-01", "%b", "lv_LV"), "dec", "Dec");

  // lv_LV months
  equal(tz("2000-01-01", "%B", "lv_LV"), "janvāris", "January");
  equal(tz("2000-02-01", "%B", "lv_LV"), "februāris", "February");
  equal(tz("2000-03-01", "%B", "lv_LV"), "marts", "March");
  equal(tz("2000-04-01", "%B", "lv_LV"), "aprīlis", "April");
  equal(tz("2000-05-01", "%B", "lv_LV"), "maijs", "May");
  equal(tz("2000-06-01", "%B", "lv_LV"), "jūnijs", "June");
  equal(tz("2000-07-01", "%B", "lv_LV"), "jūlijs", "July");
  equal(tz("2000-08-01", "%B", "lv_LV"), "augusts", "August");
  equal(tz("2000-09-01", "%B", "lv_LV"), "septembris", "September");
  equal(tz("2000-10-01", "%B", "lv_LV"), "oktobris", "October");
  equal(tz("2000-11-01", "%B", "lv_LV"), "novembris", "November");
  equal(tz("2000-12-01", "%B", "lv_LV"), "decembris", "December");
});
