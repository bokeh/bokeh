This directory contains some docker-based tools to facilitate the development
of Bokeh. All the commands below should be run from the root of bokeh's
repository.

To build the container for Python 2 or 3:

    $ docker build -t bokeh-dev:py2 -f docker-tools/Dockerfile-py2 .
    $ docker build -t bokeh-dev:py3 -f docker-tools/Dockerfile-py3 .

To install JS dependencies:

    $ docker-tools/npm-install.sh

To run gulp tasks, for example:

    $ docker-tools/gulp.sh "build --build-dir=/bokeh/bokeh/server/static"

To run the tests with various parameters and various versions of Python, for example:

    $ PYTHON=2 docker-tools/pytest.sh
    $ PYTHON=3 docker-tools/pytest.sh "-m 'not (js or examples or integration or quality)'"
    $ PYTHON=3 docker-tools/pytest.sh "--cov=bokeh"

To log into the container:

    $ docker-tools/bash.sh
