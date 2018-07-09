# Bokeh docker images
This directory contains docker images for specific versions of Bokeh. These
containers are currently experimental, and old versions of bokeh are only
supported on a best-effort basis. Feel free to submit a pull requested
for new versions! For more info on Docker, look [here](https://docs.docker.com/)

To build a docker image, choose to build from source using `Dockerfile-from-source`
or install from conda using `Dockerfile-from-conda`. All the commands below should
be run from the root of bokeh's repository.

## From conda:
Choose a bokeh version to install from the available versions on anaconda.
Run `conda search bokeh` for the available versions. Then, build the image using (for example):
``` shell
docker build --file docker-tools/Dockerfile-from-conda --build-arg BOKEH_VERSION=0.13.0 --tag bokeh:0.13.0 docker-tools
```

For older versions the tornado version might need to be pinned. If so, specify `TORNADO_VERSION`
``` shell
sudo docker build --file docker-tools/Dockerfile-from-conda --build-arg BOKEH_VERSION=0.12.7 --build-arg TORNADO_VERSION=4.5 --tag bokeh:0.12.7 docker-tools
```

## From source
The `Dockerfile-from-source` pulls bokeh from github and builds bokeh and bokehjs.
Note that this will probably fail for old versions! The `BOKEH_VERSION` build arg
is interpreted as the commit to fetch. To build:
``` shell
docker build --file docker-tools/Dockerfile-from-source --build-arg BOKEH_VERSION=master --tag bokeh:latest docker-tools
```

## From local/travis

To build the container for Python 2 or 3:

``` shell
docker build -t bokeh:dev-py2 --build-arg PYTHON=2.7 -f docker-tools/Dockerfile-from-travis .
docker build -t bokeh:dev-py3 --build-arg PYTHON=3.6 -f docker-tools/Dockerfile-from-travis .
```

To install JS dependencies:

``` shell
docker-tools/npm-install.sh
```

To run build tasks, for example:

``` shell
docker-tools/make.sh "build --build-dir=/bokeh/bokeh/server/static"
```

To run the tests with various parameters and various versions of Python, for example:

``` shell
PYTHON=2 docker-tools/pytest.sh
PYTHON=3 docker-tools/pytest.sh "-m 'not (js or examples or integration or quality)'"
PYTHON=3 docker-tools/pytest.sh "--cov=bokeh"
```

To log into the container:

``` shell
docker-tools/bash.sh
```

## Testing
The conda and source containers should print out the installed bokeh and tornado version at build time.
The conda container also contains a minimal test file. To run this test:
``` shell
docker run -p 5006:5006 -it bokeh bokeh serve /bokeh_examples/hello_world.py
docker run -p 5006:5006 -it bokeh bokeh serve /bokeh_examples/hello_nodejs.py
