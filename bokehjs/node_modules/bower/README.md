# BOWER [![Build Status](https://secure.travis-ci.org/bower/bower.png?branch=master)](http://travis-ci.org/bower/bower)

Bower is a package manager for the web. It offers a generic, unopinionated
solution to the problem of **front-end package management**, while exposing the
package dependency model via an API that can be consumed by a more opinionated
build stack. There are no system wide dependencies, no dependencies are shared
between different apps, and the dependency tree is flat.

Bower runs over Git, and is package-agnostic. A packaged component can be made
up of any type of asset, and use any type of transport (e.g., AMD, CommonJS,
etc.).

[View all packages available through Bower's registry](http://sindresorhus.com/bower-components/).


## Installing Bower

Bower depends on [Node](http://nodejs.org/) and [npm](http://npmjs.org/). It's
installed globally using npm:

```
npm install -g bower
```

Also make sure that [git](http://git-scm.com/) is installed as some bower
packages require it to be fetched and installed.


## Usage

Much more information is available via `bower help` once it's installed. This
is just enough to get you started.

#### Warning

On `prezto` or `oh-my-zsh`, do not forget to `alias bower='noglob bower'` or `bower install jquery\#1.9.1`

#### Running commands with sudo

Bower is a user command, there is no need to execute it with superuser permissions.
However, if you still want to run commands with sudo, use `--allow-root` option.

### Installing packages and dependencies

Bower offers several ways to install packages:

```bash
# Using the dependencies listed in the current directory's bower.json
bower install
# Using a local or remote package
bower install <package>
# Using a specific version of a package
bower install <package>#<version>
# Using a different name and a specific version of a package
bower install <name>=<package>#<version>
```

Where `<package>` can be any one of the following:

* A name that maps to a package registered with Bower, e.g, `jquery`. ‡
* A remote Git endpoint, e.g., `git://github.com/someone/some-package.git`. Can be
  public or private. ‡
* A local endpoint, i.e., a folder that's a Git repository. ‡
* A shorthand endpoint, e.g., `someone/some-package` (defaults to GitHub). ‡
* A URL to a file, including `zip` and `tar` files. Its contents will be
  extracted.

‡ These types of `<package>` might have versions available. You can specify a
[semver](http://semver.org/) compatible version to fetch a specific release, and lock the
package to that version. You can also use ranges to specify a range of versions.

All package contents are installed in the `bower_components` directory by default.
You should **never** directly modify the contents of this directory.

Using `bower list` will show all the packages that are installed locally.

**N.B.** If you aren't authoring a package that is intended to be consumed by
others (e.g., you're building a web app), you should always check installed
packages into source control.

### Finding packages

To search for packages registered with Bower:

```
bower search [<name>]
```

Using just `bower search` will list all packages in the registry.

### Using packages

The easiest approach is to use Bower statically, just reference the package's
installed components manually using a `script` tag:

```html
<script src="/bower_components/jquery/index.js"></script>
```

For more complex projects, you'll probably want to concatenate your scripts or
use a module loader. Bower is just a package manager, but there are plenty of
other tools -- such as [Sprockets](https://github.com/sstephenson/sprockets)
and [RequireJS](http://requirejs.org/) -- that will help you do this.

### Registering packages

To register a new package:

* There **must** be a valid manifest JSON in the current working directory.
* Your package should use [semver](http://semver.org/) Git tags.
* Your package **must** be available at a Git endpoint (e.g., GitHub); remember
  to push your Git tags!

Then use the following command:

```
bower register <my-package-name> <git-endpoint>
```

The Bower registry does not have authentication or user management at this point
in time. It's on a first come, first served basis. Think of it like a URL
shortener. Now anyone can run `bower install <my-package-name>`, and get your
library installed.

There is no direct way to unregister a package yet. For now, you can [request a
package be unregistered](https://github.com/bower/bower/issues/120).

### Uninstalling packages

To uninstall a locally installed package:

```
bower uninstall <package-name>
```


## Configuration

Bower can be configured using JSON in a `.bowerrc` file.

The current spec can be read
[here](https://docs.google.com/document/d/1APq7oA9tNao1UYWyOm8dKqlRP2blVkROYLZ2fLIjtWc/edit#heading=h.4pzytc1f9j8k)
in the `Configuration` section.


## Defining a package

You must create a `bower.json` in your project's root, and specify all of its
dependencies. This is similar to Node's `package.json`, or Ruby's `Gemfile`,
and is useful for locking down a project's dependencies.

*NOTE:* In versions of Bower before 0.9.0 the package metadata file was called
`component.json` rather than `bower.json`. This has changed to avoid a name
clash with another tool. You can still use `component.json` for now but it is
deprecated and the automatic fallback is likely to be removed in an upcoming
release.

You can interactively create a `bower.json` with the following command:

```
bower init
```

The `bower.json` defines several options:

* `name` (required): The name of your package.
* `version`: A semantic version number (see [semver](http://semver.org/)).
* `main` [string|array]: The primary endpoints of your package.
* `ignore` [array]: An array of paths not needed in production that you want
  Bower to ignore when installing your package.
* `dependencies` [hash]: Packages your package depends upon in production.
* `devDependencies` [hash]: Development dependencies.
* `private` [boolean]: Set to true if you want to keep the package private and 
  do not want to register the package in future.

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "main": "path/to/main.css",
  "ignore": [
    ".jshintrc",
    "**/*.txt"
  ],
  "dependencies": {
    "<name>": "<version>",
    "<name>": "<folder>",
    "<name>": "<package>"
  },
  "devDependencies": {
    "<test-framework-name>": "<version>"
  }
}
```


## Consuming a package

Bower also makes available a source mapping. This can be used by build tools to
easily consume Bower packages.

If you pass the `--paths` option to Bower's `list` command, you will get a
simple path-to-name mapping:

```json
{
  "backbone": "bower_components/backbone/index.js",
  "jquery": "bower_components/jquery/index.js",
  "underscore": "bower_components/underscore/index.js"
}
```

Alternatively, every command supports the `--json` option that makes bower
output JSON. Command result is outputted to `stdout` and error/logs to
`stderr`.


## Programmatic API

Bower provides a powerful, programmatic API. All commands can be accessed
through the `bower.commands` object.

```js
var bower = require('bower');

bower.commands
.install(paths, options)
.on('end', function (installed) {
    console.log(installed);
});

bower.commands
.search('jquery', {})
.on('end', function (results) {
    console.log(results);
});
```

Commands emit three types of events: `log`, `end`, and `error`.

* `log` is emitted to report the state/progress of the command.
* `error` will only be emitted if something goes wrong.
* `end` is emitted when the command successfully ends.

For a better of idea how this works, you may want to check out [our bin
file](https://github.com/bower/bower/blob/master/bin/bower).


## Completion (experimental)

_NOTE_: Completion is still not implemented for the 1.0.0 release

Bower now has an experimental `completion` command that is based on, and works
similarly to the [npm completion](https://npmjs.org/doc/completion.html). It is
not available for Windows users.

This command will output a Bash / ZSH script to put into your `~/.bashrc`,
`~/.bash_profile`, or `~/.zshrc` file.

```
bower completion >> ~/.bash_profile
```


## A note for Windows users

To use Bower on Windows, you must install
[msysgit](http://code.google.com/p/msysgit/) correctly. Be sure to check the
option shown below:

![msysgit](http://f.cl.ly/items/2V2O3i1p3R2F1r2v0a12/mysgit.png)

Note that if you use TortoiseGit and if Bower keeps asking for your SSH
password, you should add the following environment variable: `GIT_SSH -
C:\Program Files\TortoiseGit\bin\TortoisePlink.exe`. Adjust the `TortoisePlink`
path if needed.


## Contact

Have a question?

* [StackOverflow](http://stackoverflow.com/questions/tagged/bower)
* [Mailinglist](http://groups.google.com/group/twitter-bower) - twitter-bower@googlegroups.com
* [\#bower](http://webchat.freenode.net/?channels=bower) on Freenode


## Contributing to this project

Anyone and everyone is welcome to contribute. Please take a moment to
review the [guidelines for contributing](CONTRIBUTING.md).

* [Bug reports](CONTRIBUTING.md#bugs)
* [Feature requests](CONTRIBUTING.md#features)
* [Pull requests](CONTRIBUTING.md#pull-requests)


## Authors

* [@fat](https://github.com/fat)
* [@maccman](https://github.com/maccman)
* [@satazor](https://github.com/satazor)

Thanks for assistance and contributions:

[@addyosmani](https://github.com/addyosmani),
[@angus-c](https://github.com/angus-c),
[@borismus](https://github.com/borismus),
[@carsonmcdonald](https://github.com/carsonmcdonald),
[@chriseppstein](https://github.com/chriseppstein),
[@danwrong](https://github.com/danwrong),
[@davidmaxwaterman](https://github.com/davidmaxwaterman),
[@desandro](https://github.com/desandro),
[@hemanth](https://github.com/hemanth),
[@isaacs](https://github.com/isaacs),
[@josh](https://github.com/josh),
[@jrburke](https://github.com/jrburke),
[@marcelombc](https://github.com/marcelombc),
[@marcooliveira](https://github.com/marcooliveira),
[@mklabs](https://github.com/mklabs),
[@necolas](https://github.com/necolas),
[@paulirish](https://github.com/paulirish),
[@richo](https://github.com/richo),
[@rvagg](https://github.com/rvagg),
[@sindresorhus](https://github.com/sindresorhus),
[@SlexAxton](https://github.com/SlexAxton),
[@sstephenson](https://github.com/sstephenson),
[@svnlto](https://github.com/svnlto),
[@tomdale](https://github.com/tomdale),
[@uzquiano](https://github.com/uzquiano),
[@visionmedia](https://github.com/visionmedia),
[@wagenet](https://github.com/wagenet),
[@wibblymat](https://github.com/wibblymat),
[@wycats](https://github.com/wycats)


## License

Copyright 2012 Twitter, Inc.

Licensed under the MIT License
