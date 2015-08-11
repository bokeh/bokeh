
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

To deploy docs to bokeh.pydata.org you have multiple options, such as:

     $ fab deploy # deploy the current checked out version at /<version>

     $ fab deploy:<name> # deploy the current checked out version at /<name>

For example:

     $ fab deploy:0.9.2 # deploy at /0.9.2
     $ fab deploy:test  # deploy at /test
     $ fab deploy:dev   # deploy at /dev

Additionally, you have the "latest" task to update the `/latest` link to the specified version:

    $ fab latest:0.9.3 # link /latest to 0.9.3 version

Note: requires having SSH keys for "bokeh" user.


objects.graffle
===============
The objects.graffle file was created using the commercial OmniGraffle package. It 
was exported as a PNG image in _images/objects.png.

