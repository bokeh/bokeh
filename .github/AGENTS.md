# Pull requests: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first, including its checks to make before you start. Explanations: `docs/bokeh/source/docs/dev_guide/pull_requests.rst`.

Pushing a branch and opening a pull request are visible to everyone. Do both only when the contributor has asked for it and has reviewed the change.

## Where to push

- Most contributors cannot push to `bokeh/bokeh`. Check with `gh repo view bokeh/bokeh --json viewerPermission`.
- Without `WRITE` or higher, push to the contributor's fork and open the pull request from it. If no remote points to a fork, offer to create one with `gh repo fork bokeh/bokeh --remote`.
- The base of the pull request is the default branch of `bokeh/bokeh`, which is named `branch-X.Y`. It is not `main`.
- Update your branch with a rebase on the default branch. Do not merge the default branch into it.

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
