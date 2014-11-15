# How to contribute

We welcome users' contributions! However, we do have some requests on how contributions
should be done. Please read them in order to avoid surprises down the road.

## Choosing something to work on

The issue tracker has a list of items that you can start working on:

* **Features**. Those are issues marked as `type:feature` or `type:task`.

* **Bugs**. Those are issues marked as `type:bug`.

In order to avoid overlap, it's always a good idea to comment on the item and let everybody
know that you want to work on it.

## Opening an issue

1. Search GitHub and the mailing list for you issue to avoid duplicate reports. Keyword search for
   your error messages are usually most effective.
2. If possible, try to reproduce the issue using most recent development (nightly) build of bokeh
   or, even better, using the `master` branch, because we may have already fixed it.
3. Try to include *minimal* reproducible test case or example. If you submit a lot of code or
   expect us to download a gigabyte worth of data, it's unlikely we will respond quickly, if
   at all.
4. Include relevant system information. At minimum, you should provide output of:

       python -c "import bokeh; print(bokeh.print_versions())"

   If the problem is web browser related, include browser's version information as well (saying
   that you use Chrome is insufficient). We may ask you for additional information to reproduce
   and fix the issue.
5. Provide relevant JavaScript console's and/or bokeh server's logs. If the problem is user
   interface related, it may be better to submit a screenshot instead of a paragraph of text.
6. Always say what is the expected behaviour.

## Creating a pull request

1. Make sure that there is a corresponding issue for your change first. If there is none, create one.
2. Create a fork on GitHub (this is only done before first contribution).
3. Create a branch off the `master` branch with a meaningful name. Preferably include issue number
   and a few keywords, so that we will have at least rough idea what the branch refers to, without
   looking up the issue, e.g. `786_property_names`.
4. Commit your changes and push your changes to GitHub.
5. Create a pull request against the origin's `master` branch. PR must have a meaningful title and
   a message explaining what was achieved, what remains to be done, maybe an example, etc.
6. We don't accept contributions without tests. If there are valid reasons for not including a test,
   please discuss this in the issue.
7. We will review your PR as soon as time permits. Reviewers may comment on your contributions, ask
   you questions regarding the implementation and request changes. If changes are requested, don't
   start a new PR, but push new commits to the existing one. Do *NOT* rebase, ammend, cherry-pick
   published commits. Any of those actions will revoke any LGTMs and +1s, and make us start the
   review from scratch. If you need updates from `master`, just merge it into your branch.

## DOs and DON'Ts

* **DO** follow our coding style.
* **DO** include tests when adding new features. When fixing bugs, start with adding a test that
  highlights how the current behavior is broken.
* **DO** keep the discussions focused. When a new or related topic comes up it's often better to
  create new issue than to side track the discussion.
* **DON'T** surprise us with big pull requests. Instead, file an issue and start a discussion so we
  can agree on a direction before you invest a large amount of time.
* **DON'T** commit code that you didn't write. If you find BSD licence compatible code that you think
  is a good fit to add to this project, file an issue and start a discussion before proceeding.
