FROM frolvlad/alpine-miniconda3
LABEL org.pydata.bokeh.maintainer="Karel-van-de-Plassche <karelvandeplassche@gmail.com>"

# Bokeh required dependencies
RUN conda install -y \
    'six >=1.5.2' \
    'PyYAML >=3.10' \
    'python-dateutil >=2.1' \
    'Jinja2 >=2.7' \
    'numpy >=1.7.1' \
    'packaging >=16.8' \
    'tornado >=4.3'

# Workaround until conda-forge is updated
RUN pip install --no-cache \
  'bokeh==0.13.0'

# Bokeh optional dependencies
RUN conda install -y \
    'nodejs'
    #'psutil' # Not used in bokeh==0.12.7

RUN conda clean -ay

RUN python3 -c "import tornado; print('tornado version=' + tornado.version)"
RUN bokeh info

ENV BOKEH_EXAMPLE_DIR bokeh_examples
COPY hello_world.py $BOKEH_EXAMPLE_DIR/hello_world.py
COPY hello_nodejs.py $BOKEH_EXAMPLE_DIR/hello_nodejs.py
# Build with 'sudo docker build . --tag bokeh'
# Run with 'sudo docker run -p 5006:5006 -it bokeh bokeh serve bokeh_examples/hello_world.py'
