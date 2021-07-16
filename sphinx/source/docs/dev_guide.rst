.. _contributors_guide:

Contribute
##########

.. toctree::
    :maxdepth: 2
    :hidden:

    dev_guide/setup
    dev_guide/testing
    dev_guide/documentation
    dev_guide/models
    dev_guide/server
    dev_guide/bokehjs

Bokeh is an open source project and only exists because of contributors like
you. Bokeh is made possible by a diverse group of software developers, testers,
writers, outreach experts, and much more. And we always love having new people
help us make Bokeh a better tool for everyone!

In this contributors guide, you will find all information you need to join the
growing team of Bokeh contributors. This includes information on how to
:ref:`contribute to Bokeh's code and documentation <contributors_guide_start>`,
:ref:`help out with community support <contributors_guide_community_support>`,
or :ref:`support Bokeh with a donation <contributors_guide_donate>`.

.. note::
    Everyone interacting in the Bokeh project's codebases, issue trackers, and
    discussion forums is expected to follow the `Code of Conduct`_.

.. _contributors_guide_start:

Where to start
--------------

To work with Bokeh's code and documentation, you first need to
:ref:`set up a development environment <devguide_setup>`.

You can then contribute to Bokeh's codebase in many ways:

.. panels::
    :header: bg-bokeh-one

    Bokeh's Python codebase
    ^^^^^^^^^^^^^^^^^^^^^^^
    If you would like to help with Bokeh's Python code:

    * [TBD: link to models]
    * [TBD: link to running tests]
    * [TBD: link to making Python tests]
    * [TBD: link to issues]
    * [TBD: link to PRs]

    ---
    :header: bg-bokeh-two

    BokehJS (TypeScript)
    ^^^^^^^^^^^^^^^^^^^^
    If you would like to help with anything related to :term:`BokehJS`:

    * [TBD: link to BokehJS]
    * [TBD: link to running tests]
    * [TBD: link to making JS tests]
    * [TBD: link to issues]
    * [TBD: link to PRs]
    ---
    :header: bg-bokeh-three

    Bokeh Server
    ^^^^^^^^^^^^
    If you would like to help with the :term:`Server` component of Bokeh:

    * [TBD: link to Bokeh Server]
    * [TBD: link to running tests]
    * [TBD: link to making Python tests]
    * [TBD: link to issues]
    * [TBD: link to PRs]
    ---
    :header: bg-bokeh-four

    Bokeh documentation
    ^^^^^^^^^^^^^^^^^^^
    If you would like to help improving :ref:`Bokeh's documentation <about>`:

    * [TBD: link to docs]
    * [TBD: link to issues]
    * [TBD: link to PRs]


.. _contributors_guide_resources:

Additional resources
--------------------

In addition to this :ref:`contributors guide <contributors_guide_start>`, there are
many more resources available to help you get started quickly:

Bokeh Slack
    A workspace for all contributors and the best way to get a quick response
    from experienced contributors and maintainers. Please
    `request an invitation <Slack>`_!

GitHub wiki and BEPs
    The `wiki on Bokeh's GitHub repository <wiki>`_ contains the Bokeh
    Enhancement Proposals (BEPs). BEPs are the central governance and policy
    documents for Bokeh. This includes details about the contribution processes,
    especially in `BEP 1 (Issues and PRs management)`_ and
    `BEP 6 (Branching and Milestones)`_.

GitHub Discussions
    The `discussion section of Bokeh's GitHub repository <discussions>`_ is a
    place to    talk about details of implementations as well as proposed
    features and ideas for Bokeh.

Bokeh Roadmap
    The `Bokeh roadmap`_ contains goals for Bokeh as a tool and as a
    community.

Contributing.md on GitHub
    The file `CONTRIBUTING.md`_ provides a quick overview of the processes used
    in Bokeh's GitHub repository.

Github Repository
    The source code for Bokeh, the bokeh.org website, and many other aspects of
    Bokeh are hosted on https://github.com/bokeh. A good way to get started is
    to look through open issues in our `issue tracker`_.

Bokeh's documentation
    For an overview of Bokeh's various documentation resources, see
    :ref:`docs.bokeh.org <about>`.

Bokeh's Discourse
    User support for Bokeh is provided by volunteers on the
    `Bokeh Discourse server`_. See
    `the community section of Bokeh's website <community>`_ for more information
    on Bokeh's community resources.

.. _contributors_guide_more_ways:

More ways to contribute
------------------------

In addition to improving Bokeh's codebase and documentation, there are many
other ways to contribute to Bokeh:

.. _contributors_guide_donate:

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

.. _contributors_guide_examples:

Add examples
^^^^^^^^^^^^

If you or your organization are using Bokeh and are willing to share some
examples of what you are working on, consider adding them to the
`Bokeh Showcase`_. You can also add new examples to
:ref:`Bokeh's gallery <gallery>` with a pull request to the
:bokeh-tree:`examples` folder.

.. _contributors_guide_community_support:

Help with community support
^^^^^^^^^^^^^^^^^^^^^^^^^^^

All user support for Bokeh is provided by volunteers. While support questions
are discussed in various places, such as `Stack Overflow`_, the central location
for all user support questions is the `Bokeh Discourse server`_. Feel free to
answer user questions that you can help with. All interactions on Bokeh's
Discourse must follow Bokeh's `Code of Conduct`_.

.. _contributors_guide_bindings:

Contribute to language bindings
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

:term:`BokehJS` accepts an object graph represented by declarative bits of JSON.
This means that any language that can generate JSON can also generate Bokeh
plots for display in a browser.

There are currently three known bindings that expose Bokeh to languages other
than Python:

* `rbokeh <bokeh_r_>`_ adds support for Bokeh to the R language. It
  was started by `@hafen <hafen_>`_.
* `bokeh.jl <bokeh_jl_>`_ brings Bokeh to Julia users. It was originally created
  by `@samuelcolvin <samuelcolvin_>`_.
* `bokeh-scala <bokeh_scala_>`_ exposes Bokeh in the Scala language. The
  project was created by the Bokeh core dev team member `@mattpap <mattpap_>`_.

The low-level object interface in Python mirrors the JSON schema exactly.
Therefore, the best, most authoritative source of information for anyone
writing bindings for Bokeh are the reference guide sections for the
:ref:`bokeh.core.properties` and |bokeh.models|.

If you would like to start working on a new binding or have a new binding added
to this list, please contact the Bokeh core team through `Slack`_.

.. _contributors_guide_spread_the_word:

Spread the word
^^^^^^^^^^^^^^^

Finally, as an open source project, Bokeh relies on word-of-mouth advertising.
If you enjoy using Bokeh or are already contributing to Bokeh, please tell your
friends and the people you work with about Bokeh.

Bokeh is also on `Twitter`_ and `LinkedIn`_. Please follow those accounts for
updates and news about Bokeh. And we always appreciate it if you tag Bokeh's
accounts when you talk about anything that you made with Bokeh!


.. _Code of Conduct: https://github.com/bokeh/bokeh/blob/master/CODE_OF_CONDUCT.md
.. _Slack: https://slack-invite.bokeh.org/
.. _ wiki: https://github.com/bokeh/bokeh/wiki
.. _Bokeh Enhancement Proposals: https://github.com/bokeh/bokeh/wiki
.. _BEP 1 (Issues and PRs management): https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management
.. _BEP 6 (Branching and Milestones): https://github.com/bokeh/bokeh/wiki/BEP-6:-Branching-and-Milestones
.. _discussions: https://github.com/bokeh/bokeh/discussions
.. _Bokeh roadmap: https://bokeh.org/roadmap/
.. _CONTRIBUTING.md: https://github.com/bokeh/bokeh/blob/main/.github/CONTRIBUTING.md
.. _issue tracker: https://github.com/bokeh/bokeh/issues
.. _donation to Bokeh: https://numfocus.org/donate-to-bokeh
.. _numfocus.org: https://numfocus.org/
.. _Support: https://github.com/bokeh/bokeh#support
.. _GitHub repository: https://github.com/bokeh/bokeh
.. _Bokeh Discourse server: https://discourse.bokeh.org/
.. _community: https://bokeh.org/community/
.. _Bokeh Showcase: https://discourse.bokeh.org/c/showcase/
.. _Bokeh's gallery: http://docs.bokeh.org/en/latest/docs/gallery.html
.. _Stack Overflow: https://stackoverflow.com/questions/tagged/bokeh
.. _bokeh_r: http://hafen.github.io/rbokeh/
.. _hafen: https://github.com/hafen
.. _bokeh_jl: https://github.com/bokeh/Bokeh.jl
.. _samuelcolvin: https://github.com/samuelcolvin
.. _bokeh_scala: https://github.com/bokeh/bokeh-scala
.. _mattpap: https://github.com/mattpap
.. _Twitter: https://twitter.com/bokeh
.. _LinkedIn: https://www.linkedin.com/company/project-bokeh/
