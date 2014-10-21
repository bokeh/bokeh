(function() {
  define(["underscore"], function(_) {
    var ONE_DAY, ONE_HOUR, ONE_MILLI, ONE_MINUTE, ONE_MONTH, ONE_SECOND, ONE_YEAR, argmin, copy_date, last_month_no_later_than, last_year_no_later_than;
    ONE_MILLI = 1.0;
    ONE_SECOND = 1000.0;
    ONE_MINUTE = 60.0 * ONE_SECOND;
    ONE_HOUR = 60 * ONE_MINUTE;
    ONE_DAY = 24 * ONE_HOUR;
    ONE_MONTH = 30 * ONE_DAY;
    ONE_YEAR = 365 * ONE_DAY;
    argmin = function(arr) {
      var ret;
      ret = _.min(_.range(arr.length), (function(i) {
        return arr[i];
      }));
      return ret;
    };
    copy_date = function(date) {
      return new Date(date.getTime());
    };
    last_month_no_later_than = function(date) {
      date = copy_date(date);
      date.setUTCDate(1);
      date.setUTCHours(0);
      date.setUTCMinutes(0);
      date.setUTCSeconds(0);
      date.setUTCMilliseconds(0);
      return date;
    };
    last_year_no_later_than = function(date) {
      date = last_month_no_later_than(date);
      date.setUTCMonth(0);
      return date;
    };
    return {
      "argmin": argmin,
      "copy_date": copy_date,
      "last_month_no_later_than": last_month_no_later_than,
      "last_year_no_later_than": last_year_no_later_than,
      "ONE_MILLI": ONE_MILLI,
      "ONE_SECOND": ONE_SECOND,
      "ONE_MINUTE": ONE_MINUTE,
      "ONE_HOUR": ONE_HOUR,
      "ONE_DAY": ONE_DAY,
      "ONE_MONTH": ONE_MONTH,
      "ONE_YEAR": ONE_YEAR
    };
  });

}).call(this);

/*
//@ sourceMappingURL=util.js.map
*/