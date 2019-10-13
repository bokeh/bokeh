# How to contribute

We welcome users' contributions! However, we do have some requests for how contributions
should be made. Please read these guidelines in order to avoid surprises down the road.

## Getting Set Up

For information about setting up a development environment, building from source, etc.,
see the [Developer Guide](https://docs.bokeh.org/en/latest/docs/dev_guide.html)

## Choosing something to work on

The issue tracker has a list of items that you can start working on, classified by the labels:

* [`type:feature`](https://github.com/bokeh/bokeh/labels/type:%20feature)
* [`type:task`](https://github.com/bokeh/bokeh/labels/type:%20task)
* [`type:bug`](https://github.com/bokeh/bokeh/labels/type:%20bug)

In order to avoid duplication of effort, it's always a good idea to comment on an issue
and let everybody know that you intend to work on it.

## Opening a new issue

1. Avoid duplicate reports. Search [GitHub](https://github.com/bokeh/bokeh/issues) and
   the [Discourse](https://discourse.bokeh.org) for similar or identical issues. Keyword
   searches for your error messages are usually effective.

2. The issue may already be resolved. Always try to reproduce the issue in the latest stable release.

3. Always include a *minimal*, self-contained, reproducible test case or example. It is not
   possible to investigate issues that cannot be reproduced.

4. Include relevant system information. At minimum, you should provide output of:

      `python -c "import bokeh; print(bokeh.__version__)"`

5. Include relevant browser information (if the issue is browser-related). Just saying that you
   use Chrome is generally not sufficient. We may ask you for additional information to
   reproduce and fix the issue.

6. Include relevant JavaScript console and/or `bokeh serve` logs.

7. If the problem is user interface related, it is *always* good to include a screenshot or
   screen video capture.

8. State the expected behavior.

## Creating a pull request (PR)

1. Make sure that there is a corresponding issue for your change first. If there isn't yet,
   create one.

2. Create a fork of the Bokeh repository on GitHub (this is only done before *first*) contribution).

3. Create a branch off the `master` branch with a meaningful name. Preferably include issue number
   and a few keywords, so that we will have a rough idea what the branch refers to, without looking
   up the issue. As an example: `786_property_names`.

4. Commit your changes and push them to GitHub.

5. Create a pull request against the origin's `master` branch. The PR must have a meaningful title
   and a message explaining what was achieved, what remains to be done, maybe an example, etc.

6. We don't accept code contributions without tests. If there are valid reasons for not including a
   test, please discuss this in the issue.

7. We will review your PR as time permits. Reviewers may comment on your contributions, ask
   you questions regarding the implementation or request changes. If changes are requested, push
   new commits to the existing branch. Do *NOT* rebase, amend, or cherry-pick published commits.
   Any of those actions will make us start the review from scratch. If you need updates from `master`,
   just merge it into your branch.

## DOs and DON'Ts

* **DO** match the existing coding style.

* **DO** include new tests when adding new features.

* **DO** include regression tests when fixing bugs.

* **DO** keep the discussions focused. When a new or related topic comes up it's often better to
  create new issue than to side track the discussion.

* **DON'T** surprise us with big pull requests. Instead, file an issue and start a discussion so we
  can agree on a direction before you invest a large amount of time.

* **DON'T** commit code that you didn't write. If you find BSD license compatible code that you
  think would be useful to add to this project, file an issue and start a discussion first.
