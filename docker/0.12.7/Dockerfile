FROM frolvlad/alpine-miniconda3
LABEL org.pydata.bokeh.maintainer="Karel-van-de-Plassche <karelvandeplassche@gmail.com>"

RUN conda install -y \
    'six >=1.5.2' \
    'PyYAML >=3.10' \
    'python-dateutil >=2.1' \
    'Jinja2 >=2.7' \
    'numpy >=1.7.1' \
    'tornado >=4.3'

RUN conda install -y \
  'bokeh==0.12.7'

RUN python3 -c "import tornado; print('tornado version=' + tornado.version)"
RUN bokeh info

COPY hello_world.py /hello_world.py
# Build with 'sudo docker build . --tag bokeh'
# Run with 'sudo docker run -p 5006:5006 -it bokeh bokeh serve hello_world.py'
