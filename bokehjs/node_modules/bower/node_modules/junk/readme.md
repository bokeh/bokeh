# junk [![Build Status](https://secure.travis-ci.org/sindresorhus/junk.png?branch=master)](http://travis-ci.org/sindresorhus/junk)

Helps you filter out [OS junk files](test.js) like .DS_Store and Thumbs.db



## Getting started

Install: `npm install --save junk`


## Example

```js
var fs = require('fs');
var junk = require('junk');

fs.readdir('path', function (err, files) {
	console.log(files);
	// ['.DS_Store', 'test.jpg']

	console.log(files.filter(junk.isnt));
	// ['test.jpg']
});
```


## Documentation


### junk.is(filename)

Returns true if `filename` matches any of the `junk.rules`.


### junk.isnt(filename)

Returns true if `filename` doesn't match any of the `junk.rules`.


### junk.rules

Returns an array of regexes you can match against.


## License

MIT License • © [Sindre Sorhus](http://sindresorhus.com)
