# Foreword

The testing process of bokeh GUI through selenium can be done right now through two available modes:

1. `Standalone` mode - you have to install bokeh and prepare full selenium
   environment locally (then everything is started on your own computer: bokeh server and tests).
   This mode is appropriate for local testing and writing new selenium tests. Currently this
   mode is also used during bokeh upload to binstar-build.
1. `Distributive` mode - most advanced approach, locally you need to install bokeh only
   and all tests are launched in selenium grid (remotely). This allows testing through many kinds of browsers
   as well testing through various versions of them.

# Writing guidelines for adding new selenium tests

1. Try to use non existent names of test cases/suites/files when creating a new test.
   You can easily help self in this task by browsing actual names:

```
$ ./run_selenium_tests.py utils -l
```

1. Always add a short test description in each test case. Mentioned description is displayed in output of above command.

# Requirements

## Commmon steps (for both modes)

1. Perform bokeh installation: http://bokeh.pydata.org/docs/dev_guide.html#python-setup.

1. Configuring channel with testing tools:

```
$ conda config --add channels mutirri
```

Or if you want to use only packages related to selenium, then:

```
$ conda config --add channels mutirri/channel/selenium
```

1. Install some common but mandatory tools, libraries and similar stuff:

```
$ conda install selenium
```

## Additional steps for standalone mode

**Note:**
I assume that on your current system are already installed:

1. Latest Chrome browser.
1. Latest Firefox browser.
1. Latest Opera browser.

If not, please use your package manager and install all of them.
Of course binaries of all of above browsers should be easily find on your `PATH`.

### Installation of required tools

1. Perform below commands:

```
$ conda install selenium-server-standalone
$ conda install phantomjs
```

And now if you are NOT on MacOSX, run:

```
$ conda install selenium-chromedriver
```

otherwise, please run:

```
$ brew install chromedriver
```

## Additional steps for distributive mode

It seems that currently none of additional steps to perform are required.

# Manual launching tests (mostly dedicated for developer usage)

1. To get general help, try (this script is in `bokeh/bokeh/tests/selenium` directory):

```
$ ./run_selenium_tests.py -h
```

The above command will display all default settings of test launching.

1. To get help about each of available subcommands, try:

```
$ ./run-selenium_tests.py utils -h
$ ./run_selenium_tests.py manual -h
$ ./run_selenium_tests.py search -h
$ ./run_selenium_tests.py auto -h
```

## Launching tests in standalone mode (default)

1. To simply run all tests that can be found, please execute:

```
$ ./run_selenium_tests.py search
```

1. To run just a particular test case, please try first:

```
$ ./run_selenium_tests.py utils -l
```

From the printed list of tests choose one test case to run, and type:

```
$ ./run_selenium_tests.py manual -c ChoosenTestCaseName
```

1. To run all test cases belonging to particular test suite, please run:

```
$ ./run_selenium_tests.py manual -s ChoosenTestSuiteName
```

### Launching tests in standalone mode but in headless way:

1. Install `Xvfb` package through your package manager if it is missing.

1. Just perform as root on separate console:

```
$ Xvfb -ac :25
```

2. As your normal user you can perform all of previously mentioned commands but add one flag, e.g.:

```
$ ./run_selenium_tests.py -x search
```

Or:


```
$ ./run_selenium_tests.py -x manual -c ChoosenTestCaseName
```

And so on, and so on.

## Launching tests in distributive mode

It differs from `standalone` mode only with one parameter (`-m distributive`), for example:

```
$ ./run_selenium_tests.py -m distributive search
```

Or:


```
$ ./run_selenium_tests.py -m distributive manual -c ChoosenTestCaseName
```

And so on, and so on.

### Getting info about selenium grid possibilities

1. To see what browsers on what platforms and versions you can use, please run:

```
$ ./run_selenium_tests.py utils -c
```

# Automatic launching tests (when bokeh is submitted through binstar-build to Anaconda Server)

1. Default mechanism for automatic launching all of tests for bokeh is available through already existing
   `runtests.py` script in `bokeh/scripts` directory. This means that all selenium tests will be also automatically
   started if any invocation of just mentioned script will occure.
