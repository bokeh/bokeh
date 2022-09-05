:orphan:

.. _contributor_guide_debug_headless:

Debugging in headless Chrome
============================

Some of :ref:`Bokeh's JavaScript tests <contributor_guide_testing_local_javascript>`
include running fully automated tests with a headless version of Chrome. For
local testing and especially for running and updating specific tests, :ref:`run
these tests manually with Chrome's GUI
<contributor_guide_testing_local_javascript_devtools>`.

In most cases, the results of running tests locally with Chrome's GUI are the
same as running them in the CI with headless Chrome. However, there are rare
cases where headless and GUI Chrome generate different results. In this
situation, you can't use the GUI - instead, you need to debug BokehJS' code
directly in the headless browser.

.. note::
    The following instructions only apply to the rare cases where you actually
    need to debug specifically in the headless version of Chrome. In most cases,
    you should be able to debug BokehJS with the GUI version of Chrome. See
    :ref:`contributor_guide_testing_local_javascript_devtools` for instructions
    on debugging BokehJS with the GUI version of Chrome.

Follow these steps in case you need to debug directly in the headless version of
Chrome:

1. Use ``node test/devtools server`` to start a BokehJS devtools server.
2. Open another console and run ``node make test:run:headless``. This starts
   Chrome in headless mode preconfigured for the BokehJS testing setup.
3. Open a Chrome or Chromium web browser and enter the URL
   ``http://localhost:9222``
4. Click the ``about:blank`` link at the bottom of the page. You can ignore the
   rest of that page.
5. Clicking this link opens a remote devtools console. Use the navigation bar
   inside this console to use the :ref:`endpoints
   <contributor_guide_testing_local_javascript_devtools_endpoints>` you would
   usually use with Bokeh's devtools server in the GUI version of the browser.

.. image:: /_images/chrome_headless_debugging.png
    :class: image-border
    :alt: Screenshot of a Chromium web browser displaying controls for Bokeh's
          preconfigured version of headless Chrome.
    :align: center
    :width: 100%

See :ref:`contributor_guide_testing_local_javascript_devtools` for more
information on Bokeh's devtools server.
