# Options

## paths
Type: `String|Array`
Default: Directory of input file.

Specifies directories to scan for @import directives when parsing. Default value is the directory of the source, which is probably what you want.

## compress
Type: `Boolean`
Default: False

Compress output by removing some whitespaces.

## yuicompress
Type: `Boolean`
Default: False

Compress output using cssmin.js

## ieCompat
Type: `Boolean`
Default: true

Enforce the css output is compatible with Internet Explorer 8.

For example, the [data-uri](https://github.com/cloudhead/less.js/pull/1086) function encodes a file in base64 encoding and embeds it into the generated CSS files as a data-URI. Because Internet Explorer 8 limits `data-uri`s to 32KB, the [ieCompat](https://github.com/cloudhead/less.js/pull/1190) option prevents `less` from exceeding this.

## optimization
Type: `Integer`
Default: null

Set the parser's optimization level. The lower the number, the less nodes it will create in the tree. This could matter for debugging, or if you want to access the individual nodes in the tree.

## strictImports
Type: `Boolean`
Default: False

Force evaluation of imports.

## syncImport
Type: `Boolean`
Default: False

Read @import'ed files synchronously from disk.

## dumpLineNumbers
Type: `String`
Default: false

Configures -sass-debug-info support.

Accepts following values: `comments`, `mediaquery`, `all`.

## relativeUrls
Type: `boolean`
Default: false

Rewrite urls to be relative. False: do not modify urls.

## report
Choices: `false` `'min'` `'gzip'`
Default: `false`

Either do not report anything, report only minification result, or report minification and gzip results. This is useful to see exactly how well Less is performing, but using `'gzip'` can add 5-10x runtime task execution.

Example ouput using `'gzip'`:

```
Original: 198444 bytes.
Minified: 101615 bytes.
Gzipped:  20084 bytes.
```
