.. _userguide:

User Guide
==========


The User Guide is being continuously updated, but please also consult the numerous
`examples <https://github.com/ContinuumIO/Bokeh/tree/master/examples>`_
to see the kinds of parameters that can be passed in to plotting functions in ``bokeh.plotting``, and look
at the `glyph examples <https://github.com/ContinuumIO/Bokeh/tree/master/examples/glyphs>`_ to see
the kinds of low-level object attributes that can be set to really customize a plot.

.. toctree::
   :maxdepth: 2

   user_guide_objects.rst
   user_guide_plotting.rst
   user_guide_charts.rst
   user_guide_server.rst
   user_guide_embdedding.rst
   user_guide_widgets.rst
   user_guide_examples.rst

Reporting Bugs
--------------

You can report possible bugs, start discussions, or ask for features on our
`issue tracker <https://github.com/ContinuumIO/bokeh/issues>`_.
To start a new issue, you will find a ``New issue`` green button at the top
right area of the page.

Bokeh also provides the ``bokeh.report_issue()`` function to easily open
issues from an interactive console prompt::

    In [1]: import bokeh

    In [2]: bokeh.report_issue()
    This is the Bokeh reporting engine.

    Next, you will be guided to build the report
    Write the title for the intended issue: This is a text.
    Write the body for the intended issue: And this is the problem.
    You need to add your GHUSER (Github username) and GHPASS (Github password)
    to the environmentor complete the next lines.
    Do you want to abort to set up the environment variable? no
    Write your Github username: damianavila
    Write your Github password: xxxxxxxxxxx

    Preview:

    title: This is a text.
    body: And this is the problem.

        Bokeh version: 0.4.4-455-gc3324df-dirty
        Python version: 2.7.4-CPython
        Platform: Linux-3.11.0-031100rc7-generic-x86_64-with-Ubuntu-13.04-raring

    Submit the intended issue/comment? y

This will open a new issue on our issue tracker as well as open a new browser tab
showing the issue, in case you want to add more comments. As you can see, this
automatically appends useful information about versions and architecture that can
help us to reproduce the problem.

Finally, you can also make a comment on any issue using this tool just by passing
the issue number as an argument::

    In [3]: bokeh.report_issue(555)
    This is the Bokeh reporting engine.

    Next, you will be guided to build the report
    Write your comment here: Adding a new comment to an already opened issue.
