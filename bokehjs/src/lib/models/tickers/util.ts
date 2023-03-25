// TODO Clear out debugging code, etc.
// TODO Organize helper functions.
// TODO The years ticker doesn't always use the roundest numbers; it should
// probably use a special ticker.
// TODO Add tests.
// TODO There used to be a TODO: restore memoization.  So.... do that?
// TODO Instead of a get_ticks() method, there used to be an auto_ticks()
// function that took a lot of fancy arguments, but those arguments weren't
// used anywhere.  Should we restore them?

// Some time constants, in milliseconds.
export const ONE_MILLI = 1.0
export const ONE_SECOND = 1000.0
export const ONE_MINUTE = 60.0 * ONE_SECOND
export const ONE_HOUR = 60 * ONE_MINUTE
export const ONE_DAY = 24 * ONE_HOUR
export const ONE_MONTH = 30 * ONE_DAY // An approximation, obviously.
export const ONE_YEAR = 365 * ONE_DAY

// ---------------------------------------------------------------------------
// Date/time utility functions
// ---------------------------------------------------------------------------

// Makes a copy of a date object.
export function copy_date(date: Date): Date {
  return new Date(date.getTime())
}

// Rounds a date down to the month.
export function last_month_no_later_than(date: Date): Date {
  const new_date = copy_date(date)
  new_date.setUTCDate(1)
  new_date.setUTCHours(0)
  new_date.setUTCMinutes(0)
  new_date.setUTCSeconds(0)
  new_date.setUTCMilliseconds(0)
  return new_date
}

// Rounds a date down to the year.
export function last_year_no_later_than(date: Date): Date {
  const new_date = last_month_no_later_than(date)
  new_date.setUTCMonth(0)
  return new_date
}
