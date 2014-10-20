
Requirements
============

Sphinx must be installed. Additionally, we use the Sphinx 
bootstrap theme:

    $ pip install sphinx-bootstrap-theme
    $ pip install sphinxcontrib-napoleon

To build the gallery, ggplot and seaborn are also needed:

    $ pip install ggplot
    $ pip install seaborn

Building
========

Build requires to install sampledata:

    $ python -c 'import bokeh; bokeh.sampledata.download()'

To build the entire docs:

    $ make clean all

To serve the built docs into a local browser:

    $ make serve

Issue "make help" to see a list of all make commands.

To deploy the docs to bokeh.pydata.org:

    $ fab deploy

Note: requires having SSH keys for "bokeh" user.
