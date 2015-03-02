// A full RFC 2822 date parser for use with **Timezone**.
//
// This function will return a date array that you can pass to the **Timezone**
// function as the date argument. This is an example of extending **Timezone**
// by building upon it, through functional composition.
//
// RFC 2822 specifies how to parse an RFC 822 date. This is an implementation of
// that specification.
//
// Beware of date strings that kind of look like RFC 822 dates. The similarity
// in appearance between RFC 822 and the `%c` date format specifier in
// `strftime` has led programmers to use the `%c` format for RFC 822. This is
// incorrect.
//
// The format is subtly different from RFC 822 for US English. RFC 822 has a
// comma after the day of week name, `%c` does not. We do not forgive this,
// because it gets worse.
//
// The differences between `%c` and RFC 822 become far more apparent when you
// change locales, replacing the English day of week and month name
// abbreviations with the abbreviations in set locale.
//
// Localization is a general problem. Developers will create a format string for
// an RFC 822 date using day of week and month names that their [date formatting
// library will then localize](//
// http://rel.me/2008/07/22/date-format-rfc82285010361123asctimeiso8601unicode35tr35-6/).
//
// While `So 01 Mär 1992 00:00:00 UTC` is not uncommon, it is still not an RFC
// 822 date. RFC 822 dates are not localized. They are always English according
// to the RFC. Therefore, our RFC 2822 date parser expects English and does not
// support localization.
//
// If enough examples of accidentally localized RFC 822 dates are encountered in
// the wild, we can change that. Let me know.

/*
var __slice = [].slice
function die () {
  console.log.apply(console, __slice.call(arguments, 0));
  return process.exit(1);
};

function say () { return console.log.apply(console, __slice.call(arguments, 0)) }
*/
!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function") define(definition);
  else this.tz = definition();
} (function () {
  // Our parser is case insensitive for the sake of forgiveness, even though the
  // specification is pretty clear about case.
  var DAY = "sun|mon|tue|wed|thu|fri|sat".split("|")
    , MONTH = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec".split("|")
    // RFC 822 specified single character military time zone abbreviations, but
    // got them wrong, reversed from the actual time zones used by NATO. Thus,
    // RFC 2822 says that they can't be trusted. The only abbreviations that can
    // be trusted are the synonyms for UTC, and the abbreviations for the four
    // time zones of the contiguous United States. These were laid out in RFC
    // 822.
    //
    // See [RFC 1123 5.2.14 Date and Time
    // Specification](http://www.ietf.org/rfc/rfc1123.txt).
    //
    // Otherwise, you cannot know the time zone offset from a date string found
    // in the wild, only in an RFC 822 date and only if is one of the following.
    , ABBREV =
      { Z: "+0000"
      , UT: "+0000"
      , GMT: "+0000"
      , UTC: "+0000"
      , EDT: "-0400"
      , EST: "-0500"
      , CDT: "-0500"
      , CST: "-0600"
      , MDT: "-0600"
      , MST: "-0700"
      , PDT: "-0700"
      , PST: "-0800"
      }
    //
    , strip
    , $
    ;

  // The RFC 822 function is our sole export.
  return rfc822;

  // In the IANA Timezone Database, Arthur David Olson has this to say about
  // translating time zone abbreviations to time zone offsets.

  // > The UNIX Version 7 "timezone" function is not present in this package; it's
  // > impossible to reliably map timezone's arguments (a "minutes west of GMT"
  // > value and a "daylight saving time in effect" flag) to a time zone
  // > abbreviation, and we refuse to guess.

  // So, please, no pull requests with more time zone abbreviation mappings.
  // What might be right for you, may not be right for some.
  //
  // RFC 2822 says that you can interpret military zones if you have out-of-band
  // information confirming whether they are NATO or RFC 822. The second
  // parameter to our parsing function is this optional out-of-band data.
  //
  //     var eq = require("assert").equal
  //       , tz = require("timezone")
  //       , moonwalk = tz("1969-07-21 02:56")
  //       , military = { nato: {}, rfc822: {} }
  //       , index
  //       ;
  //
  //     index = 0;
  //     "ABCDEFGHIKLM".replace(/./g, function (ch) {
  //       var offset = ("0" + (++index) + "00").slice(-4);
  //       military.nato[ch] = "+" + offset;
  //       military.rfc822[ch] = "-" + offset;
  //     });
  //
  //     index = 0;
  //     "NOPQRSTUVWXY".replace(/./g, function (ch) {
  //       var offset = ("0" + (++index) + "00").slice(-4);
  //       military.nato[ch] = "-" + offset;
  //       military.rfc822[ch] = "+" + offset;
  //     });
  //
  //     eq( tz(rfc822("Sun, 20 Jul 1969 10:56:00 E", military.rfc822)), moonwalk );
  //     eq( tz(rfc822("Sun, 20 Jul 1969 10:56:00 R", military.nato)), moonwalk );
  //
  // If you have any additional out-of-band information on time zone
  // abbreviations for your application, provide that information in the map of
  // additional abbreviations.

  //
  function rfc822(date, abbrev) {
    var offset;

    abbrev = abbrev || {};

    // The full RFC 2822 specification includes support for features of legacy
    // RFC 822 dates that I've never see in the wild. Specifically the ability
    // to place comments anywhere in a date.
    //
    // > `Sun, 1 Mar (Spring is coming soon!) 92 00:00:00 GMT`
    //
    // Comments are enclosed in parenthesis. Comments can contain nested
    // comments making it impossible to match them with a regular expression, as
    // any discussion of a regular expression to match an RFC 822 email address
    // will tell you.
    //
    // We strip the comments. Our approach to RFC 822 comments is informed by a
    // long peek at the workings of
    // [Mail::RFC822::Address](http://www.ex-parrot.com/pdw/Mail-RFC822-Address.html).
    do { strip = date } while ((date = strip.replace(/\((?:[^()\\]|\\.)*\)/, " ")) != strip);

    // To parse the named timezones we'll simply match 1 or more consecutive
    // letters, a through z. If those letters form on one of the time zone
    // abbreviations we know about, we use the time zone offset associated with
    // the abbreviation. Otherwise, we use `"-0000"`.

    //
    $ = /^\s*(?:(\w{3}),\s+)?(\d{1,2})\s+(\w{3})\s+(\d{2,4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s*(?:([-+]?\d{4})|([a-z]{1,5}))?\s*$/i.exec(date)
    if (!$) throw new Error("invalid rfc822 date");

    $[3] = MONTH.indexOf($[3].toLowerCase());
    if (!~$[3]) throw new Error("invalid month");

    $[0] = +($[4]);
    $[4] = $[2];
    $[2] = $[0];

    // RFC 2822 specifies how to interpret a 2 digit year or 3 digit year exactly.
    if ($[2] < 50) $[2] += 2000;
    else if ($[2] < 1000) $[2] += 1900;

    date = $.slice(2, 8);

    // If it comes to bite you that someone has specified the wrong day of week
    // for a particular date, you probably cannot trust those dates, but if you
    // must parse them, strip the day of the week from the RFC 822 date string
    // before calling this function to skip this assertion.

    //
    if ($[1]) {
      $[1] = DAY.indexOf($[1].toLowerCase());
      if (!~$[1])
        throw new Error("invalid day of week");
      if (new Date(Date.UTC.apply(Date.UTC, date)).getUTCDay() != $[1])
        throw new Error("incorrect day of week for date");
    }

    date.push(0);

    // If we cannot be certain of a time zone abbreviation, we default to
    // "-0000" which indicates an uncertain UTC, according to RFC 2822. Of
    // course, that bit of knowledge never leaves the function, but we'll just
    // do as RFC 2822 says.

    //
    offset = $[8] || ABBREV[$[9].toUpperCase()] || abbrev[$[9].toUpperCase()] || "-0000"
    if (offset == "GMT") date.push(1);
    else if (offset) date.push(offset < 0 ? -1 : 1, Math.abs(Math.floor(offset / 100)), offset % 100);

    ++date[1];

    return date;
  }
});
