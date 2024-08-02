.. _contributor_guide_issues:

Creating issues
===============

Bug reports and feature requests in Bokeh's issue tracker are the foundation of
almost all improvements implemented in Bokeh. `Bokeh's issue tracker <issue tracker_>`_
is part of the Bokeh GitHub repository.

.. _contributor_guide_issues_before:

Before opening an issue
-----------------------

As a first step, you should always check
`Bokeh's GitHub issue tracker <issue tracker_>`_ and the
`Bokeh Discourse`_ for similar or identical issues. There are lots of issues,
and it's possible to miss duplicates even after searching. If a team member
closes your issue as a duplicate, you can always add your input and thoughts to
the linked issue.

It is also possible that the issue you want to report has already been resolved
in a newer version of Bokeh. Update Bokeh to the most recent stable version
available with `conda`_ or `pip`_ and try to reproduce the issue.

You can format any text you enter when filing an issue. To learn more about
your formatting options, see `Writing on GitHub`_ in the
`GitHub documentation`_.

.. _contributor_guide_issues_kinds:

Kinds of issues
---------------

Bokeh's issue tracker accepts two kinds of issues:

Bug report
    Please use this kind of issue to report anything that does not work as it
    should. This can be an unexpected error, a fault in the code, or a
    discrepancy between the documentation and the actual behavior of the code,
    for example.

Feature request
    Please use this kind of issue to propose a new feature or anything else that
    expands Bokeh's current capabilities.

When you `create a new issue`_, you can choose between creating these two types
of issues. When creating either type of issue, GitHub will present you with a
form. Please follow the instructions in those forms closely and provide
all necessary information.

.. note::
    The issue tracker is not the place for general support. For questions and
    technical assistance, visit the `Bokeh Discourse`_. When you are unsure,
    post a question to the Discourse first before opening an issue.

.. _contributor_guide_issues_kinds_bugs:

Reporting bugs
~~~~~~~~~~~~~~

To `file a new bug report`_, you should have the following information ready.
This will help with resolving your issue as quickly as possible:

Title
    Add a short, descriptive title for your bug report. The form field already
    contains ``[BUG]``, add your title after that.

Software version info
    To find the version of packages such as Bokeh, Python, IPython, and Node.js,
    use the following command in the environment where you have Bokeh installed:

    .. code-block:: sh

        bokeh info

    or alternatively use:

    .. code-block:: python

        from bokeh.util.info import print_info
        print_info()

    in your scripts and/or MREs (minimal reproducible examples).

    This provides you with a list of the versions of relevant software packages.
    Copy and paste this information into your bug report.

Issue details
    Describe the behavior you would have expected and the behavior you observed
    instead.

Complete, minimal, self-contained example code that reproduces the issue
    Provide a code example that follows the
    `definition of a minimal, reproducible example at stackoverflow.com`_.
    For more details, see `Craft Minimal Bug Reports at matthewrocklin.com`_.

Stack traceback and/or browser JavaScript console output
    Optionally, add any error messages or logs that might be helpful in
    reproducing and identifying the bug.

Screenshots or screencasts of the bug in action
    If possible, add additional information that might help understand what
    your bug report is about. This can be screenshots or `screencasts`_ that
    demonstrate the behavior you are filing an issues about, for example.

.. _contributor_guide_issues_kinds_feature:

Feature requests
~~~~~~~~~~~~~~~~

To `file a new feature request`_, you should have the following information
ready. This will help with reaching a decision on your proposed feature as
quickly as possible:

Title
    Add a short, descriptive title for your feature request. The form field
    already contains ``[FEATURE]``, add your title after that.

Description of the problem you'd like solved
    A clear and concise description of what problem you would like to solve with
    the suggested feature..

Description of the solution you'd like
    A clear and concise description of what you want to happen.

Description of alternatives you've considered
    A clear and concise description of any alternative solutions or features
    you've considered.

Additional context
    Add any additional information about your feature request. This can be
    screenshots or `screencasts`_ that illustrate the functionality you would
    like to see in Bokeh, for example.

.. _contributor_guide_issues_next:

Next steps
----------

When you create a new issue, GitHub will automatically add the label ``TRIAGE``.

Once you create an issue, a member of the `Bokeh core team`_ will review your
issue and update the label. This might also include requesting further
information from you. Reviewing issues is a time-consuming, manual process, so
be aware that it might take a while for your issue to be processed.

See the `section "Issues" in BEP 1: Issues and PRs management`_ for more
information about labels and the issue management process.

.. _issue tracker: https://github.com/bokeh/bokeh/issues
.. _Bokeh Discourse: https://discourse.bokeh.org/
.. _conda: https://anaconda.org/conda-forge/bokeh
.. _pip: https://pypi.org/project/bokeh/
.. _Writing on GitHub: https://docs.github.com/en/github/writing-on-github
.. _GitHub documentation: https://docs.github.com/en/get-started
.. _definition of a minimal, reproducible example at stackoverflow.com: https://stackoverflow.com/help/minimal-reproducible-example
.. _Craft Minimal Bug Reports at matthewrocklin.com: https://matthewrocklin.com/blog/work/2018/02/28/minimal-bug-reports
.. _create a new issue: https://github.com/bokeh/bokeh/issues/new/choose
.. _file a new bug report: https://github.com/bokeh/bokeh/issues/new?assignees=&labels=TRIAGE&template=bug_report.yml&title=%5BBUG%5D+
.. _screencasts: https://github.blog/2021-05-13-video-uploads-available-github/
.. _file a new feature request: https://github.com/bokeh/bokeh/issues/new?assignees=&labels=TRIAGE&template=feature_request.yml&title=%5BFEATURE%5D+
.. _Bokeh core team: https://github.com/bokeh/bokeh/wiki/BEP-4:-Project-Roles#core-team
.. _`section "Issues" in BEP 1: Issues and PRs management`: https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management
