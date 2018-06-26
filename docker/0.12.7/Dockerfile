FROM alpine:3.7
LABEL org.pydata.bokeh.maintainer="Karel-van-de-Plassche <karelvandeplassche@gmail.com>"

RUN apk add --no-cache \
    python3

RUN apk add --no-cache \
    py3-six \
    py3-yaml \
    py3-dateutil \
    py3-markupsafe \
    py3-jinja2 \
    py3-numpy \
    py3-tornado

RUN pip3 install \
  bokeh==0.12.7

RUN python3 -c "import tornado; print('tornado version=' + tornado.version)"
RUN bokeh info

COPY hello_world.py /hello_world.py
# Build with 'sudo docker build . --tag bokeh'
# Run with 'sudo docker run -p 5006:5006 -it bokeh bokeh serve hello_world.py'
