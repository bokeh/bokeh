# How to contribute

We welcome contributions from users!

We want to make the process of contributing as smooth as possible (for both you *and*
the maintainers). Please refer to the information below to avoid suprises down the
road.

## Getting Set Up

For information about setting up a development environment, building from source, etc.,
see the [Developer Guide](https://docs.bokeh.org/en/latest/docs/dev_guide.html)

## Choosing something to work on

The issue tracker has a list of items that you can start working on, classified by the
labels:

* [`type:feature`](https://github.com/bokeh/bokeh/labels/type:%20feature)
* [`type:task`](https://github.com/bokeh/bokeh/labels/type:%20task)
* [`type:bug`](https://github.com/bokeh/bokeh/labels/type:%20bug)

You can search by these labels, or keywords, to find issues to work on. You can also look
through the list of [good first issues](https://github.com/bokeh/bokeh/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22).

Once you decide to work on a specific issue, it's always a good idea to comment there
to let others know that you intend to work on it.

## Opening a new issue

Some guidelines to consider before you open a new issue:

1. Avoid duplicate reports. Search [GitHub](https://github.com/bokeh/bokeh/issues) and
   the [Discourse](https://discourse.bokeh.org) for similar or identical issues. Keyword
   searches for your error messages are usually effective.

2. Always try to reproduce the issue in the *latest stable release*. The issue may already
   be resolved.

3. Always include a *minimal*, self-contained, reproducible test case or example. It is not
   possible to investigate issues that cannot be reproduced.

4. Include relevant system information. At minimum, you should provide output of:

      `bokeh info`

5. Include relevant browser information (if the issue is browser-related), including
   specific versions. We may ask you for additional information to reproduce the issue.

6. Include relevant [Browser JavaScript logs](https://webmasters.stackexchange.com/questions/8525/how-do-i-open-the-javascript-console-in-different-browsers). If the issue involves a Bokeh server app, include `bokeh serve` console logs.

7. If the problem is user interface related, it is *always* good to include a screenshot or
   screen video capture.

8. State the expected behavior, and how the actual behavior is different.

## Creating a pull request (PR)

Making a [Pull Request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests)
is how you ask the project to take on your contribution. Some guidelines for making a successful
Pull Request:

1. Make sure that there is a corresponding issue for your change first. If there isn't yet,
   create one.

2. [Create a fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) of
   the Bokeh repository on GitHub (this is only done before your *first* Pull Request).

3. [Create a branch](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging) off
   the current default base branch (e.g.`branch-x.y`) with a meaningful name. Preferably include
   issue number and a few keywords in the branch name, so that we will have a rough idea what the
   branch refers to, without looking up the issue. As an example: `786_property_names`.

4. Commit your changes to your branch and [push the branch to GitHub](https://docs.github.com/en/github/using-git/pushing-commits-to-a-remote-repository).

5. Create a pull request against the origin's default base branch branch. (The correct branch should
   be used automatically when you create the PR.) The PR must have a meaningful title and a message
   explaining what was achieved, what remains to be done, maybe an example, etc.

6. We genrally don't accept code contributions without tests. If there are valid reasons for not
   including a test, please discuss this in the PR.

7. We will review your PR as time permits. Reviewers may comment on your contributions, ask
   you questions regarding the implementation or request changes. If changes are requested, push
   new commits to the existing branch. Do *NOT* rebase, amend, or cherry-pick published commits.
   Any of those actions will make us start the review from scratch and create more work.

   If you need updates from the base branch, then *merge* them into your branch.

## DOs and DON'Ts

* **DO** match the existing coding style.

* **DO** include new tests when adding new features.

* **DO** include regression tests when fixing bugs.

* **DO** keep the discussions focused. When a new or related topic comes up it's often better to
  create new issue than to side track the discussion.

* **DO** have a look at [BEP-1](https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management) to see how we manage issues and pull requests in bokeh.

* **DON'T** surprise us with big pull requests. Instead, file an issue and start a discussion so we
  can agree on a direction before you invest a large amount of time.

* **DON'T** commit code that you didn't write. If you find BSD license compatible code that you
  think would be useful to add to this project, file an issue and start a discussion first.
