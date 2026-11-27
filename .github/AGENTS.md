# Pull requests: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first, including its checks to make before you start. Explanations: `docs/bokeh/source/docs/dev_guide/pull_requests.rst`.

Pushing a branch and opening a pull request are visible to everyone. Do both only when the contributor has asked for it and has reviewed the change.

## Remotes and forks

Only maintainers can push to `bokeh/bokeh`, so most contributors work on a fork. Run `git remote -v` at the start of the task, not only before you push, to see which case applies. Below, `upstream` is the remote of `bokeh/bokeh`, and `origin` is the remote you push to.

- **Clone of a fork** (the usual case): `origin` is the contributor's fork. If no remote points to `bokeh/bokeh`, add it with `git remote add upstream https://github.com/bokeh/bokeh.git`.
- **Clone of `bokeh/bokeh`, without permission to push**: this is enough to build and test, but not to push. Check with `gh repo view bokeh/bokeh --json viewerPermission`. Without `WRITE` or higher, offer to create a fork with `gh repo fork bokeh/bokeh --remote` when the contributor wants to push. This renames `origin` to `upstream` and adds the fork as `origin`, which gives the first case.
- **Clone of `bokeh/bokeh`, with permission to push** (maintainers): `origin` is `bokeh/bokeh`, and there is no `upstream`. Read `origin` wherever this file says `upstream`.

In every case:

- Fetch before you branch: `git fetch upstream --tags`. A fork is often behind `bokeh/bokeh`, and it can lack the tags that Bokeh's version comes from. Without the tags, setup fails with `KeyError: '0.0.1'`.
- Find the default branch: `git remote set-head upstream --auto` prints it. It is named `branch-X.Y`. It is not `main`.
- Create your branch from it: `git switch --no-track -c <issue number>_<short_description> upstream/branch-X.Y`. Do not branch from the fork's copy of the default branch, and do not commit to the default branch.
- Update your branch with `git fetch upstream` and `git rebase upstream/branch-X.Y`. Do not merge the default branch into it.

## Committing and pushing

- `git config user.name` and `git config user.email` must print the contributor's name and email address. If one is empty, ask the contributor to set it. Never make up an identity.
- Push your branch with `git push -u origin <branch>`. Never push to the default branch.
- If git asks for a password over HTTPS, `gh auth setup-git` makes git use the login of `gh`.
- The base of the pull request is the default branch of `bokeh/bokeh`, also when the pull request comes from a fork.

## Title

- A plain sentence that says what the change does, for example "Fix PNG export of plots with a hidden toolbar".
- ASCII only, no emoji, and no prefix such as "fix:". The changelog is generated from titles.

## Description

- Keep the checklist of `.github/PULL_REQUEST_TEMPLATE.md` and fill it in. Leave an item that does not apply unchecked and say why.
- Link the issue with `fixes #NNNN`. The changelog relies on it.
- Keep the text short. Say what changed and why, and what you could not verify. Do not list the diff file by file, and do not write that checks pass, because CI shows that.
- Explain every changed visual baseline.
- Add the AI disclosure that the root file asks for. Leave the contributor's part for the contributor to fill in.

## After opening

- Open the pull request as a draft when it is not ready, for example while baselines are missing.
- If CI fails, read the log of the failed job before you change anything. Do not make a check pass by weakening a test, a type, or a lint rule.
- A release note references the pull request with `:bokeh-pull:`. Add it in a follow-up commit, when the number exists. See [docs/AGENTS.md](../docs/AGENTS.md).
- Answer review comments with changes to the code. Do not write the replies for the contributor.
- Do not mark the pull request as ready, request a review, or merge. Those are the contributor's and the maintainers' steps.

## Files in this directory

Ask the contributor before you change a workflow or another file under `.github`. `tests/codebase/test_ci_workflows.py` checks the workflows, for example that actions are pinned to a commit.
