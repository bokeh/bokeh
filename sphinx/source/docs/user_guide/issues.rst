.. _userguide_issues:

Reporting Issues
================

You can report possible bugs, start discussions, or ask for features on our
`issue tracker <https://github.com/bokeh/bokeh/issues>`_.
To start a new issue, you will find a ``New issue`` green button at the top
right area of the page.

Bokeh also provides the :func:`bokeh.report_issue()` function to easily open
issues from an interactive console prompt::


    In [1]: bokeh.report_issue()
    This is the Bokeh reporting engine.

    You will be guided to build a GitHub issue.

    Issue title: A Short Issue Title
    Description: Some additional details and description
    GitHub username: SomeUser
    GitHub password: xxxxxxxx

    Preview:

    Title:  A Short Issue Title
    Description:

    Some additional details and description

    System information:
       Bokeh version: 0.5.2-436-g831adf5-dirty
      Python version: 2.7.8-CPython
            Platform: Darwin-13.3.0-x86_64-i386-64bit

    Submit (y/n)?

This will open a new issue on our issue tracker as well as open a new browser tab
showing the issue, in case you want to add more comments. As you can see, this
automatically appends useful information about versions and architecture that can
help us to reproduce the problem.

Finally, you can also make a comment on any issue using this tool just by passing
the issue number as an argument::

    In [3]: bokeh.report_issue(555)
    This is the Bokeh reporting engine.

    You will be guided to build a GitHub issue.

    Write your comment here: Some new information!



