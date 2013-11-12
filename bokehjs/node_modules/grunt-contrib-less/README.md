# grunt-contrib-less [![Build Status](https://travis-ci.org/gruntjs/grunt-contrib-less.png?branch=master)](https://travis-ci.org/gruntjs/grunt-contrib-less)

> Compile LESS files to CSS.



## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-contrib-less --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-contrib-less');
```

*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4), but in case you can't please use [v0.3.2](https://github.com/gruntjs/grunt-contrib-less/tree/grunt-0.3-stable).*


## Less task
_Run this task with the `grunt less` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.
### Options

#### paths
Type: `String|Array`
Default: Directory of input file.

Specifies directories to scan for @import directives when parsing. Default value is the directory of the source, which is probably what you want.

#### compress
Type: `Boolean`
Default: False

Compress output by removing some whitespaces.

#### yuicompress
Type: `Boolean`
Default: False

Compress output using cssmin.js

#### ieCompat
Type: `Boolean`
Default: true

Enforce the css output is compatible with Internet Explorer 8.

For example, the [data-uri](https://github.com/cloudhead/less.js/pull/1086) function encodes a file in base64 encoding and embeds it into the generated CSS files as a data-URI. Because Internet Explorer 8 limits `data-uri`s to 32KB, the [ieCompat](https://github.com/cloudhead/less.js/pull/1190) option prevents `less` from exceeding this.

#### optimization
Type: `Integer`
Default: null

Set the parser's optimization level. The lower the number, the less nodes it will create in the tree. This could matter for debugging, or if you want to access the individual nodes in the tree.

#### strictImports
Type: `Boolean`
Default: False

Force evaluation of imports.

#### syncImport
Type: `Boolean`
Default: False

Read @import'ed files synchronously from disk.

#### dumpLineNumbers
Type: `String`
Default: false

Configures -sass-debug-info support.

Accepts following values: `comments`, `mediaquery`, `all`.

#### relativeUrls
Type: `boolean`
Default: false

Rewrite urls to be relative. False: do not modify urls.

#### report
Choices: `false` `'min'` `'gzip'`
Default: `false`

Either do not report anything, report only minification result, or report minification and gzip results. This is useful to see exactly how well Less is performing, but using `'gzip'` can add 5-10x runtime task execution.

Example ouput using `'gzip'`:

```
Original: 198444 bytes.
Minified: 101615 bytes.
Gzipped:  20084 bytes.
```

### Usage Examples

```js
less: {
  development: {
    options: {
      paths: ["assets/css"]
    },
    files: {
      "path/to/result.css": "path/to/source.less"
    }
  },
  production: {
    options: {
      paths: ["assets/css"],
      yuicompress: true
    },
    files: {
      "path/to/result.css": "path/to/source.less"
    }
  }
}
```

## Release History

 * 2013-08-08   v0.6.5   Support strictMath option Support rootpath parse option
 * 2013-07-09   v0.6.4   Support relativeUrls option
 * 2013-07-06   v0.6.3   Add report option for minification and gzip results
 * 2013-07-03   v0.6.2   support syncImport
 * 2013-06-12   v0.6.1   Support ieCompat
 * 2013-06-09   v0.6.0   Bump less to 1.4.0
 * 2013-05-23   v0.5.2   Improve error handling.
 * 2013-04-25   v0.5.1   Gracefully handle configuration without sources.
 * 2013-02-15   v0.5.0   First official release for Grunt 0.4.0.
 * 2013-01-23   v0.5.0rc7   Updating grunt/gruntplugin dependencies to rc7. Changing in-development grunt/gruntplugin dependency versions from tilde version ranges to specific versions. Remove experimental wildcard destination support. Switching to this.files api.
 * 2012-10-18   v0.3.2   Add support for dumpLineNumbers.
 * 2012-10-12   v0.3.1   Rename grunt-contrib-lib dep to grunt-lib-contrib.
 * 2012-09-24   v0.3.0   Global options depreciated Revert normalize linefeeds.
 * 2012-09-16   v0.2.2   Support all less options Normalize linefeeds Default path to dirname of src file.
 * 2012-09-10   v0.2.0   Refactored from grunt-contrib into individual repo.

---

Task submitted by [Tyler Kellen](http://goingslowly.com/)

*This file was generated on Thu Aug 08 2013 09:12:41.*
