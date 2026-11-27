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

Most coding agents need no configuration to use these files. For Claude Code
and Gemini CLI, the repository also contains the files ``CLAUDE.md`` and
``GEMINI.md``, which only point to ``AGENTS.md``. If your tool reads none of
these files, configure it to read ``AGENTS.md``.

Don't put your personal instructions into any of these files. Use a file that
your tool reads in addition to them, for example ``CLAUDE.local.md`` for Claude
Code or ``~/.gemini/GEMINI.md`` for Gemini CLI. Git ignores ``CLAUDE.local.md``
in this repository.

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

See the `AI Contribution Guidelines`_for details.

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
* ``CLAUDE.md`` and ``GEMINI.md`` are only pointers. Never add instructions to
  them, or to any other file for a specific tool.

A :ref:`codebase test <contributor_guide_testing_local_codebase>`
(:bokeh-tree:`tests/codebase/test_agents_md.py`) checks every ``AGENTS.md``
file. It fails if a file mentions a pixi task, a BokehJS build task, or a file
that doesn't exist, if a file quotes the title of a section that doesn't
exist in the page it points to, if a file is not linked from the top-level
file, if a file is longer than the size limit, or if a pointer file contains
anything but its pointer. This means that you may need to update an
``AGENTS.md`` file after you rename or move a section of this contributor
guide. To run this test, use the following command:

.. code-block:: sh

    pixi run pytest tests/codebase/test_agents_md.py

The test can't check whether a described convention is still correct. This is
why the files are short and link to this guide instead of repeating it.

.. _AI Contribution Guidelines: https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management#ai-contribution-guidelines
.. _AGENTS.md: https://agents.md/
