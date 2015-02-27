// A walk-though of **Timezone**, a database friendly, timezone aware replacement
// for the `Date` object that implements timezone conversions, timezone aware
// date math, timezone and locale aware date formatting, for any date, anywhere
// in the world, since the dawn of standardized time.
//
// **Timezone** is a JavaScript library with no dependencies. It runs in the
// browser and in Node.js.
//
// **Timezone** is a micro JavaScript library weighing only 2.7k.It is is
// feature complete. **Timezone*** is unlikely to get any larger as time goes
// by.
//
// This walk-through is written for Node.js. You can run this JavaScript program
// at the command line like so:
//
// ```
// node synopsis.js
// ```
//
// You can find a copy where **Timezone** is installed or [download a
// copy](https://raw.github.com/bigeasy/timezone/master/src/synopsis.js) from
// GitHub.

// ### Functional API

// **Timezone** is a function. When you import **Timezone**, you probably want
// to assign it to a terse variable name. We recommend `tz`.

//
var ok = require("assert")
  , eq = require("assert").equal
  , tz = require("timezone");

// ### POSIX Time
//
// **Timezone** replaces the JavaScript `Date` object with [POSIX
// time](http://en.wikipedia.org/wiki/Unix_time) &mdash; milliseconds since the
// epoch in UTC &mdash; for a cross-platform, internationalized, and durable
// representation of a point in time.
//
// POSIX time is absolute. It always represents a time in UTC. It doesn't spring
// forward or fall back. It's not affected by the decisions of local
// governments or administrators. It is a millisecond in the grand time line.
//
// POSIX time is simple. It is always an integer, making it easy to store in
// databases and data stores, even ones with little or no support for time
// stamps.
//
// Because POSIX time is an integer, it is easy to sort and easy to compare.
// Sorting and searching POSIX time is fast.

// *Timezone returns number representing POSIX time by default.*
var y2k = tz("2000-01-01");

// Unless you provide a format specifier, the return value of a call to the
// **Timezone** function will be POSIX time.

// *The POSIX time number is always an integer, usually quite large.*
eq( y2k, 946684800000 );

// The JavaScript `Date.UTC` function also returns an integer representing POSIX
// time. We will use it check our work in our synopsis.

// *Did **Timezone** give us the correct POSIX time for 2000?*
eq( y2k, Date.UTC(2000, 0, 1) );

// POSIX time is milliseconds since the epoch in UTC. The epoch is New Year's
// 1970. POSIX time for dates before 1970 are negative. POSIX time for dates
// after 1970 are positive.

// *The epoch is January 1st, 1970 UTC.*
eq( tz("1970-01-01"), 0 );

// *Apollo 11 was before the epoch.*
ok( tz("1969-07-21 02:56") < 0 );

// *The first Apollo-Soyuz docking was after the epoch.*
ok( tz("1975-07-17 16:19:09") > 0 );

// POSIX time is durable and portable. Any other language you might use will
// have date facilities that convert POSIX time into that language's date
// representation.
//
// We use POSIX time to represent an unambiguous point in time, free of
// timezone offsets, daylight savings time; all the whimsical manipulations of
// local governments. POSIX time is simply an integer, an efficient data type
// that easily sorts and compares.

// ### Date Strings

// **Timezone** uses [RFC 3999](http://www.ietf.org/rfc/rfc3339.txt) for date
// strings. RFC 3999 is a well-resonsed subset of the meandering ISO 8601
// standard. RFC 3999 is the string date format for use in new Internet
// protocols going forward. It superceeds the RFC 2822 date format you're
// familiar with from HTTP headers.
//
// You've seen us parsing RFC 3999 date strings above. Let's look at a few more
// variations.

// *Parse an RFC 3999 date with a time in seconds.*
eq( tz("2000-01-01T00:00:00"), y2k );

// My goodness, that `T` is silly. It's part of ISO 8601, but RFC 3999 lets us
// replace it with a space so it's easier to read. We're not going to use it
// again.

// *Parse an RFC 3999 date with a time in seconds, using the optional space to
// replace that silly `T`.*
eq( tz("2000-01-01 00:00:00"), y2k );

// *Parse an RFC 3999 date with just the date, no time.*
eq( tz("2000-01-01"), y2k );

// *Parse an RFC 3999 date with the date and a time in minutes.*
eq( tz("2000-01-01 00:00"), y2k );

// *Parse an RFC 3999 date with the date and a time in seconds.*
eq( tz("2000-01-01 00:00:00"), y2k );

// *Parse an RFC 3999 date with a time zone offset.*
eq( tz("1999-12-31 20:00-04:00"), y2k );

// We've gone and extended RFC 3999 for two special cases.

// We've added milliseconds.

// *Parse an RFC 3999 looking date with the date and a time in milliseconds.*
eq( tz("2000-01-01 00:00:00.0"), y2k );

// Back in the day, not recently, there were some localities that specified
// their timzeone offset down to the second. Our timezone database goes back to
// the 19th century, when these exacting rules were in effect, so we allow
// timezone offsets to include seconds.

// *Parse an RFC 3999 date with a time zone offset with seconds.*
eq( tz("1999-12-31 20:00-04:00:00"), y2k );

// We use RFC 3999 date strings for an easy to type, easy to read, unambiguous
// date literal. When we want to type out a date in our code, or store a string
// representation in a message header or log file, we use RFC 3999.

// ### Timezones &mdash; Time O' Clock
//
// When timezones are in play, we're no longer dealing with POSIX time. We're
// dealing with time that has been localized so that it matches the time
// according to the clock on the user's wall.
//
// That's why we call it wall-clock time.
//
// Wall-clock time is determined according to the laws of a government or the
// rules of an administrative body. Wall-clock time is determined by applying
// the timezone offset for the locality, plus any daylight savings offsets
// according to these rules.
//
// We don't venture a guess as to what these offsets might be. No. We use the
// IANA Timezone Database to convert POSIX time to obtain the best guess
// available.
//
// Yes, it's still a guess, because the IANA Database is a product of a lot of
// research; leafing through newspapers and government records for talk of clock
// changes. However, the IANA Database guess will be right for most cases, and
// your guess will be wrong far more often than you'd imagine.

// ### Converting from Wall-Clock Time

// We first need to load a timezone rule set from the IANA timezone database.
// Let's create a `tz` function that knows about most of the US timezones.

// *Load timezones for all of the Americas.*
var us = tz(require("timezone/America"));

// Our new **Timezone** function `us` knows the rules for a lot of timezones.
// Not only timezones in the United States, but also in Canada, Mexico and all
// of South America. It won't include Hawaii, however, that's
// `Pacific/Honolulu`. Still, we have pleany of rules to work with to obtain
// some wall-clock times.
//
// Our `tz` function is left unchanged. It doesn't have any timezone rules
// loaded.

// If we don't specify a zone name, our new `us` function will behave just as
// old `tz` function did.

// *Time of the moon walk in UTC.*
var moonwalk = us("1969-07-21 02:56");

// *Does* `Date.UTC` *agree?*
eq( us("1969-07-21 02:56"), Date.UTC(1969, 6, 21, 2, 56) );

// However, if we name a zone rule set, we will parse the RFC 3999 date as
// wall-clock time, not UTC. Here we use the `"America/Detroit"` timezone rule
// set to parse 10:39 PM wall-clock time the day before the moon walk.

// *One small step for [a] man...*
eq( us("1969-07-20 21:56", "America/Detroit"), moonwalk );

// We can parse 7:39 PM in California.

// *...one giant leap for mankind.*
eq( us("1969-07-20 19:56", "America/Los_Angeles"), moonwalk );

// Amsterdam was an hour ahead of UTC at the time of the moon walk. We can't
// convert Amsterdam, however, because we didn't load its zone rule set.

// *Won't work, didn't load Amsterdam.*
ok( us("1969-07-21 03:56", "Europe/Amsterdam") != moonwalk );

// *Instead of applying Amsterdam's rules, it falls back to UTC.*
eq( us("1969-07-21 02:56", "Europe/Amsterdam"), moonwalk );

// We can load Amsterdam's rules for just this conversion. Here we both include
// the rules for Amsterdam with `require` and select using the timezone string
// `"Europe/Amsterdam"`.

// *Load Amsterdam's rules for just this conversion.*
eq( us("1969-07-21 03:56", require("timezone/Europe/Amsterdam"), "Europe/Amsterdam"), moonwalk );

// ### UNIX Date Formats
//
// When you provide a format string, the **Timezone** function returns a
// formatted date string, instead of POSIX time.
//
// **Timezone** implements same date format pattern langauge as GNU's version of
// the UNIX `date` utility. **Timezone** supports the full compliment of [GNU
// date](http://en.wikipedia.org/wiki/Date_%28Unix%29) format specifiers.
//
// This is the same format language used by the UNIX function `strftime`. You'll
// find a version of `strftime` baked right into C, Ruby, Python, Perl and Lua.
// With **Timezone** you can also find a version of `strftime` in your
// JavaScript program.

// *Format POSIX time using a GNU date format string.*
eq( tz(y2k, "%m/%d/%Y"), "01/01/2000" );

// *You can adjust the padding with padding flags.*
eq( tz(y2k, "%-m/%-d/%Y"), "1/1/2000" );

// *Two digit year? Yeah, that's right! I don't **learn** lessons.*
eq( tz(y2k, "%-m/%-d/%y"), "1/1/00" );

// *Format date and time.*
eq( tz(moonwalk, "%m/%d/%Y %H:%M:%S"), "07/21/1969 02:56:00" );

// *12 hour clock formats.*
eq( tz(moonwalk, "%A, %B %-d, %Y %-I:%M:%S %p"), "Monday, July 21, 1969 2:56:00 AM" );

// **Timezone** supports all of the GNU `date` extensions, including some date
// calculations you won't find in JavaScript's `Date`.

// *Day of the year.*
eq( tz(moonwalk, "%j") , "202" );

// *Day of the week zero-based index starting Sunday.*
eq( tz(moonwalk, "%w"), "1" );

// *Day of the week one-based index starting Monday.*
eq( tz(moonwalk, "%u"), "1" );

// *Week of the year index week starting Monday.*
eq( tz(moonwalk, "%W"), "29" );

// *ISO 8601 [week date](http://en.wikipedia.org/wiki/ISO_8601#Week_dates) format.*
eq( tz(moonwalk, "%G-%V-%wT%T"), "1969-30-1T02:56:00" );

// **Timezone** is timezone aware so it can print the time zone offset or time
// zone abbreviation.

// *Get the time zone abbreviation which is * `UTC` * by default.*
eq( tz(moonwalk, "%Z"), "UTC" );

// *Get the time zone offset RFC 822 style.*
eq( tz(moonwalk, "%z"), "+0000" );

// When you format a date string and name a zone rule set, the zone format
// specifiers show the effect of zone rule set.

// *Get the timezone offset abbreviation for Detroit.*
eq( us(moonwalk, "America/Detroit", "%Z"), "EST" );

// *Timezone offset RFC 822 style.*
eq( us(moonwalk, "America/Detroit", "%z"), "-0500" );

// **Timezone** supports the GNU extensions to the time zone offset format
// specifier `%z`.  If you put colons between the `%` and `z` colons appear in
// the time zone offset.

// *Timezone offset colon separated.*
eq( us(moonwalk, "America/Detroit", "%:z"), "-05:00" );

// Some time zone rules specify the time zone offset down to the second. None of
// the contemporary rules are that precise, but in history of standardized time,
// there where some time zone offset sticklers, like the Dutch Railways.

// *The time at which the end of the First World War came into effect.*
var armistice = tz("1911-11-11 11:00");

// *Timezone offset colon separated, down to the second.*
eq( tz("1969-07-21 03:56", "Europe/Amsterdam", require("timezone/Europe/Amsterdam"), "%::z")
  , "+01:00:00" );

// The **Timezone** function itself offers one extension to `strftime`, inspired
// by the GNU `date` extensions for `%z`, to support formatting RFC 3999 date
// strings. The format specifier `%^z` flexibly formats the time zone offset.

// *Format UTC as* `Z` *instead of* `+00:00` *.*
eq( tz(moonwalk, "%^z"), "Z" );

// *Timezone offset colon separated, down to the minute.*
eq( us(moonwalk, "America/Detroit", "%^z"), "-05:00" );

// *Timezone offset colon separated, down to the second, only if needed.*
eq( tz(armistice, "Europe/Amsterdam", require("timezone/Europe/Amsterdam"), "%^z")
  , "+00:19:32" );

// *RFC 3999 string for* `UTC` *.*
eq( tz(moonwalk, "%F %T%^z"), "1969-07-21 02:56:00Z" );

// *RFC 3999 string not at* `UTC` *.*
eq( us(moonwalk, "America/Detroit", "%F %T%^z"), "1969-07-20 21:56:00-05:00" );

// *Not part of the RFC 3999 standard, but **Timezone** will parse a time zone
// offset specified in seconds.*
eq( tz(armistice, "Europe/Amsterdam", require("timezone/Europe/Amsterdam"), "%T %F%^z")
  , "11:19:32 1911-11-11+00:19:32" );

// #### Padding
//
// **Timezone** implements the GNU padding extensions to `strftime`.

// For zero padding we use `0`, but most formats are already zero padded.

// *Zero padded day of month, but it is already zero padded.*
eq( tz(y2k, "%B %0d %Y"), "January 01 2000" );

// *Same as above.*
eq( tz(y2k, "%B %d %Y"), "January 01 2000" );

// To remove padding, add a hyphen after the percent sign.

// *With padding.*
eq( tz(y2k, "%m/%d/%Y"), "01/01/2000" );

// *Padding stripped.*
eq( tz(y2k, "%-m/%-d/%Y"), "1/1/2000" );

// To pad with spaces put an underscore after the percent sign.

// *Space padded day of month.*
eq( tz(y2k, "%B %_d %Y"), "January  1 2000" );

// *Nanoseconds, silly because we only have millisecond prevision.*
eq( tz(1, "%F %T.%N"), "1970-01-01 00:00:00.001000000" );

// *Milliseconds using a with padding width specifier.*
eq( tz(1, "%F %T.%3N"), "1970-01-01 00:00:00.001" );

// ### Converting to Wall-Clock Time
//
// To convert to from POSIX time to wall-clock time, we format a date string
// specifying the name of a time zone rule set. The **Timezone** function
// formats a date string with the time zone rules applied.

// Before you can use a time zone rule set, to create create a **Timezone**
// function that contains the rule set.

// *Create a **Timezone** function that contains European time zone rules.*
var eu = tz(require("timezone/Europe"));

// Now we can use the `eu` **Timezone** function to convert to the wall-clock
// time of European localities.

// *Convert to wall-clock time in and around Amsterdam.*
// TK Use armistice.
eq( eu(moonwalk, "%F %T", "Europe/Amsterdam")
  , "1969-07-21 03:56:00" );
// *Convert to wall-clock time in and around Instanbul.*
eq( eu(moonwalk, "%F %T", "Europe/Istanbul")
  , "1969-07-21 04:56:00" );

// Note that wall-clock time is represented as a string. We do not represent
// wall-clock time as an integer. Integers are only used to represent POSIX
// time.
//
// This allows the **Timezone** to interpret an integer date value unambiguously
// as POSIX time, seconds since the epoch in UTC.
//
// We use a string to represent wall-clock time because the time zone offset is
// really a display property, because wall-clock time is a display of time.
//
// If feel that you really do need to record wall-clock time, include the
// effective time zone offset in the format. That way you will record wall-clock
// time and the offset necessary to get to POSIX time.
//
// This is the best format for log files, where string are appropriate, and
// wall-clock times are a sometimes nice to have.

// *Notice how we're traveling forward in POSIX time but backward in wall-clock
// time.*
eq( eu(tz("2012-10-28 00:59:59"), "%F %T", "Europe/Amsterdam")
  , "2012-10-28 02:59:59" );
eq( eu(tz("2012-10-28 01:00:00"), "%F %T", "Europe/Amsterdam")
  , "2012-10-28 02:00:00" );

// *With the time zone offset, we can see why the wall-clock time went
// backward.*
eq( eu(tz("2012-10-28 00:59:59"), "%F %T%^z", "Europe/Amsterdam")
  , "2012-10-28 02:59:59+02:00" );
eq( eu(tz("2012-10-28 01:00:00"), "%F %T%^z", "Europe/Amsterdam")
  , "2012-10-28 02:00:00+01:00" );

// TK Move. Recording the time zone offset rule set name is not very meaningful.
// If you need to store location, store a proper address or the latitude and
// longitude of the event.

// ### Converting Between Timezones
//
// To convert wall-clock time from one time zone to another, we first convert
// the wall-clock time of the source time zone to POSIX time. We then convert
// from POSIX time to the wall-clock time of the destination time zone.
//
// To do this, we call the **Timezone** function twice.

//
var posix = us("1969-07-20 21:56", "America/Detroit");
eq( posix, moonwalk );

var wallclock = eu(posix, "%F %T", "Europe/Amsterdam")
eq( wallclock , "1969-07-21 03:56:00" );

// All at once.

//
eq( eu( us("1969-07-20 21:56", "America/Detroit"), "Europe/Amsterdam", "%F %T" )
     , "1969-07-21 03:56:00" );

// Whenever we parse a date, we are parsing that date in the context of a
// timezone. If no timezone is specified, we use the default UTC timezone.

// Thus, specify your starting timezone when you parse. Then specify your target
// timezone when you format.

// *It's noon in Detroit. What time is it in Warsaw?*
eq( eu(us("2012-04-01 12:00", "America/Detroit" ), "Europe/Warsaw", "%H:%M" ), "18:00" );

// Remember that we can only represent wall-clock time using date strings. POSIX
// time is an absolute point in time and has no concept of timezone.

// ### Locales
//
// Timezone supports Locales for formatting dates using the GNU Date format
// specifiers.
//
// You apply a locale the same way you apply a timezone. You create a `tz`
// function by passing a locale definition into the `tz` function.

// *Add a Polish locale.*
us = us(require("timezone/pl_PL"));

// *Time of moonwalk in the default Polish date format.*
eq( us( moonwalk, "pl_PL", "%c", "America/Detroit" )
  , "nie, 20 lip 1969, 21:56:00" );

// *Add a UK, French and German locales.*
var eu = tz( require("timezone/en_GB")
           , require("timezone/fr_FR")
           , require("timezone/de_DE")
           , require("timezone/Europe") );

// *Time of moon walk in three European cities.*
eq( eu( moonwalk, "en_GB", "%c", "Europe/London" )
  , "Mon 21 Jul 1969 03:56:00 BST" );
eq( eu( moonwalk, "fr_FR", "%c", "Europe/Paris" )
  , "lun. 21 juil. 1969 03:56:00 CET" );
eq( eu( moonwalk, "de_DE", "%c", "Europe/Berlin" )
  , "Mo 21 Jul 1969 03:56:00 CET" );

// ### Date Math
//
// When **Timezone** performs date math, **Timezone** does so fully aware of
// timezone rules. **Timezone** accounts for daylight savings time, leap years
// and the occasional changes to timezone offsets.

// With no timezone specified, **Timezone** uses UTC.

// Here are some examples of date math using UTC.

// *Add a millisecond to the epoch.*
eq( tz( 0, "+1 millisecond" ), 1 );

// *Travel back in time to the moon walk.*
eq( tz(y2k, "-30 years", "-5 months", "-10 days", "-21 hours", "-4 minutes", "%c"), tz(moonwalk, "%c") );

// *Jump to the first Saturday after y2k.*
eq( tz(y2k, "+1 saturday", "%A %d"), "Saturday 08" );
// *Jump to the first Saturday after y2k, including y2k.*
eq( tz(y2k, "-1 day", "+1 saturday", "%A %d"), "Saturday 01" );

// When a timezone is specified, **Timezone** with adjust the clock for daylight
// savings time when moving by hour, minute, second or millisecond.

// When moving by day, month, or year with a timezone specified  **Timezone**
// will instead adjust the time so that it lands at the same time of day.
//
// This if for whe the user reschedules a six o'clock dinner appointment, from
// the day before daylight savings to the day after. They didn't adjust the
// appointment by 24 hours, making it a seven o'clock appointment on the first
// day of daylight savings. They still want to have dinner at six o'clock; at
// six according to the clock on the wall.
//
// Moving across daylight savings time by hour, minute, second or millisecond
// will adjust your wall-clock time.

// *Moving across daylight savings time by day lands at the same time.*

// Moving across daylight savings time by day, month or year will put you at the
// same time, you won't spring forward.

// *Moving across daylight savings time by day lands at the same time.*

// If you move across daylight savings by hour, you'll see the adjustment for
// daylight savings time.

// When you land on a time that doesn't exist because of daylight savings time,
// timezone scoot past the missing hour.

eq( us("2010-03-13 02:30", "America/Detroit", "+1 day", "%c"), "Sun 14 Mar 2010 01:30:00 AM EST" )

// ### Date Arrays

// The **Timezone** function will also accept an array of integers as a date
// input. It will treat this value as wall-clock time and convert it according a
// specified time zone rule set.
//
// The date array is useful when working with GUI controls like a series of drop
// downs. It is also a good candidate for the output of a date parsing function.
// The date array is an easy data structure to populate programatically while
// parsing a date string.
//
// The elements `0` through `6` of the date array are year, month, date, hour,
// minute, second and milliseconds. If you leave an element `undefined`, it will
// be interpreted as zero. The date array must at contain at least a year and a
// month, a year alone will interpreted as POSIX time.
//
// Unlike the JavaScript `Date`, the **Timezone** function does not use a
// zero-based month index in an array representation of a date. It uses instead
// the humane month number that you'd find if you formatted the date.

//
var picker = [ 1969, 7, 20, 21, 56 ];

eq( us(picker, "America/Detroit"), moonwalk );

// The date array format also allows you to specify a time zone offset.
//
// If the element at index `7` is `1` or `-1`, that is treated as the time zone
// offset direction, `-1` for a negative time zone offset, `1` for a positive
// time zone offset. If present, then the elements `8` through `10` of the date
// array the time zone offset hours, minutes and seconds.

// *A date array with a time zone offset of `-05:00`.
eq( tz([ 1969, 7, 20, 21, 56, 0, 0, -1, 5 ]), moonwalk );

// ### Creating Partials
//
// If you call `tz` without a date parameter, `tz` will create a new function
// that is a [partial
// application](http://ejohn.org/blog/partial-functions-in-javascript/) of the
// `tz` function. This is how we load timezones and locales.
//
// We can also use this to create custom functions that are specialized with
// `tz` parameters. This can help use reduce noise in our code, if we are
// invoking `tz` with the same set of parameters over and over again.

// *We've been using parital functions to load time zones and locales.*
us = us( require("timezone/pl_PL") );

// *Format a week of days after Y2K.*
eq( us(y2k, "+1 day", "America/Detroit", "pl_PL", "%A"), "sobota" );
eq( us(y2k, "+2 days", "America/Detroit", "pl_PL", "%A"), "niedziela" );

// *Reduce the noise by creating a partial with the timezone.*
detroit = us("America/Detroit");

eq( detroit(y2k, "+3 days", "pl_PL", "%A"), "poniedziałek" );
eq( detroit(y2k, "+4 days", "pl_PL", "%A"), "wtorek" );

// *Let's get rid of more chatter by creating a partial with the locale.*
hamtramck = detroit("pl_PL");

eq( hamtramck(y2k, "+5 days", "%A"), "środa" );
eq( hamtramck(y2k, "+6 days", "%A"), "czwartek" );
eq( hamtramck(y2k, "+7 days", "%A"), "piątek" );

// ### Initialization

// Locales and time zones are defined by rules, locale rules and time zone
// rules. Locales and time zones are specified by a name, either a locale string
// in the form of `en_US`, or a time zone string in the form of
// `America/Detroit`.
//
// In order to apply either a locale or a time zone rule set, you must provide
// the **Timezone** function with both the rule data and the rule name.
//
// Rather than providing both arguments each time, you'll generally want to
// load a number of rule sets into a partial application funcition. We've done
// this a number of times already in our walk-though.

// *Doesn't know anything about `Asia/Tashkent`, defaults to UTC.*
eq( tz(moonwalk, "Asia/Tashkent", "%F %T%^z"), "1969-07-21 02:56:00Z" );

// *Load all of the timezone data for Asia.*
var asia = tz(require("timezone/Asia"));

// *Now `Asia/Tashkent` is available to the our `asia` function.*
eq( asia(moonwalk, "Asia/Tashkent", "%F %T%^z"), "1969-07-21 08:56:00+06:00" );

// If you later need more timezone data, you can add it using your existing
// partial function.

// *Add the Pacific Islands to Asia.*
asia = asia(require("timezone/Pacific"));

// *Now we have Hawaii.*
eq( asia(moonwalk, "Pacific/Honolulu", "%F %T%^z"), "1969-07-20 16:56:00-10:00" );

// Note that you can provide the rule data and the rule name at the same time.

// *Load Asia and select Tashkent in one call.*
eq( tz(moonwalk, require("timezone/Asia"), "Asia/Tashkent", "%F %T%^z"), "1969-07-21 08:56:00+06:00" );

// It is generally preferable to create a partial function that loads the data
// you need, however.

// Locales are loaded in the same fashion.

// *Knows nothing of Polish, defaults to `en_US`.*
eq( tz(moonwalk, "pl_PL", "%A"), "Monday");

// *Create a Polish aware partial function.*
var pl = tz(require("timezone/pl_PL"));
eq( pl(moonwalk, "pl_PL", "%A"), "poniedziałek");

// ### Functional Composition

// **Timezone** implements a set of standards and de facto standards.
// **Timezone** is not extensible. Quite the opposite. **Timezone** is sealed.
//
// **Timezone** focuses on getting wall-clock time right. It supports a robust,
// timezone aware formatting language, and it it parses an Internet standard
// date string. With all the unit tests in place, there is little reason for
// **Timezone** to add new features, so you can count on its size to be small,
// under 3k, for the foreseeable future.
//
// Most importantly, **Timezone** avoids the mistake of treating a date
// formatting and date parsing as two sides of the same coin. Much in the same
// way that generating web pages from a database, like a blog, is not as simple
// as generating a database from web pages, like a search engine.
//
// That's not to say that date parsing is as complicated as a search engine,
// just that it is generally application specific, requires a lot of context,
// and it is not proportionate in complexity to date formatting, date math or time
// zone offset lookup. We might be able to hide a lot of the bulk in data files
// that accompany our library, but we would so
//
// Rather than opening up **Timezone** to extend it, we build on top of it,
// through functional composition. **Timezone** is a function in a functional
// language. It is configurable and easy to pass around.

// #### Ordinal Numbers
//
// You want to print the date as a ordinal number.
//
// Create a function that convert a number to an ordinal number, then write a
// regular expression to match numbers in your format string that you want to
// ordinalize.

//
function ordinal (date) {
  var nth = parseInt(date, 10) % 100;
  if (nth > 3 && nth < 21) return date + "th";
  return date + ([ "st", "nd", "rd" ][(nth % 10) - 1] || "th");
}

ok( tz(y2k, "%B %-d, %Y").replace(/\d+/, ordinal), "January 1st, 2000" );

// #### Plucking Date Fields
//
// The original `Date` object is missing a lot of functionality, but includes a
// lot of getters and setters. I think they're silly and that's why **Timezone**
// is a function and not an object. Because time is not object-oriented.
//
// However, you do find that you need to get properties as integers, just use
// date format and make an easy conversion to integer.

// *Get the year as integer.*
ok( +(tz(y2k, "%Y")) === new Date(y2k).getUTCFullYear() );

// *Careful to strip leading zeros so it doesn't become octal.*
ok( +(tz(y2k, "%-d")) === new Date(y2k).getUTCDate() );

// *January is one.*
ok( +(tz(y2k, "%-m")) === new Date(y2k).getUTCMonth() + 1 );

// *Here's your date of week.*
ok( parseInt(tz(y2k, "%-w")) === new Date(y2k).getUTCDay() );

// Plus there are a few properties you can get that are not available to date.

// *Here's your date of week starting Monday.*
ok( +(tz(moonwalk, "%-V")) === 30 );

// *Day of the year.*
ok( +(tz(moonwalk, "%-j")) === 202 );

// #### Arrays of Date Fields

// What if you want the integer value of a number of different fields?

// *Split a string into words and convert the words to integers.*
function array (date) {
  return date.split(/\s+/).map(function (e) { return parseInt(e, 10) });
}

var date = array(tz(moonwalk, "%Y %m %d %H %M %S"));

eq( date[0], 1969 );
eq( date[1], 7 );
eq( date[2], 21 );
eq( date[3], 2 );
eq( date[4], 56 );

// #### Additional Date Parsers
//
// Create a function that returns our date array format.

// #### Timezones in Date Strings

// GNU `date` has a nice feature where you can specify the timezone of a date
// string using `TZ` like so `'TZ="America/Detroit" 1999-12-01 20:00'`. This
// allows you to store a string with a timezone.

// *Extract a specified timezone from a date string.*
function tzdate (date) {
  var match;
  if (match = /^TZ="(\S+)"\s+(.*)$/.exec(date)) {
    var a = match.slice(1, 3).reverse();
    return a;
  }
  return date;
}

// *Parse a date with a date string. First one wins.*
eq( eu(eu(tzdate('TZ="Europe/Istanbul" 2012-02-29 04:00')), "Europe/Amsterdam", "%F %T"), "2012-02-29 03:00:00" );

// *Parse a date without a date string, defaults to UTC.*
eq( eu(eu("2012-02-29 04:00"), "Europe/Amsterdam", "%F %T"), "2012-02-29 05:00:00" );
