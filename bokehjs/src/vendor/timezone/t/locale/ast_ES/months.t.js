#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/ast_ES"));
  //ast_ES abbreviated months
  equal(tz("2000-01-01", "%b", "ast_ES"), "xin", "Jan");
  equal(tz("2000-02-01", "%b", "ast_ES"), "feb", "Feb");
  equal(tz("2000-03-01", "%b", "ast_ES"), "mar", "Mar");
  equal(tz("2000-04-01", "%b", "ast_ES"), "abr", "Apr");
  equal(tz("2000-05-01", "%b", "ast_ES"), "may", "May");
  equal(tz("2000-06-01", "%b", "ast_ES"), "xun", "Jun");
  equal(tz("2000-07-01", "%b", "ast_ES"), "xnt", "Jul");
  equal(tz("2000-08-01", "%b", "ast_ES"), "ago", "Aug");
  equal(tz("2000-09-01", "%b", "ast_ES"), "set", "Sep");
  equal(tz("2000-10-01", "%b", "ast_ES"), "och", "Oct");
  equal(tz("2000-11-01", "%b", "ast_ES"), "pay", "Nov");
  equal(tz("2000-12-01", "%b", "ast_ES"), "avi", "Dec");

  // ast_ES months
  equal(tz("2000-01-01", "%B", "ast_ES"), "xineru", "January");
  equal(tz("2000-02-01", "%B", "ast_ES"), "febreru", "February");
  equal(tz("2000-03-01", "%B", "ast_ES"), "marzu", "March");
  equal(tz("2000-04-01", "%B", "ast_ES"), "abril", "April");
  equal(tz("2000-05-01", "%B", "ast_ES"), "mayu", "May");
  equal(tz("2000-06-01", "%B", "ast_ES"), "xunu", "June");
  equal(tz("2000-07-01", "%B", "ast_ES"), "xunetu", "July");
  equal(tz("2000-08-01", "%B", "ast_ES"), "agostu", "August");
  equal(tz("2000-09-01", "%B", "ast_ES"), "setiembre", "September");
  equal(tz("2000-10-01", "%B", "ast_ES"), "ochobre", "October");
  equal(tz("2000-11-01", "%B", "ast_ES"), "payares", "November");
  equal(tz("2000-12-01", "%B", "ast_ES"), "avientu", "December");
});
