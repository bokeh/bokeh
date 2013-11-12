# grunt-eco

Compiles [Embedded CoffeeScript templates](https://github.com/sstephenson/eco) (`.eco`) into JavaScript functions.

## Getting Started

This plugin requires Grunt `~0.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-eco --save-dev
```

Once the plugin has been installed, it may be enabled inside your `Gruntfile.js` with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-eco');
```

*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4), but in case you can't please use [v0.3.1](https://github.com/gruntjs/grunt-contrib-stylus/tree/grunt-0.3-stable).*

## eco task

Run this task with the `grunt eco` command.

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Options

#### amd
Type: `Boolean`
Default: `false`

Defines if compiled function will be wrapped in AMD `define` function.

#### basePath
Type: `String`
Default: `empty`

Defines substing which gets removed from JSTpath of output template.

### emptyWarning

Type: `Boolean`
Default: `true`

Defines if task will warn about empty files on console.

#### jstGlobalCheck

Type: `Boolean`
Default: `true`

Defines if compiled function is prepended by code checking/defining presence of `JST` object on `window`.

*please note when `amd` is set to `true` the `jstGlobalCheck` is ignored*.

### Warning

`preserve_dirs` and `base_path` options are not supported anymore! See examples how task's paths are configured now.

### Examples

Two most common ways of compiling all [globbed paths](http://gruntjs.com/configuring-tasks#globbing-patterns) into single file:

```js
eco: {
  app: {
    files: {
      'path/to/templates.js': ['src/templates/**/*.eco']
    }
  }
}
```


```js
eco: {
  app: {
    src: ['src/templates/**/*.eco'],
    dest: 'path/to/templates.js'
  }
}
```
If you need to compile `.eco` templates into individual files in some sort of destination folder, you can [dynamiccally build path object](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically):

```js
eco: {
  app: {
    files: [{
      expand: true,
      src: ['src/templates/**/*.eco'],
      dest: 'path/to/templates',
      ext: '.js'
    }]
  }
}
```

If you ommit `dest` key, templates will be compiled right next to your `.eco` files.

To configure `eco` task simply define `options` object:

```js
eco: {
  app: {
    options: {
      amd: true
    }
    files: {
      'path/to/templates.js': ['src/templates/**/*.eco']
    }
  }
}
```

## Acknowledgment

This grunt plugin is based on and heavily inspired by [grunt-contrib-stylus](https://github.com/gruntjs/grunt-contrib-stylus).

## Contributing

To start, just clone project and then run `npm install` in project root.

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Always lint and test your code by running `grunt` in project's root.

Create new GIT branch (`git checkout -b my_feature`) when sending pull request.

## Release History

* `Jun 16, 2013    v0.1.0` - Refactoring, tests, AMD support
* `Mar 04, 2013    v0.0.2` - Grunt 0.4 compatibility
* `Nov 18, 2012    v0.0.1` - Initial commit


## License
Copyright (c) 2012 Gregor Martynus
Licensed under the MIT license.
