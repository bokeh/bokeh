#!/usr/bin/env node
require("../../proof")(24, function (tz, equal) {
  var tz = tz(require("timezone/el_GR"));
  //el_GR abbreviated months
  equal(tz("2000-01-01", "%b", "el_GR"), "Ιαν", "Jan");
  equal(tz("2000-02-01", "%b", "el_GR"), "Φεβ", "Feb");
  equal(tz("2000-03-01", "%b", "el_GR"), "Μάρ", "Mar");
  equal(tz("2000-04-01", "%b", "el_GR"), "Απρ", "Apr");
  equal(tz("2000-05-01", "%b", "el_GR"), "Μάι", "May");
  equal(tz("2000-06-01", "%b", "el_GR"), "Ιούν", "Jun");
  equal(tz("2000-07-01", "%b", "el_GR"), "Ιούλ", "Jul");
  equal(tz("2000-08-01", "%b", "el_GR"), "Αύγ", "Aug");
  equal(tz("2000-09-01", "%b", "el_GR"), "Σεπ", "Sep");
  equal(tz("2000-10-01", "%b", "el_GR"), "Οκτ", "Oct");
  equal(tz("2000-11-01", "%b", "el_GR"), "Νοέ", "Nov");
  equal(tz("2000-12-01", "%b", "el_GR"), "Δεκ", "Dec");

  // el_GR months
  equal(tz("2000-01-01", "%B", "el_GR"), "Ιανουάριος", "January");
  equal(tz("2000-02-01", "%B", "el_GR"), "Φεβρουάριος", "February");
  equal(tz("2000-03-01", "%B", "el_GR"), "Μάρτιος", "March");
  equal(tz("2000-04-01", "%B", "el_GR"), "Απρίλιος", "April");
  equal(tz("2000-05-01", "%B", "el_GR"), "Μάιος", "May");
  equal(tz("2000-06-01", "%B", "el_GR"), "Ιούνιος", "June");
  equal(tz("2000-07-01", "%B", "el_GR"), "Ιούλιος", "July");
  equal(tz("2000-08-01", "%B", "el_GR"), "Αύγουστος", "August");
  equal(tz("2000-09-01", "%B", "el_GR"), "Σεπτέμβριος", "September");
  equal(tz("2000-10-01", "%B", "el_GR"), "Οκτώβριος", "October");
  equal(tz("2000-11-01", "%B", "el_GR"), "Νοέμβριος", "November");
  equal(tz("2000-12-01", "%B", "el_GR"), "Δεκέμβριος", "December");
});
