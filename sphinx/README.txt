
Requirements
============

Sphinx must be installed. Additionally, we use the following addon:

    $ pip install sphinxcontrib-httpdomain

To build the gallery, ggplot and seaborn are also needed:

    $ pip install ggplot
    $ pip install seaborn


Manual actions for new releases
===============================

In ``conf.py`` the links that appear in the docs nav appear. On a new release, the 
releases link should be changed to the latest release notes (we should find a way to automate this)

The link to the sitemap should be added to the Google Search Console.


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

Notes: 
 - requires having SSH keys for "bokeh" user.
 - you may want to specify the docs_version by using environment variable
   `BOKEH_DOCS_VERSION` (http://bokeh.pydata.org/en/latest/docs/dev_guide/setup.html#bokeh-docs-version)

objects.graffle
===============
The objects.graffle file was created using the commercial OmniGraffle package. It 
was exported as a PNG image in _images/objects.png.


