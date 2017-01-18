# TODO Clear out debugging code, etc.
# TODO Organize helper functions.
# TODO The years ticker doesn't always use the roundest numbers; it should
# probably use a special ticker.
# TODO Add tests.
# TODO There used to be a TODO: restore memoization.  So.... do that?
# TODO Instead of a get_ticks() method, there used to be an auto_ticks()
# function that took a lot of fancy arguments, but those arguments weren't
# used anywhere.  Should we restore them?

# Some time constants, in milliseconds.
export ONE_MILLI = 1.0
export ONE_SECOND = 1000.0
export ONE_MINUTE = 60.0 * ONE_SECOND
export ONE_HOUR = 60 * ONE_MINUTE
export ONE_DAY = 24 * ONE_HOUR
export ONE_MONTH = 30 * ONE_DAY # An approximation, obviously.
export ONE_YEAR = 365 * ONE_DAY

# ---------------------------------------------------------------------------
# Date/time utility functions
# ---------------------------------------------------------------------------

# Makes a copy of a date object.
export copy_date = (date) ->
  return new Date(date.getTime())

# Rounds a date down to the month.
export last_month_no_later_than = (date) ->
  date = copy_date(date)
  date.setUTCDate(1)
  date.setUTCHours(0)
  date.setUTCMinutes(0)
  date.setUTCSeconds(0)
  date.setUTCMilliseconds(0)
  return date

# Rounds a date down to the year.
export last_year_no_later_than = (date) ->
  date = last_month_no_later_than(date)
  date.setUTCMonth(0)
  return date
