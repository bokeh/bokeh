# Bokeh docker images
This directory contains different versions of Docker images for use with Bokeh. There are many ways to deploy Bokeh on Docker, each serving a different use-case and also dependent on personal preference. The containers provided here are experimental and supported on a best-effort basis. Feel free to submit a pull requested for new versions! Good starting points are:

* [Docker documentation](https://docs.docker.com/)
* [Itamar Turner-Trauring's article on choosing the best Docker base image at pythonspeed.com](https://pythonspeed.com/articles/base-image-python-docker-images/)


## Alpine vs Debian (and other Linux distributions)
As explained by [Itamar](https://pythonspeed.com/articles/base-image-python-docker-images/) the major difference between Alpine and Debian (or any other Linux distribution), is that __Alpine uses a different C library, musl, instead of the more common glibc__. As a result, binary wheels won’t work on Alpine Linux, so many packages that 'just work' on other Linux distributions will need to be compiled from scratch. This means longer build times the first time you install a package.

Furthermore, while in theory musl and glibc are [mostly compatible](https://wiki.musl-libc.org/functional-differences-from-glibc.html), in practice the differences can cause problems. Particularly, when you are using Bokeh in combination with Numpy, Pandas and/or SciPy, you will need to do extra work to compile the C binaries from these libraries from yourself when using Alpine. This is do-able, with benefits on the users side (small image footprint) and the downsides mostly on the developers side (having to compile python packages from scratch).

These differences are shown in the table below, which compares the uncompressed image footprint for Alpine vs Debian slim, using pip vs. conda.

|  | Alpine | Debian slim |
|:---|:---|:---|
|pip | [jfloff/alpine-python:3.7-slim](https://hub.docker.com/r/jfloff/alpine-python): 82 MB | [python:3.7-slim](https://github.com/docker-library/python/blob/d2a2b4f7422aac78c7d5ea6aadc49d009d184a5f/3.7/buster/slim/Dockerfile) 143 MB |
|conda |[continuumio/miniconda3:alpine from GitHub](https://github.com/ContinuumIO/docker-images/blob/master/miniconda3/alpine/Dockerfile) 163 MB | [continuumio/miniconda3:debian-slim from GitHub](https://github.com/ContinuumIO/docker-images/blob/master/miniconda3/debian/Dockerfile) 245 MB |

While there is a difference, given that a modest Bokeh app (like demo.bokeh.org) quickly adds up to an image size of around 1 GB (uncompressed), the difference for production systems is around 10-15%. Besides the difference in image footprint between Alpine and Debian, the conda-based images are also larger as they include more libraries. Note that these conda images from ContinuumIO are already [optimised as described by Jim Crist](https://jcrist.github.io/conda-docker-tips.html).

## Building images
To build a docker image, choose to build with Alpine or Debian. All the commands below should be run from the root of bokeh's repository. Note the Alpine images build on [frolvlad's Alpine images](https://hub.docker.com/u/frolvlad), as [continuumio/miniconda3:alpine](https://github.com/ContinuumIO/docker-images/blob/master/miniconda3/alpine/Dockerfile) are not published on Docker Hub yet.

### using Alpine from source
The `docker-tools/alpine/Dockerfile-from-source` pulls bokeh from github and builds bokeh and bokehjs. Note that this will probably fail for old versions! The `BOKEH_VERSION` build arg is interpreted as the commit to fetch. To build:
``` shell
docker build --file docker-tools/alpine/Dockerfile-from-source --build-arg BOKEH_VERSION=master --tag bokeh:latest .
```

You can test this image by running one of the examples:
```shell
docker run -p 5006:5006 -it bokeh:latest bokeh serve /bokeh_examples/app/sliders.py
```

Note that some examples require additional Python modules and hence will result in an error.

### using Alpine with conda
Choose a bokeh version to install from the available versions on anaconda.
Run `conda search bokeh` for the available versions. Then, build the image using, for example, version 1.4.0:
``` shell
docker build -t bokeh:dev-py3 --build-arg PYTHON=3.7 -f docker-tools/Dockerfile-from-travis .
```

Also here, you can test the image by `docker run -it`
```
docker run -p 5006:5006 -it bokeh:1.4.0 bokeh serve /bokeh_examples/app/sliders.py
```

For older versions the tornado version might need to be pinned. If so, specify `TORNADO_VERSION`
``` shell
sudo docker build --file docker-tools/debian/Dockerfile-from-conda --build-arg BOKEH_VERSION=0.12.7 --build-arg TORNADO_VERSION=4.5 --tag bokeh:0.12.7 docker-tools/alpine
```

### using debian-slim with conda
In this example we use `docker-tools/debian/environment.yml` to specify the conda environment for the Docker container.
```shell
docker build --file docker-tools/debian/Dockerfile --tag demo-bokeh-conda docker-tools/debian
```

To run the container:
```shell
docker run --rm -p 8080:8080 -it demo-bokeh-conda
```


### using debian-slim with pip
Here we use `docker-tools/debian/requirements.txt` to specify pip packages for the Docker container.
```shell
docker build -f docker-tools/debian/Dockerfile-pip --tag demo-bokeh-pip docker-tools/debian
```

To run:
```
docker run -it -p 8080:8080 --rm demo-bokeh-pip
```

### development image
TO DO

## Deploying on Google App Engine
One way to deploy Bokeh apps on Google App Engine (GAE) is to use [GAE Python Flexible Environment](https://cloud.google.com/appengine/docs/flexible/python). Make sure to read at least the [the instructions on custom runtimes](https://cloud.google.com/appengine/docs/flexible/custom-runtimes/how-to). At the time of writing (January 2020), Google App Engine only supports [websockets on the Flex environment](https://cloud.google.com/blog/products/application-development/introducing-websockets-support-for-app-engine-flexible-environment). Once you have setup the project and `gcloud` SDK, you can deploying to GAE with

```shell
cd docker-tools/debian
gcloud app deploy
```

Note this is just a bare-bones deployment, using the default `Dockerfile` with no SSL or any security measures. Using a load-balancer is recommended as described in the GAE documentation.

TO DO: add more details on how to configure GAE more robustly.
