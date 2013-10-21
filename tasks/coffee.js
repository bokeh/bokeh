module.exports = function(grunt){

  var log = grunt.log;

  function handleResult(from, dest, err, stdout, code, done) {
    if(err){
      grunt.helper('growl', 'COFFEE COMPILING GOT ERROR', stdout);
      log.writeln(from + ': failed to compile to ' + dest + '.');
      log.writeln(stdout);
      done(false);
    }else{
      log.writeln(from + ': compiled to ' + dest + '.');
      done(true);
    }
  }

  grunt.registerHelper('coffee_dir_to_dir', function(fromdir, dest, bare, done) {
    var args = {
      cmd: 'coffee',
      args: [ '--compile', '--output', dest, fromdir ]
    };
    if( bare) {
        args.args = ['--bare'].concat(args.args);
    }


    grunt.helper('exec', args, function(err, stdout, code){
      handleResult(fromdir, dest, err, stdout, code, done);
    });
  });

  grunt.registerHelper('coffee_multi_to_one', function(srcs, dest, bare, done) {
    srcs = srcs.join(' ');
    var args = {
      cmd: 'coffee',
      args: [ '--join', dest, '--compile', srcs ]
    };
    if( bare) {
        args.args = ['--bare'].concat(args.args);
    }
    grunt.helper('exec', args, function(err, stdout, code){
      handleResult(srcs, dest, err, stdout, code, done);
    });
  });

  grunt.registerMultiTask('coffee', 'compile CoffeeScripts', function() {

    var done = this.async();
    var files = this.data.files;
    var dir = this.data.dir;
    var bare = this.data.bare;
    var dest = this.data.dest;

    // ex: ./coffee -> ./js
    if(dir) {

      // if destination was not defined, compile to same dir
      if(!dest) {
        dest = dir;
      }

      grunt.helper('coffee_dir_to_dir', dir, dest, bare, done);
      return;
    }

    // ex: [ '1.coffee', '2.coffee' ] -> foo.js
    if(files) {
      grunt.helper('coffee_multi_to_one', files, dest, bare, done);
      return;
    }

  });

};
