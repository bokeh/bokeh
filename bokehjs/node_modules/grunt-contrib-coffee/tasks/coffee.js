/*
 * grunt-contrib-coffee
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 Eric Woroshow, contributors
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  'use strict';

  var path = require('path');
  var _ = grunt.util._;

  grunt.registerMultiTask('coffee', 'Compile CoffeeScript files into JavaScript', function() {

    var options = this.options({
      bare: false,
      join: false,
      sourceMap: false,
      separator: grunt.util.linefeed
    });

    grunt.verbose.writeflags(options, 'Options');

    this.files.forEach(function (f) {
      var validFiles = removeInvalidFiles(f);

      if (options.sourceMap === true) {
        var paths = createOutputPaths(f.dest);
        writeFileAndMap(paths, compileWithMaps(validFiles, options, paths));
      } else if (options.join === true) {
        writeFile(f.dest, concatInput(validFiles, options));
      } else {
        writeFile(f.dest, concatOutput(validFiles, options));
      }
    });
  });

  var isLiterate = function (ext) {
    return (ext === ".litcoffee" || ext === ".md");
  };

  var removeInvalidFiles = function(files) {
    return files.src.filter(function(filepath) {
      if (!grunt.file.exists(filepath)) {
        grunt.log.warn('Source file "' + filepath + '" not found.');
        return false;
      } else {
        return true;
      }
    });
  };

  var createOutputPaths = function (destination) {
    var fileName = path.basename(destination, path.extname(destination));
    return {
      dest: destination,
      destName: fileName,
      destDir: appendTrailingSlash(path.dirname(destination)),
      mapFileName: fileName + '.js.map'
    };
  };

  var appendTrailingSlash = function (path) {
    if (path.length > 0) {
      return path + '/';
    } else {
      return path;
    }
  };

  var compileWithMaps = function (files, options, paths) {
    if (!hasUniformExtensions(files)) {
      return;
    }

    var mapOptions, filepath;

    if (files.length > 1) {
      mapOptions = createOptionsForJoin(files, paths, options.separator);
    } else {
      mapOptions = createOptionsForFile(files[0], paths);
      filepath = files[0];
    }

    options = _.extend({
        generatedFile: path.basename(paths.dest),
        sourceRoot: mapOptions.sourceRoot,
        sourceFiles: mapOptions.sourceFiles
      }, options);

    var output = compileCoffee(mapOptions.code, options, filepath);
    appendFooter(output, paths);
    return output;
  };

  var hasUniformExtensions = function(files) {
    // get all extensions for input files
    var ext = files.map(function (f) {
      return path.extname(f);
    });

    if(_.uniq(ext).length > 1) {
      grunt.fail.warn('Join and sourceMap options require input files share the same extension (found '+_.uniq(ext).join(', ')+').');
      return false;
    } else {
      return true;
    }
  };

  var createOptionsForJoin = function (files, paths, separator) {
    var code = concatFiles(files, separator);
    var targetFileName = paths.destName + '.src.coffee';
    grunt.file.write(paths.destDir + targetFileName, code);

    return {
      code: code,
      sourceFiles: [targetFileName],
      sourceRoot: ''
    };
  };

  var concatFiles = function (files, separator) {
    return files.map(function (filePath) {
      return grunt.file.read(filePath);
    }).join(grunt.util.normalizelf(separator));
  };

  var createOptionsForFile = function (file, paths) {
    return {
      code: grunt.file.read(file),
      sourceFiles: [path.basename(file)],
      sourceRoot: appendTrailingSlash(path.relative(paths.destDir, path.dirname(file)))
    };
  };

  var appendFooter = function (output, paths) {
    // Add sourceMappingURL to file footer
    output.js = output.js + '\n/*\n//@ sourceMappingURL=' + paths.mapFileName + '\n*/';
  };

  var concatInput = function (files, options) {
    if (!hasUniformExtensions(files)) {
      return;
    }

    var code = concatFiles(files, options.separator);
    return compileCoffee(code, options);
  };

  var concatOutput = function(files, options) {
    return files.map(function(filepath) {
      var code = grunt.file.read(filepath);
      return compileCoffee(code, options, filepath);
    }).join(grunt.util.normalizelf(options.separator));
  };

  var compileCoffee = function(code, options, filepath) {
    options = _.clone(options);
    if(filepath) {
      options.filename = filepath;
      options.literate = isLiterate(path.extname(filepath));
    }

    try {
      return require('coffee-script').compile(code, options);
    } catch (e) {
      if (e.location == null ||
          e.location.first_column == null ||
          e.location.first_line == null) {
        grunt.log.error('Got an unexpected exception ' +
                        'from the coffee-script compiler. ' + 
                        'The original exception was: ' +
                        e);
        grunt.log.error('(The coffee-script compiler should not raise *unexpected* exceptions. ' +
                        'You can file this error as an issue of the coffee-script compiler: ' +
                        'https://github.com/jashkenas/coffee-script/issues)');
      } else {
        var firstColumn = e.location.first_column;
        var firstLine = e.location.first_line;
        var codeLine = code.split('\n')[firstLine];
        var errorArrows = '\x1B[31m>>\x1B[39m ';
        var offendingCharacter;
  
        if (firstColumn < codeLine.length) {
          offendingCharacter = '\x1B[31m' + codeLine[firstColumn] + '\x1B[39m';
        } else {
          offendingCharacter = '';
        }
  
        grunt.log.error(e);
        grunt.log.error('In file: ' + filepath);
        grunt.log.error('On line: ' + firstLine);
        // Log erroneous line and highlight offending character
        // grunt.log.error trims whitespace so we have to use grunt.log.writeln
        grunt.log.writeln(errorArrows + codeLine.substring(0, firstColumn) +
                          offendingCharacter + codeLine.substring(firstColumn + 1));
        grunt.log.writeln(errorArrows + grunt.util.repeat(firstColumn, ' ') +
                          '\x1B[31m^\x1B[39m ');
      }
      grunt.fail.warn('CoffeeScript failed to compile.');
    }
  };

  var writeFileAndMap = function(paths, output) {
    if (!output || output.js.length === 0) {
      warnOnEmptyFile(paths.dest);
      return;
    }

    writeFile(paths.dest, output.js);
    writeFile(paths.destDir + paths.mapFileName, output.v3SourceMap);
  };

  var warnOnEmptyFile = function (path) {
    grunt.log.warn('Destination (' + path + ') not written because compiled files were empty.');
  };

  var writeFile = function (path, output) {
    if (output.length < 1) {
      warnOnEmptyFile(path);
    } else {
      grunt.file.write(path, output);
      grunt.log.writeln('File ' + path + ' created.');
    }
  };
};
