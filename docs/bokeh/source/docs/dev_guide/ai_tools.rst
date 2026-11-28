.. _contributor_guide_ai_tools:

Contributing with AI tools
==========================

This page describes what the project expects from
contributions that involve AI, and what the repository provides to help coding
agents follow Bokeh's conventions.

.. _contributor_guide_ai_tools_guidelines:

AI Contribution Guidelines
--------------------------

Bokeh's `AI Contribution Guidelines`_ are the project's policy for all
contributions that involve AI tools as coding agents and chat assistants.
They apply to issues, pull requests, and comments, whether or not you use
a coding agent. Read them before you contribute.

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
your tool reads in addition to them, for example ``CLAUDE.local.md``.

.. _contributor_guide_ai_tools_disclosure:

Disclosing the use of AI tools
------------------------------

The ``AGENTS.md`` files ask agents to disclose AI involvement in every pull
request description, issue, and comment that they help produce. The note says
which tool you used and what it did. For example:

.. code-block:: none

    AI disclosure: I used Claude Code to draft the fix and the tests. I
    reviewed and tested the changes myself.

See the `AI Contribution Guidelines`_ for details.

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
(:bokeh-tree:`tests/codebase/test_agents_md.py`) checks that the commands,
files, and guide sections that the ``AGENTS.md`` files mention exist. You may
need to update an ``AGENTS.md`` file after you rename or move a section of
this contributor guide.

.. _AI Contribution Guidelines: https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management#ai-contribution-guidelines
.. _AGENTS.md: https://agents.md/
