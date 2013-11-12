Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

When installed by npm, this plugin will automatically download and install [PhantomJS][] locally via the [grunt-lib-phantomjs][] library.

[PhantomJS]: http://www.phantomjs.org/
[grunt-lib-phantomjs]: https://github.com/gruntjs/grunt-lib-phantomjs

Also note that running grunt with the `--debug` flag will output a lot of PhantomJS-specific debugging information. This can be very helpful in seeing what actual URIs are being requested and received by PhantomJS.

## OS Dependencies
This plugin uses PhantomJS to run tests. PhantomJS requires these dependencies

**On Ubuntu/Debian**

`apt-get install libfontconfig1 fontconfig libfontconfig1-dev libfreetype6-dev`
