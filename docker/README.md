This directory contains docker images for specific versions of Bokeh. These
containers are currently experimental, and old versions of bokeh are only
supported on a best-effort basis. Feel free to submit a pull requested
for new versions! For more info on Docker, look [here](https://docs.docker.com/)

To build a docker image, first `cd` into the version of your choice and then:

``` shell
    docker build . --tag bokeh
```

Each docker container should print out the installed bokeh and tornado version, as well as contain a minimal test. To run this test:

``` shell
    docker run -p 5006:5006 -it bokeh bokeh serve hello_world.py
```
