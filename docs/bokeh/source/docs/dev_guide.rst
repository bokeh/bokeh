.. _contributor_guide:

Contribute
##########

.. toctree::
    :maxdepth: 2
    :hidden:

    dev_guide/setup
    dev_guide/creating_issues
    dev_guide/pull_requests
    dev_guide/documentation
    dev_guide/testing
    dev_guide/writing_tests
    dev_guide/python
    dev_guide/bokehjs

Bokeh is an open source project and only exists because of contributors like
you. Bokeh is made possible by a diverse group of software developers, testers,
writers, outreach experts, and much more. And we always love having new people
help us make Bokeh a better tool for everyone!

In this contributor guide, you will find all of the information you need to join the
growing team of Bokeh contributors. This includes information on how to
:ref:`contribute to Bokeh's code and documentation <contributor_guide_start>`,
:ref:`help out with community support <contributor_guide_community_support>`,
or :ref:`support Bokeh with a donation <contributor_guide_donate>`.

.. note::
    Everyone active in the Bokeh project's codebases, issue trackers, and
    discussion forums is expected to follow the `Code of Conduct`_.

.. _contributor_guide_start:

Where to start
--------------

To work with Bokeh's code and documentation, you first need to
:ref:`set up a development environment <contributor_guide_setup>`.

You can then contribute to Bokeh's codebase in many ways:

.. grid:: 1 1 2 2

    .. grid-item-card::

        Bokeh's Python codebase
        ^^^
        If you would like to help with Bokeh's Python code:

        * :ref:`contributor_guide_python`
        * :ref:`contributor_guide_testing`
        * :ref:`contributor_guide_writing_tests`
        * :ref:`contributor_guide_issues`
        * :ref:`contributor_guide_pull_requests`

    .. grid-item-card::

        BokehJS (TypeScript)
        ^^^
        If you would like to help with anything related to :term:`BokehJS`:

        * :ref:`contributor_guide_bokehjs`
        * :ref:`contributor_guide_testing`
        * :ref:`contributor_guide_writing_tests`
        * :ref:`contributor_guide_issues`
        * :ref:`contributor_guide_pull_requests`

    .. grid-item-card::

        Bokeh documentation
        ^^^
        If you would like to help improving :ref:`Bokeh's documentation <about>`:

        * :ref:`contributor_guide_documentation`
        * :ref:`contributor_guide_issues`
        * :ref:`contributor_guide_pull_requests`

.. _contributor_guide_resources:

Additional resources
--------------------

In addition to this :ref:`contributor guide <contributor_guide_start>`, there
are many more resources available to help you get started quickly:

Bokeh Slack
    The Bokeh Slack is a workspace for all contributors and the best way to get
    a quick response from experienced contributors and maintainers. Please
    `request an invitation`_!

GitHub wiki and BEPs
    The `wiki on Bokeh's GitHub repository`_ contains the Bokeh
    Enhancement Proposals (BEPs). BEPs are the central governance and policy
    documents for Bokeh. This includes details about the contribution processes,
    especially in `BEP 1: Issues and PRs management`_ and
    `BEP 6: Branching Strategy`_.

GitHub Discussions
    The `discussion section of Bokeh's GitHub repository`_ is a
    place to    talk about details of implementations as well as proposed
    features and ideas for Bokeh.

Bokeh roadmap
    The `Bokeh roadmap`_ contains goals for Bokeh as a tool and as a
    community.

Github repository
    The source code for Bokeh, the bokeh.org website, and many other aspects of
    Bokeh are hosted on https://github.com/bokeh. A good way to get started is
    to look through open issues in our `issue tracker`_.

Bokeh's documentation
    For an overview of Bokeh's various documentation resources, see
    :ref:`docs.bokeh.org <about>`.

Bokeh's Discourse
    User support for Bokeh is provided by volunteers on the
    `Bokeh Discourse server`_. See
    `the community section of Bokeh's website`_ for more information on Bokeh's
    community resources.

.. _contributor_guide_more_ways:

More ways to contribute
------------------------

In addition to improving Bokeh's codebase and documentation, there are many
other ways to contribute to Bokeh:

.. _contributor_guide_donate:

Donate to Bokeh
^^^^^^^^^^^^^^^

Consider making a `donation to Bokeh`_. Your generous gift will help the project
pay for developer time, additional professional services, travel, workshops, and
other important needs.

*Bokeh is a Sponsored Project of NumFOCUS, a 501(c)(3) nonprofit charity in the
United States. NumFOCUS provides Bokeh with fiscal, legal, and administrative
support to help ensure the health and sustainability of the project. Visit*
https://numfocus.org/ *for more information.*

*Donations to Bokeh are managed by NumFOCUS. For donors in the United States,
your gift is tax-deductible to the extent provided by law. As with any donation,
you should consult with your tax adviser about your particular tax situation.*

If your company uses Bokeh and is able to sponsor the project financially or
through in-kind support, please get in touch with us at info@bokeh.org.

For more information on fiscal and in-kind donations, see the `Support`_ section
in Bokeh's `GitHub repository`_.

.. _contributor_guide_examples:

Add examples
^^^^^^^^^^^^

If you or your organization are using Bokeh and are willing to share some
examples of what you are working on, consider adding them to the
`Bokeh Showcase`_. You can also add new examples to
:ref:`Bokeh's gallery <gallery>` with a :ref:`pull request
<contributor_guide_pull_requests>` to the :bokeh-tree:`examples` folder.

.. _contributor_guide_community_support:

Help with community support
^^^^^^^^^^^^^^^^^^^^^^^^^^^

All user support for Bokeh is provided by volunteers. While support questions
are discussed in various places, such as `Stack Overflow`_, the central location
for all user support questions is the `Bokeh Discourse server`_. Feel free to
answer user questions that you can help with. All interactions on Bokeh's
Discourse must follow Bokeh's `Code of Conduct`_.

.. _contributor_guide_bindings:

Contribute to language bindings
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

:term:`BokehJS` accepts an object graph represented by declarative bits of JSON.
This means that any language that can generate JSON can also generate Bokeh
plots for display in a browser.

There are currently three known bindings that expose Bokeh to languages other
than Python:

* `Bokeh.jl <Bokeh_jl_>`_ brings Bokeh to Julia users. It was created by community
  member `@cjdoris <cjdoris_>`_.
* `BokehServer.jl <BokehServer_jl_>`_ also implements Julia bindings to BokehJS,
  including a server for synchronizing plots from Julia. It was authored by community
  member `@poldavezac <poldavezac_>`_.
* `rbokeh <bokeh_r_>`_ adds support for Bokeh to the R language. It
  was started by `@hafen <hafen_>`_. (This project is currently archived.)
* `bokeh-scala <bokeh_scala_>`_ exposes Bokeh in the Scala language. The
  project was created by the Bokeh core dev team member `@mattpap <mattpap_>`_.
  (This project is currently archived.)

The low-level object interface in Python mirrors the JSON schema exactly.
Therefore, the best, most authoritative source of information for anyone
writing bindings for Bokeh are the reference guide sections for the
:ref:`bokeh.core.properties` and |bokeh.models|.

Another resource for working on bindings is Bokeh's
:bokeh-tree:`scripts/spec.py` script. This Python script generates a JSON
description of every model and property in Bokeh,
including types, defaults, and
:ref:`help strings <contributor_guide_documentation_edit_properties_help>` for
each. You can use this information as a basis for creating new low-level
bindings or checking existing bindings for completeness, for example.

If you would like to start working on a new binding or have a new binding added
to this list, please contact the Bokeh core team through `Slack`_.

.. _contributor_guide_vulnerability:

Report a vulnerability
^^^^^^^^^^^^^^^^^^^^^^

To report a security vulnerability, please use the `Tidelift security contact`_.
Tidelift will coordinate the fix and disclosure.


.. _Code of Conduct: https://github.com/bokeh/bokeh/blob/main/docs/CODE_OF_CONDUCT.md
.. _request an invitation: https://slack-invite.bokeh.org/
.. _wiki on Bokeh's GitHub repository: https://github.com/bokeh/bokeh/wiki
.. _Bokeh Enhancement Proposals: https://github.com/bokeh/bokeh/wiki
.. _`BEP 1: Issues and PRs management`: https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management
.. _`BEP 6: Branching Strategy`: https://github.com/bokeh/bokeh/wiki/BEP-6:-Branching-Strategy
.. _discussion section of Bokeh's GitHub repository: https://github.com/bokeh/bokeh/discussions
.. _Bokeh roadmap: https://bokeh.org/roadmap/
.. _issue tracker: https://github.com/bokeh/bokeh/issues
.. _Slack: https://slack-invite.bokeh.org/
.. _donation to Bokeh: https://numfocus.org/donate-to-bokeh
.. _numfocus.org: https://numfocus.org/
.. _Support: https://github.com/bokeh/bokeh#support
.. _GitHub repository: https://github.com/bokeh/bokeh
.. _Bokeh Discourse server: https://discourse.bokeh.org/
.. _the community section of Bokeh's website: https://bokeh.org/community/
.. _Bokeh Showcase: https://discourse.bokeh.org/c/showcase/
.. _Bokeh's gallery: http://docs.bokeh.org/en/latest/docs/gallery.html
.. _Stack Overflow: https://stackoverflow.com/questions/tagged/bokeh
.. _bokeh_r: http://hafen.github.io/rbokeh/
.. _hafen: https://github.com/hafen
.. _Bokeh_jl: https://github.com/cjdoris/Bokeh.jl
.. _cjdoris: https://github.com/cjdoris
.. _BokehServer_jl: https://github.com/poldavezac/BokehServer.jl
.. _poldavezac: https://github.com/poldavezac
.. _bokeh_scala: https://github.com/bokeh/bokeh-scala
.. _mattpap: https://github.com/mattpap
.. _Tidelift security contact: https://tidelift.com/security
.. _LinkedIn: https://www.linkedin.com/company/project-bokeh/
