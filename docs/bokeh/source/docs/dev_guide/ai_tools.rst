.. _contributor_guide_ai_tools:

Contributing with AI tools
==========================

Many contributors use AI tools, such as coding agents and chat assistants, when
they work on Bokeh. This page describes what the project expects from
contributions that involve AI, and what the repository provides to help coding
agents follow Bokeh's conventions.

.. _contributor_guide_ai_tools_guidelines:

AI Contribution Guidelines
--------------------------

Bokeh's `AI Contribution Guidelines`_ are the project's policy for all
contributions that involve AI tools. They apply to issues, pull requests, and
comments, whether or not you use a coding agent. Read them before you
contribute.

This guide doesn't repeat the guidelines, but two of their points are easy to
miss when you work with an agent. First, a pull request needs an issue that a
maintainer has triaged. Second, comments and reviews that an AI tool has
generated are not acceptable, even if you disclose them.

You are responsible for everything you submit. This means that you need to
understand your contribution, test it, and be able to explain it in your own
words when a reviewer asks. An AI tool can help you write code or text, but it
can't take that responsibility for you.

.. _contributor_guide_ai_tools_agents_md:

Instructions for coding agents
------------------------------

The Bokeh repository contains instructions for coding agents in files called
``AGENTS.md``. `AGENTS.md`_ is an open format that most coding agents read
automatically. These files tell an agent how to set up the development
environment, which commands build and test each part of Bokeh, and which
conventions apply.

The file in the top-level directory of the repository applies to all work in
the repository. It links to more specific files:

* :bokeh-tree:`AGENTS.md`: setup, common commands, and the rules for every
  contribution
* :bokeh-tree:`src/AGENTS.md`: the Python library
* :bokeh-tree:`bokehjs/AGENTS.md`: BokehJS
* :bokeh-tree:`docs/AGENTS.md`: the documentation
* :bokeh-tree:`examples/AGENTS.md`: the examples
* :bokeh-tree:`tests/AGENTS.md`: the Python tests

The ``AGENTS.md`` files are short on purpose. An agent loads them at the start
of every session, so every line costs time and tokens. They contain commands,
rules, and links to the pages of this contributor guide. The explanations are
in this guide, which is the single source of truth for people and for agents.

Most coding agents need no configuration to use these files. Some tools read a
different file by default. In that case, configure your tool to read
``AGENTS.md``, for example with the ``context.fileName`` setting of Gemini CLI
or the ``read`` option of Aider. Don't add instructions for a specific tool to
the repository. If a tool can only read its own file, such as ``CLAUDE.md``,
that file may exist next to an ``AGENTS.md`` file, but it must contain nothing
but a reference to it.

.. note::
    An ``AGENTS.md`` file makes it more likely that your agent follows Bokeh's
    conventions, but it doesn't guarantee it. Always review what your agent
    produces before you submit it.

.. _contributor_guide_ai_tools_disclosure:

Disclosing the use of AI tools
------------------------------

The ``AGENTS.md`` files ask agents to disclose AI involvement in every pull
request description, issue, and comment that they help produce. The note says
which tool you used and what it did. For example:

.. code-block:: none

    AI disclosure: I used Claude Code to draft the fix and the tests. I
    reviewed and tested the changes myself.

Expect your agent to add such a note, and leave it in. Make sure that it is
accurate, especially the part about what you did yourself.

This is stricter than the `AI Contribution Guidelines`_, which suggest
mentioning substantive use of AI tools. A short note helps reviewers, and it
costs you nothing.

.. _contributor_guide_ai_tools_maintenance:

Keeping the instructions current
--------------------------------

The ``AGENTS.md`` files are only useful as long as they are correct. Treat
them like documentation:

* If your pull request changes a command, path, tool, or convention that an
  ``AGENTS.md`` file describes, update that file in the same pull request. The
  pull request template has a checkbox for this.
* If you notice that an agent keeps making the same mistake in Bokeh's
  codebase, consider adding a rule to the relevant ``AGENTS.md`` file. Keep it
  to one or two lines, and put any longer explanation into this contributor
  guide.
* Add a new ``AGENTS.md`` file to a directory only if that directory needs
  more than a few lines of its own. Link the new file from the top-level
  ``AGENTS.md``.

A :ref:`codebase test <contributor_guide_testing_local_codebase>`
(:bokeh-tree:`tests/codebase/test_agents_md.py`) checks every ``AGENTS.md``
file. It fails if a file mentions a pixi task, a BokehJS build task, or a file
that doesn't exist, if a file is not linked from the top-level file, or if a
file is longer than the size limit. To run this test, use the following
command:

.. code-block:: sh

    pixi run pytest tests/codebase/test_agents_md.py

The test can't check whether a described convention is still correct. This is
why the files are short and link to this guide instead of repeating it.

.. _AI Contribution Guidelines: https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management#ai-contribution-guidelines
.. _AGENTS.md: https://agents.md/
