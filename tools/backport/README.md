# Bokeh backport maintainer prototype

`backport` turns the evolving `NEEDS BACK PORT` queue—or an explicit file of PRs—into
one reviewable release pull request. It validates the PRs, cherry-picks them in
merge order, guides the maintainer through conflicts or explicit clean-pick review,
publishes the aggregate PR, and later verifies and rebase-merges it.

Run it from the Bokeh checkout:

```bash
python -m tools.backport COMMAND
```

Python 3.13 or newer and an authenticated `gh` CLI are required. All GitHub REST and
GraphQL operations run through `gh api`; the prototype does not manage tokens itself.

## Maintainer UX

During ordinary next-minor development, a maintainer only does this:

1. Merge a bug fix or task PR into the repository's next-minor/default branch.
2. Give the PR the milestone for that next minor.
3. Add the exact label `NEEDS BACK PORT`.

The label is aspirational. The maintainer does not need to know whether the PR will
cherry-pick cleanly months later.

At the backport cutoff, a release maintainer runs:

```bash
python -m tools.backport plan
```

For an explicit selection instead of the label queue:

```text
15233
#15261
https://github.com/bokeh/bokeh/pull/15217
```

```bash
python -m tools.backport plan --file backports.txt
```

Blank lines are ignored. Explicitly selected PRs do not need `NEEDS BACK PORT`; having
the label is also fine.

To add newly labeled PRs to an aggregate PR that is still open:

```bash
python -m tools.backport plan --update 15334
```

The update reconstructs the existing table and commit stack, ignores labeled PRs already
present, adds the remaining labeled PRs in original merge order, force-with-lease pushes
the standard branch, and updates the same PR. Use `--file` to select the additions
explicitly, including a previously rejected PR whose label was removed:

```bash
python -m tools.backport plan --update 15334 --file backports.txt
```

To remove a backport while rebuilding, identify its source PR, source merge commit, or
aggregate backport commit. The option may be repeated:

```bash
python -m tools.backport plan --update 15334 --revert 15327
```

This omits the selected backport from the rebuilt branch instead of appending another
revert. If the aggregate already contains a direct manual revert of that backport, the
original and revert are both omitted. A selected standalone commit is likewise omitted.
Existing adapted commits and standalone compatibility commits at the end of the aggregate
stack are replayed. Any replay conflict uses the normal save, resume, and resolution flow.
Updates use a detached temporary worktree, so an existing local checkout of the aggregate
branch is left untouched. The standardized `backport/<version>` name still identifies the
remote branch used by the pull request.

An initial plan:

1. validates the complete labeled queue or explicit selection;
2. creates a temporary `backport/<version>` branch and worktree;
3. cherry-picks PRs in their original merge order;
4. handles all accept/reject/conflict decisions interactively;
5. lets the maintainer add and commit a dedicated compatibility fix if needed;
6. pushes the branch and creates a draft `[MERGE WITH CLI] Backports for <version>` PR;
7. comments on rejected source PRs and removes their queue labels; and
8. removes the temporary local worktree and branch after publication.

The tool checkpoints progress automatically under Git's common directory. At any action
menu, choose `s` to save and exit:

```bash
python -m tools.backport plan --resume
```

Resume reopens the same worktree and continues at the pending clean-pick review or
conflict. It also reconciles the narrow interruption window where Git completed a
cherry-pick immediately before the checkpoint was written. There are still no separate
`status`, `continue`, `reject`, or `publish` commands.

After review and green CI:

```bash
python -m tools.backport merge
```

With exactly one open aggregate PR, no number is needed. A number can be supplied
explicitly when necessary:

```bash
python -m tools.backport merge 15264
```

The explicit form also retries finalization if GitHub merged the PR but a later metadata
operation failed.

The repository must have rebase merging enabled globally. The merge command checks this
setting and, when necessary, directs the maintainer to enable it in the GitHub web UI.
The prototype does not configure merge settings, rulesets, special status gates, or a
GitHub App.

## Conventions

| Item | Convention | Example |
|---|---|---|
| Queue label | `NEEDS BACK PORT` | exact spacing |
| Aggregate PR title | `[MERGE WITH CLI] Backports for <version>` | `[MERGE WITH CLI] Backports for 3.9.2` |
| Aggregate head | `backport/<version>` | `backport/3.9.2` |
| Default aggregate base | `branch-<major>.<minor>` | `branch-3.9` |

The aggregate head remains standardized when the target branch is overridden.

## Candidate policy

Before creating anything, `python -m tools.backport plan` requires every selected PR to be merged and
to satisfy the release's issue-type policy:

- every PR must have at least one linked closing issue;
- for patch releases `X.Y.Z` where `Z > 0`, every linked issue's native GitHub issue
  type must be `Bug` or `Task`; and
- for a new minor release `X.Y.0`, the native `Feature` issue type is also allowed.

Labels named `type: ...` do not count. Other native types, including `Discussion`, are
never allowed. Pull requests do not have a native GitHub issue type, so a PR without a
linked closing issue is rejected. The rule is based on the selected release version, so
a 4.0 feature can be selected for a 3.10.0 backport with:

```bash
python -m tools.backport plan \
  --file backports.txt \
  --version 3.10.0 \
  --target-branch staging-branch-3.10
```

Label-queue mode additionally requires each PR to have been merged into either the
current development/default `branch-X.Y` or the release branch being rebuilt, and to
currently have the development milestone `X.Y`. Allowing the release branch accounts
for PRs merged before that branch was force-reset to the previous release. The tool
checks the current target history and rejects changes already present directly or via a
recorded cherry-pick. Explicit `--file` mode deliberately does not impose a source branch
or source milestone.

Candidates are always cherry-picked in their original PR merge order, including when
the input file uses a different order.

## Release and target selection

By default, the tool finds the greatest stable `X.Y.Z` tag, increments its patch
component, and derives the release branch:

```text
latest stable tag   3.9.1
next release        3.9.2
target branch       branch-3.9
backport branch     backport/3.9.2
```

Use `--version` to override the release number. The version controls the aggregate PR
title, backport branch, milestone, and issue-type policy. A new minor release `X.Y.0`
uses the existing `X.Y` milestone; patch releases use their full `X.Y.Z` milestone.
With no target override, the tool derives `branch-X.Y` from that version.

Use `--target-branch` to base the aggregate PR on any other existing branch. A target
override requires an explicit version so release metadata cannot be inferred from an
unrelated tag:

```bash
python -m tools.backport plan \
  --version 3.9.2 \
  --target-branch staging-branch-3.10
```

The target override changes the worktree and aggregate PR base. Label-queue mode retains
its next-minor source policy; explicit file mode may select merged PRs from any source
branch.

The aggregate target may not be the repository's current development branch, whether it
was derived or supplied explicitly.

`plan` uses the `origin` Git remote by default. A differently named remote can be
selected with `--remote`.

## Planning decisions

By default, clean cherry-picks are accepted automatically. A conflict presents:

```text
[c] continue after resolving the files
[r] reject this PR
[s] save progress and exit
[q] discard the saved plan
```

Resolve the displayed files in the displayed worktree, then choose `c`. The tool stages
the resolution, completes the cherry-pick as one adapted backport commit, and proceeds.
Choosing `r` records a reason and continues without that PR. Choosing `s` preserves the
active cherry-pick and exits. Choosing `q` aborts the current cherry-pick, deletes the
temporary worktree and local branch, and makes no GitHub changes.

To require an explicit decision for every clean cherry-pick:

```bash
python -m tools.backport plan --review-each
```

Each clean result then presents:

```text
[a] accept this clean cherry-pick
[r] reject this PR
[s] save progress and exit
[q] discard the saved plan
```

Reject removes the just-created commit and advances. At the end of either mode, choose
`p` to publish, `s` to save and exit, or `q` to discard the run. Before choosing `p`,
the maintainer may add and commit a small release-only compatibility fix in the
displayed worktree. Such commits remain on the aggregate branch but do not need rows in
the backported-PR table.

At publication, each rejected source PR receives an idempotent comment containing the
reason and loses `NEEDS BACK PORT` if present. Rejected PRs are omitted from the
aggregate PR. If an update successfully adds a previously rejected PR, its stale
rejection comment is removed.

Publication uses an ordinary `git push`, so Bokeh's configured pre-push hooks run before
the aggregate branch is published. An initial aggregate PR is opened as a draft; an
update preserves the existing PR's draft or ready state. `python -m tools.backport merge`
also requires every GitHub check and commit status to pass.

## Local checkpoints and the aggregate PR

Before publication, `.git/backport-plan.json` is the local workflow record. It contains
the candidate queue, decisions, original and backport commits, worktree, and branch. The
file is outside the worktree, never appears in `git status`, and is removed after
successful publication or an explicit discard.

The draft PR body contains an explicit CLI merge instruction and a compact visible table
sorted by PR number:

```markdown
This PR collects backports for 3.9.2.

> [!IMPORTANT]
> Merge this PR with `python -m tools.backport merge`. Do not use GitHub's web UI.

| PR | Result | Details |
| --- | --- | --- |
| [#15233 Constrain ranges when interval bounds change](https://github.com/bokeh/bokeh/pull/15233) | clean |  |
| [#15261 Fix/improve faces example](https://github.com/bokeh/bokeh/pull/15261) | adapted | [diff](https://htmlpreview.github.io/?https://gist.githubusercontent.com/example/revision/bokeh-15261-range-diff.html) |
```

Clean rows have no third-column content. At publication, the tool creates one public gist
containing the complete dual-color ``git range-diff`` output for every adapted pick on a
light background. Each adapted row links directly to its revision-pinned rendered page.
When an adaptation changes binary files that `git range-diff` cannot display, the linked
page shows a compact notice naming those files; the aggregate PR table remains unchanged.

There is no checklist, crossed-out rejection history, or hidden HTML state. The merge
command reads the visible rows, obtains each source PR's merge commit from GitHub, and
matches it to the standard `cherry picked from commit ...` trailer in the aggregate PR.
It fails safely if a row has no unique matching backport commit.

## Merge and finalization

Before confirmation, `python -m tools.backport merge` reconstructs the plan from the PR title, branches,
head SHA, and summary table. After confirmation, one authoritative preflight immediately
before the merge verifies:

- repository Settings → General → Pull Requests has Allow rebase merging enabled;
- the exact `[MERGE WITH CLI] Backports for X.Y.Z` title and `backport/X.Y.Z` head;
- repository ownership and open, non-draft, mergeable state;
- every summarized backport commit is in the PR;
- all current CI check runs and commit statuses are successful; and
- neither the head nor GitHub's test merge changed during preflight.

The command requests a rebase merge of the exact checked head. After success, it:

- moves included source PRs and their current linked closing issues to the target-release
  milestone;
- removes `NEEDS BACK PORT` from included source PRs when present;
- sets the aggregate PR milestone; and
- deletes the remote `backport/<version>` branch.

Rejected PRs and their issues retain their existing milestones. If finalization needs to
be retried after the PR is already merged, run `python -m tools.backport merge NUMBER`.

The commands always ask before creating the backport worktree, publishing the aggregate
PR, or merging and changing release metadata.

## Package layout

```text
tools/backport/
├── __main__.py       # `python -m tools.backport` entry point
├── aggregate.py      # Aggregate PR summary codec and commit snapshot
├── commands/
│   ├── plan.py       # Resumable planning and publication
│   └── release.py    # PR reconstruction, merge, and finalization
├── candidates.py     # Queue discovery and candidate eligibility
├── checks.py         # Aggregate PR identity and CI validation
├── git.py            # Non-interactive Git operations
├── github.py         # Small JSON wrapper around `gh api`
├── interactive.py    # Rich prompts and resumable session rendering
├── merging.py        # Rebase merge and post-merge bookkeeping
├── models.py         # In-memory planning and published-PR models
├── persistence.py    # Local JSON checkpoints in Git's common directory
├── planning.py       # Cherry-picks, decisions, and resume reconciliation
├── publishing.py     # Draft PR and rejection publication
└── ui.py             # Rich rendering and confirmations
```

## Validation

From the Bokeh checkout, use the locked Pixi development environment:

```bash
pixi install --locked
pixi run setup
pixi run python -m pytest tests/tools/backport
pixi run ruff check tools/backport tests/tools/backport
pixi run ruff format --check tools/backport tests/tools/backport
```

Exercise the repository entry point:

```bash
python -m tools.backport --help
python -m tools.backport plan --help
python -m tools.backport merge --help
```
