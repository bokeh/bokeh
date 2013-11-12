var grunt = require('grunt');
var fs = require('fs');

function readFile(file) {
  'use strict';

  var contents = grunt.file.read(file);

  if (process.platform === 'win32') {
    contents = contents.replace(/\r\n/g, '\n');
  }

  return contents;
}

function assertFileEquality(test, pathToActual, pathToExpected, message) {
    var actual = readFile(pathToActual);
    var expected = readFile(pathToExpected);
    test.equal(expected, actual, message);
}

exports.coffee = {
  compileBare: function(test) {
    'use strict';

    test.expect(4);

    assertFileEquality(test,
      'tmp/bare/coffee.js',
      'test/expected/bare/coffee.js',
      'Should compile coffeescript to unwrapped javascript');

    assertFileEquality(test,
      'tmp/bare/litcoffee.js',
      'test/expected/bare/litcoffee.js',
      'Should compile literate coffeescript to unwrapped javascript');

    assertFileEquality(test,
      'tmp/bare/litcoffeemd.js',
      'test/expected/bare/litcoffee.js',
      'Should compile literate coffeescript to unwrapped javascript');

    assertFileEquality(test,
      'tmp/bare/concat.js',
      'test/expected/bare/concat.js',
      'Should compile coffeescript files without wrappers and concatenate them into a single javascript file');

    test.done();
  },
  compileDefault: function(test) {
    'use strict';

    test.expect(4);

    assertFileEquality(test,
      'tmp/default/coffee.js',
      'test/expected/default/coffee.js',
      'Should compile coffeescript to javascript');

    assertFileEquality(test,
      'tmp/default/litcoffee.js',
      'test/expected/default/litcoffee.js',
      'Should compile literate coffeescript to wrapped javascript');

    assertFileEquality(test,
      'tmp/default/litcoffeemd.js',
      'test/expected/default/litcoffee.js',
      'Should compile literate coffeescript to wrapped javascript');

    assertFileEquality(test,
      'tmp/default/concat.js',
      'test/expected/default/concat.js',
      'Should compile coffeescript files with wrappers and concatenate them into a single javascript file');

    test.done();
  },
  compileJoined: function(test) {
    'use strict';

    test.expect(4);

    assertFileEquality(test,
      'tmp/join/coffee.js',
      'test/expected/default/coffee.js',
      'Compilation of one file with join enabled should match normal compilation');

    assertFileEquality(test,
      'tmp/join/join.js',
      'test/expected/join/join.js',
      'Should concatenate coffeescript files prior to compilation into a single javascript file');

    assertFileEquality(test,
      'tmp/join/bareCoffee.js',
      'test/expected/bare/coffee.js',
      'Bare compilation of one file with join enabled should match bare compilation');

    assertFileEquality(test,
      'tmp/join/bareJoin.js',
      'test/expected/join/bareJoin.js',
      'Bare compilation of multiple join files should be equivalent to concatenated compilation');

    test.done();
  },
  compileMaps: function(test) {
    'use strict';

    test.expect(10);

    assertFileEquality(test,
      'tmp/maps/coffee.js',
      'test/expected/maps/coffee.js',
      'Compilation of single file with source maps should generate javascript');

    assertFileEquality(test,
      'tmp/maps/coffee.js.map',
      'test/expected/maps/coffee.js.map',
      'Compilation of single file with source maps should generate map');

    assertFileEquality(test,
      'tmp/maps/coffeeJoin.js',
      'test/expected/maps/coffeeJoin.js',
      'Compilation of multiple files with source maps should generate javascript');

    assertFileEquality(test,
      'tmp/maps/coffeeJoin.js.map',
      'test/expected/maps/coffeeJoin.js.map',
      'Compilation of multiple files with source maps should generate map');

    assertFileEquality(test,
      'tmp/maps/coffeeJoin.src.coffee',
      'test/expected/maps/coffeeJoin.src.coffee',
      'Compilation of multiple files with source maps should output concatenated source');

    assertFileEquality(test,
      'tmp/maps/coffeeBare.js',
      'test/expected/maps/coffeeBare.js',
      'Bare compilation of single file with source maps should generate javascript');

    assertFileEquality(test,
      'tmp/maps/coffeeBare.js.map',
      'test/expected/maps/coffeeBare.js.map',
      'Bare compilation of single file with source maps should generate map');

    assertFileEquality(test,
      'tmp/maps/coffeeBareJoin.js',
      'test/expected/maps/coffeeBareJoin.js',
      'Bare compilation of multiple files with source maps should generate javascript');

    assertFileEquality(test,
      'tmp/maps/coffeeBareJoin.js.map',
      'test/expected/maps/coffeeBareJoin.js.map',
      'Bare compilation of multiple files with source maps should generate map');

    assertFileEquality(test,
      'tmp/maps/coffeeBareJoin.src.coffee',
      'test/expected/maps/coffeeBareJoin.src.coffee',
      'Bare compilation of multiple files with source maps should output concatenated source');

    test.done();
  },
  compileEachMap: function(test) {
    'use strict';

    test.expect(4);

    assertFileEquality(test,
      'tmp/eachMap/coffee1.js',
      'test/expected/eachMap/coffee1.js',
      'Separate compilation of coffee and litcoffee files with source maps should generate javascript');

    assertFileEquality(test,
      'tmp/eachMap/litcoffee.js',
      'test/expected/eachMap/litcoffee.js',
      'Separate compilation of coffee and litcoffee files with source maps should generate javascript');

    assertFileEquality(test,
      'tmp/eachMap/coffee1.js.map',
      'test/expected/eachMap/coffee1.js.map',
      'Separate compilation of coffee and litcoffee files with source maps should generate map');

    assertFileEquality(test,
      'tmp/eachMap/litcoffee.js.map',
      'test/expected/eachMap/litcoffee.js.map',
      'Separate compilation of coffee and litcoffee files with source maps should generate map');

    test.done();
  }
};
