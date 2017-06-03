This directory contains some docker-based tools to facilitate the development
of Bokeh. All the commands below should be run from the root of bokeh's
repository.

To build the container:

    $ docker build -t bokeh-dev docker

To install JS dependencies:

    $ docker/npm-install.sh

To run gulp tasks, for example:

    $ docker/gulp.sh "build --build-dir=/bokeh/bokeh/server/static"

To check that all dependencies are correctly installed:

    $ docker/devdeps.sh

To run the tests for python 2 or python 3, for example:

    $ docker/pytest2.sh
    $ docker/pytest3.sh
    $ docker/pytest2.sh "-m 'not (js or examples or integration or quality)'"
    $ docker/pytest3.sh "--cov=bokeh"

To log into the container:

    $ docker/bash.sh
