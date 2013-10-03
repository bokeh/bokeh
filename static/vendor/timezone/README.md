<a href="http://www.flickr.com/photos/wolfgangstaudt/3553572933/" title="Sundial by Wolfgang Staudt, on Flickr"><img src="http://farm4.staticflickr.com/3605/3553572933_5d30ced3e7_b.jpg"
width="850" height="635" alt="Sundial"></a>

# Timezone [![Build Status](https://secure.travis-ci.org/bigeasy/timezone.png?branch=master)](http://travis-ci.org/bigeasy/timezone)

Format time in JavaScript using the IANA time zone database. (Photo: Sundial by
[Wolfgang Staudt](http://www.flickr.com/people/wolfgangstaudt/).)

```javascript
var tz = require('timezone/loaded'),
    equal = require('assert').equal,
    utc;

// Get POSIX time in UTC.
utc = tz('2012-01-01');

// Convert UTC time to local time in a localize language.
equal(tz(utc, '%c', 'fr_FR', 'America/Montreal'),
      'sam. 31 déc. 2011 19:00:00 EST');
```

A full-featured time zone aware date formatter for JavaScript.

 * **Timezone** is a MicroJS library in pure JavaScript with no dependencies
   that provides timezone aware date math and date formatting.
 * **Timezone** uses the IANA Database to determine the correct wall clock time
   anywhere in the world for any time since the dawn of standardized time.
 * **Timezone** formats dates with a full implementation of `strftime` formats,
   including the GNU `date` extensions.
 * **Timezone** represents time in POSIX time and local time using RFC 3999 date
   strings.
 * **Timezone** is a full featured standards based time library in pure
   JavaScript for under 3K minified and gzipped.

## Hacking

```console
$ git clone --quiet https://github.com/bigeasy/timezone.git
$ cd timezone && make && npm install && npm test
```

## License

The [MIT License](https://raw.github.com/bigeasy/timezone/master/LICENSE).
