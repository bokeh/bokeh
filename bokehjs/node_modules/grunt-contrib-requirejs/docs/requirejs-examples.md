# Usage Examples

```js
requirejs: {
  compile: {
    options: {
      baseUrl: "path/to/base",
      mainConfigFile: "path/to/config.js",
      out: "path/to/optimized.js"
    }
  }
}
```

## Done

```js
requirejs: {
  compile: {
    options: {
      baseUrl: "path/to/base",
      mainConfigFile: "path/to/config.js",
      done: function(done, output) {
        var duplicates = require('rjs-build-analysis').duplicates(output);
        
        if (duplicates.length > 0) {
          grunt.log.subhead('Duplicates found in requirejs build:')
          grunt.log.warn(duplicates);
          done(new Error('r.js built duplicate modules, please check the excludes option.');
        }
        
        done();
      }
    }
  }
}
```
