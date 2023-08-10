.. _contributor_guide_pull_requests:

Making a successful pull request
================================

All changes to Bokeh's codebase and documentation are managed through
`pull requests`_.

Prerequisites
-------------

Creating a pull request requires some basic knowledge of GitHub. See the
`GitHub documentation`_ for general information about GitHub and pull requests.

To create a pull request, you need a development environment as described in
:ref:`contributor_guide_setup`.

You can format any text you enter when working with pull requests. To learn more
about your formatting options, see `Writing on GitHub`_ in the
`GitHub documentation`_.

Pull request workflow
---------------------

1. Find an issue to reference
    Every pull request to the Bokeh repository begins with an issue. See
    `Pull Requests in the Bokeh wiki <wiki pull requests_>`_ for more
    information on exceptions.

    First, pick an issue from Bokeh's `issue tracker`_. Issues that are
    relatively easy to get started on are labeled `good first issue`_.

    Next, post a comment in the issue's discussion to indicate that you are
    working on this issue. If there is no issue yet, you should first
    :ref:`create one <contributor_guide_issues>`.

2. Create a branch
    Before writing any code, you need to create a new `branch`_ on
    :ref:`your fork <contributor_guide_setup_cloning>` of the Bokeh repository.
    In most cases, you should base your new branch on Bokeh's ``default``
    branch. The default branch is usually a branch that represents the next
    version of Bokeh, for example ``branch-3.0``.

    Use this pattern to name your branch:

    ``[issue number]_[short_description]``

    For example:

    ``11423_table_column_add_visible``

    See `BEP 6: Branching Strategy`_ for more information on the different
    branches in the Bokeh repository.

    To create this example branch and check it out:

    ``git checkout -b 11423_table_column_add_visible``

3. Add commits to your local branch
    Make some changes to the code and save the modified files. To view which
    files were modified:

    ``git status``

    When you're satisfied with the current change, stage each modified file:

    ``git add filename1 filename2 filenameN``

    And then commit the change with a commit message:

    ``git commit -m "one-liner describing change"``

4. Push your local branch to your fork on GitHub
    Before you can open a pull request, you first need to `push your branch`_
    from your local clone to your fork on GitHub. For example:

    ``git push --set-upstream origin 11423_table_column_add_visible``

5. Open a new pull request
    After publishing your branch and adding a first commit, go to the
    `Bokeh repository`_ on GitHub. GitHub should have detected your recent
    updates to your branch. In this case, GitHub will suggest opening a pull
    request for you. If not, switch to the tab "Pull request" in the top menu
    and use the button "New pull request".

    To create a pull request, make sure to select the default branch you used
    when creating your branch as ``base`` (for example, ``branch-3.0``). Select
    your branch as ``compare``.

6. Write your pull request
    After creating your pull request, GitHub will compare your branch to the
    base branch and highlight all your proposed changes.

    First, enter a title for your pull request. This title should make clear
    what your pull request does. For example: "Fix PNG export", "Add panel to
    tests", or "Document SVG backend".

    Next, enter a description. Include some background about what your pull
    request does and why you decided to write things the way you did. Also, link
    to the issue your pull request is based on. To do so, use a keyword such as
    "fixes" followed by the number of the issue. For example "Fixes #11479".
    See `Linking a pull request to an issue using a keyword`_ in the
    `GitHub documentation`_ for more information. Your description should also
    include information about :ref:`tests <contributor_guide_writing_tests>` and
    :ref:`documentation <contributor_guide_documentation>`, if applicable.

7. Add more commits to your pull request
    Once you have created a pull request, a member of the `Bokeh core team`_
    will begin `reviewing your pull request`_ and may request changes or
    additions. If so, they will help you along the way with any questions you
    may have. You can make new changes in your existing local branch and push
    them to Github. The PR will update automatically, there is no need to open a
    new PR. The team member will also update any
    `labels in your pull request <wiki pull requests_>`_. Reviewing pull
    requests can be time-consuming, so be aware that it might take a while to
    receive feedback.

8. Look for the next issue to work on
    With your first pull request merged, you should take another look at Bokeh's
    `issue tracker`_ to find the next issue to work on.

    Once your successfully complete two substantive pull requests, you are
    eligible to become a member of the `Bokeh development team`_. This means
    you will have direct access to the Bokeh repository and won't need to use
    a fork, for example. See `BEP 4: Project Roles`_ for more information about
    all roles in the Bokeh project.

Tips
----

If you have any questions or encounter any problems with your pull request,
please reach out on the `Bokeh's contributor Slack`_ or the `Bokeh Discourse`_.
Also, check the :ref:`additional resources available to contributors
<contributor_guide_resources>`.

Things to keep in mind when working on a pull request:

* When writing code, try to match the existing coding style.
* Try to divide your work into smaller chunks and push small, incremental
  commits.
* Include :ref:`new tests <contributor_guide_writing_tests>` when adding new
  features.
* Include :ref:`tests <contributor_guide_writing_tests>` to check for
  regressions when fixing bugs.
* Keep the discussions focused. When a new or related topic comes up, it's
  often better to create a new issue than to sidetrack the discussion.
* Don't submit a big pull request unannounced. Instead, file an issue and
  start a discussion about what direction to take before investing a large
  amount of time.
* Never commit code or documentation that you didn't write (or don't have the
  necessary rights to). If you find code or text that is compatible with
  `Bokeh's BSD license`_ and that you think would be useful to add to Bokeh,
  :ref:`file an issue <contributor_guide_issues>` and start a discussion first.
* In case your pull request includes additional or updated dependencies, you
  need to update :ref:`Bokeh's environment files <contributor_guide_testing_ci_environments>`
  in the :bokeh-tree:`conda` folder.

See the `"Pull Requests" section in BEP 1: Issues and PRs management <wiki pull requests_>`_
for more information about labels and the pull request management process.

.. _pull requests: https://docs.github.com/en/github/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
.. _GitHub documentation: https://docs.github.com/en/get-started
.. _issue tracker: https://github.com/bokeh/bokeh/issues
.. _Writing on GitHub: https://docs.github.com/en/github/writing-on-github
.. _wiki pull requests: https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management#pull-requests
.. _good first issue: https://github.com/bokeh/bokeh/labels/good%20first%20issue
.. _branch: https://docs.github.com/en/github/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-branches
.. _`BEP 6: Branching Strategy`: https://github.com/bokeh/bokeh/wiki/BEP-6:-Branching-Strategy
.. _push your branch: https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository
.. _reviewing your pull request: https://docs.github.com/en/github/collaborating-with-pull-requests/reviewing-changes-in-pull-requests
.. _Bokeh Discourse: https://discourse.bokeh.org/
.. _Bokeh's contributor Slack: https://slack-invite.bokeh.org/
.. _Bokeh repository: https://github.com/bokeh/bokeh/
.. _Linking a pull request to an issue using a keyword: https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
.. _Bokeh core team: https://github.com/bokeh/bokeh/wiki/BEP-4:-Project-Roles#core-team
.. _Bokeh development team: https://github.com/bokeh/bokeh/wiki/BEP-4:-Project-Roles#development-team
.. _`BEP 4: Project Roles`: https://github.com/bokeh/bokeh/wiki/BEP-4:-Project-Roles
.. _Bokeh's BSD license: https://github.com/bokeh/bokeh/blob/main/LICENSE.txt
