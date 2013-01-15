/* grunt common utilities */

module.exports = function(grunt){

  var exec = require('child_process').exec;

  // child_process.exec bridge
  grunt.registerHelper('exec', function(opts, done) {
    var command = opts.cmd + ' ' + opts.args.join(' ');
    exec(command, opts.opts, function(code, stdout, stderr) {
      if(!done){
        return;
      }
      if(code === 0) {
        done(null, stdout, code);
      } else {
        done(code, stdout || stderr, code);
      }
    });
  });

  // trim ANSI color codes
  grunt.registerHelper('trimcolors', function(str) {
    return str.replace(/\u001b\[\d+m/ig,'');
  });


  // growl: Ex. grunt.helper('growl', 'foo', 'bar');
  // http://growl.info/extras.php#growlnotify
  grunt.registerHelper('growl', function(title, msg) {
    grunt.helper('exec', {
      cmd: 'growlnotify',
      args: [
        '-t', "'" + title + "'",
        '-m', "'" + msg + "'"
      ]
    });
  });

  // ok: use this for notify everything are allright.
  grunt.registerTask('ok', 'done!', function(){
    grunt.helper('growl', 'grunt.js', '＼(^o^)／');
  });

};
