
# TODO Clear out debugging code, etc.
# TODO Organize helper functions.
# TODO The years ticker doesn't always use the roundest numbers; it should
# probably use a special ticker.
# TODO Add tests.
# TODO There used to be a TODO: restore memoization.  So.... do that?
# TODO Instead of a get_ticks() method, there used to be an auto_ticks()
# function that took a lot of fancy arguments, but those arguments weren't
# used anywhere.  Should we restore them?

_ = require "underscore"

# Some time constants, in milliseconds.
ONE_MILLI = 1.0
ONE_SECOND = 1000.0
ONE_MINUTE = 60.0 * ONE_SECOND
ONE_HOUR = 60 * ONE_MINUTE
ONE_DAY = 24 * ONE_HOUR
ONE_MONTH = 30 * ONE_DAY # An approximation, obviously.
ONE_YEAR = 365 * ONE_DAY

# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

# Returns the index of the minimum element of an array.
argmin = (arr) ->
  ret = _.min(_.range(arr.length), ((i) -> return arr[i]))
  return ret

# ---------------------------------------------------------------------------
# Date/time utility functions
# ---------------------------------------------------------------------------

# Makes a copy of a date object.
copy_date = (date) ->
  return new Date(date.getTime())

# Rounds a date down to the month.
last_month_no_later_than = (date) ->
  date = copy_date(date)
  date.setUTCDate(1)
  date.setUTCHours(0)
  date.setUTCMinutes(0)
  date.setUTCSeconds(0)
  date.setUTCMilliseconds(0)
  return date

# Rounds a date down to the year.
last_year_no_later_than = (date) ->
  date = last_month_no_later_than(date)
  date.setUTCMonth(0)
  return date

module.exports =
  argmin:                   argmin
  copy_date:                copy_date
  last_month_no_later_than: last_month_no_later_than
  last_year_no_later_than:  last_year_no_later_than
  ONE_MILLI:                ONE_MILLI
  ONE_SECOND:               ONE_SECOND
  ONE_MINUTE:               ONE_MINUTE
  ONE_HOUR:                 ONE_HOUR
  ONE_DAY:                  ONE_DAY
  ONE_MONTH:                ONE_MONTH
  ONE_YEAR:                 ONE_YEAR

