# Bokeh docker images
This directory contains docker images for specific versions of Bokeh. These
containers are currently experimental, and old versions of bokeh are only
supported on a best-effort basis. Feel free to submit a pull requested
for new versions! For more info on Docker, look [here](https://docs.docker.com/)

To build a docker image, choose to build from source using `Dockerfile-from-source`
or install from conda using `Dockerfile-from-conda`.

## From conda:
Choose a bokeh version to install from the available versions on anaconda.
Run `conda search bokeh` for the available versions. Then, build the image using (for example):
``` shell
docker build --file Dockerfile-from-conda --build-arg BOKEH_VERSION=0.13.0 --tag bokeh:0.13.0 .
```

For older versions the tornado version might need to be pinned. If so, specify `TORNADO_VERSION`
``` shell
sudo docker build --file Dockerfile-from-conda --build-arg BOKEH_VERSION=0.12.7 --build-arg TORNADO_VERSION=4.5 --tag bokeh:0.12.7 .
```

## From source
The `Dockerfile-from-source` pulls bokeh from github and builds bokeh and bokehjs.
Note that this will probably fail for old versions! The `BOKEH_VERSION` build arg
is interpreted as the commit to fetch. To build:
``` shell
docker build --file Dockerfile-from-source --build-arg BOKEH_VERSION=master --tag bokeh:latest .
```

## Testing
Each docker container should print out the installed bokeh and tornado version at build time.
It also contains a minimal test file. To run this test:
``` shell
docker run -p 5006:5006 -it bokeh bokeh serve hello_world.py
docker run -p 5006:5006 -it bokeh bokeh serve /bokeh_examples/hello_nodejs.py
```
