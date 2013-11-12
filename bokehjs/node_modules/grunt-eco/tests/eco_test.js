var grunt = require('grunt'),
    fs = require('fs');


var readFile = function(file) {
  'use strict';

  var contents = grunt.file.read(file);

  if (process.platform === 'win32') {
    contents = contents.replace(/\r\n/g, '\n');
  }

  return contents;
};

var assertFileEquality = function(test, pathToActual, pathToExpected, message) {
  'use strict';

  var actual = readFile(pathToActual);
  var expected = readFile(pathToExpected);

  test.equal(expected, actual, message);
};


exports.eco = {
  filesTest: function(test) {
    'use strict';

    test.expect(2);

    assertFileEquality(test,
      'tmp/filesTest/all.js',
      'tests/expected/filesTest/all.js',
      'Should compile all templates into one file');

    assertFileEquality(test,
      'tmp/filesTest/flatOnly.js',
      'tests/expected/filesTest/flatOnly.js',
      'Should compile only root templates into one file');

    test.done();
  },

  srcDestTest: function(test) {
    'use strict';

    test.expect(1);

    assertFileEquality(test,
      'tmp/srcDestTest/all.js',
      'tests/expected/srcDestTest/all.js',
      'Should compile all templates into one file');

    test.done();
  },

  expandTest: function(test) {
    'use strict';

    test.expect(3);

    assertFileEquality(test,
      'tmp/expandTest/tests/fixtures/example.js',
      'tests/expected/expandTest/example.js',
      'Should compile example template into individual file');

    assertFileEquality(test,
      'tmp/expandTest/tests/fixtures/advanced-example.js',
      'tests/expected/expandTest/advanced-example.js',
      'Should compile advanced-example template into individual file');

    assertFileEquality(test,
      'tmp/expandTest/tests/fixtures/nested/example.js',
      'tests/expected/expandTest/nested-example.js',
      'Should compile example template nested in subdirectory into individual file following path');

    test.done();
  },

  basePathTest: function(test) {
    'use strict';

    test.expect(1);

    assertFileEquality(test,
      'tmp/basePathTest/all.js',
      'tests/expected/basePathTest/all.js',
      'Should compile all templates into one file');

    test.done();
  },


  amdTest: function(test) {
    'use strict';

    test.expect(3);

    assertFileEquality(test,
      'tmp/amdTest/tests/fixtures/example.js',
      'tests/expected/amdTest/example.js',
      'Should compile example template into individual file');

    assertFileEquality(test,
      'tmp/amdTest/tests/fixtures/advanced-example.js',
      'tests/expected/amdTest/advanced-example.js',
      'Should compile advanced-example template into individual file');

    assertFileEquality(test,
      'tmp/amdTest/tests/fixtures/nested/example.js',
      'tests/expected/amdTest/nested-example.js',
      'Should compile example template nested in subdirectory into individual file following path');

    test.done();
  },

  noJstGlobalCheckTest: function(test) {
    'use strict';

    test.expect(1);

    assertFileEquality(test,
      'tmp/noJstGlobalCheckTest/all.js',
      'tests/expected/noJstGlobalCheckTest/all.js',
      'Should compile example template into individual file');

    test.done();
  }

};
