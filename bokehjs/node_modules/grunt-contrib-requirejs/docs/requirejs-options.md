# Options

For a full list of possible options, [see the r.js example build file](https://github.com/jrburke/r.js/blob/master/build/example.build.js).

## done(done, build)

The done option is an optional hook to receive the r.js build output. The first argument is the grunt async callback that you are required to call if you provide the done hook. This informs grunt that the task is complete. The second parameter is the build output from r.js.

