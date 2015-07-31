
Requirements
============

Sphinx must be installed. Additionally, we use the Sphinx
bootstrap theme:

    $ pip install sphinx-bootstrap-theme
    $ pip install sphinxcontrib-httpdomain

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

To deploy the docs to bokeh.pydata.org you have multiple options, such as:

    $ fab deploy #will deploy the current version at /version

    $ fab deploy:0.9.2 #will deploy/redeploy 0.9.2 version at /0.9.2

    $ fab deploy:dev #will deploy current version at /dev (same for /test) 

    $ fab deploy:0.9.3,latest #should be use to also link /latest to 0.9.3 version (for releases)

Note: requires having SSH keys for "bokeh" user.


objects.graffle
===============
The objects.graffle file was created using the commercial OmniGraffle package. It 
was exported as a PNG image in _images/objects.png.

