# Options

## separator
Type: `String`
Default: linefeed

Concatenated files will be joined on this string.

## bare
Type: `boolean`

Compile the JavaScript without the top-level function safety wrapper.

## join
Type: `boolean`
Default: `false`

When compiling multiple .coffee files into a single .js file, concatenate first.

## sourceMap
Type: `boolean`
Default: `false`

Compile JavaScript and create a .map file linking it to the CoffeeScript source. When compiling multiple .coffee files to a single .js file, concatenation occurs as though the 'join' option is enabled. The concatenated CoffeeScript is written into the output directory, and becomes the target for source mapping.