#!/usr/bin/env python3
""" Squash-merge a GitHub PR, collecting all Co-authored-by trailers from the
PR's commits, plus the commits' authors other than the PR author, into a
single deduplicated block at the end of the message.

The PR must be labelled ``status: ready`` or ``status: accepted``, and have at
least one approving review and no reviews requesting changes (counting only each
reviewer's latest approval or change request, like GitHub does); use
``--override-review`` to merge anyway. After
merging, relabels the PR ``status: ready`` -> ``status: accepted`` (if needed)
and adds ``reso: completed`` to the issues the PR fixes (or to the PR itself if
it doesn't fix any issues), and deletes the PR's branch from GitHub (unless it's
in a fork or other open PRs are based on it).

The message lists the PR's commit messages; with ``--short-log``, only their
titles (the Co-authored-by trailers are still collected from the full messages).

The PR can be given by number, URL or head branch name (anything ``gh pr view``
accepts). If not given, the PR of the current branch is used, after asking for
confirmation.

usage: squash_merge.py [--override-review] [--short-log] [pr-number | url | branch]
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from typing import Any, Never
from urllib.parse import quote

CO_AUTHORED_BY = re.compile(r"^co-authored-by:", re.IGNORECASE)

def error(message: str) -> Never:
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)

def info_line(message: str) -> None:
    """ Report an action before performing it. Flushed, so that it comes
    before the output of the command performing it. """
    print(message, flush=True)

def confirm(question: str) -> bool:
    """ Ask a yes/no question on stderr, defaulting to no. """
    print(f"{question} [y/N] ", end="", file=sys.stderr, flush=True)
    try:
        answer = input()
    except EOFError:
        answer = ""
    return answer == "y"

def run(*args: str, quiet: bool = False) -> None:
    """ Run a command, letting its output through (only stderr if ``quiet``).
    On failure, exit with its exit code (the command has already reported the
    error on stderr). """
    result = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL if quiet else None)
    if result.returncode != 0:
        sys.exit(result.returncode)

def output(*args: str) -> str:
    """ Like ``run()``, but return the command's stdout. """
    result = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, text=True)
    if result.returncode != 0:
        sys.exit(result.returncode)
    return result.stdout

def gh_json(*args: str) -> Any:
    return json.loads(output("gh", *args))

def squeeze_blank_lines(lines: list[str]) -> list[str]:
    """ Collapse runs of blank lines into a single one, like ``cat -s``. """
    result: list[str] = []
    for line in lines:
        if line.strip() == "" and result and result[-1].strip() == "":
            continue
        result.append(line)
    return result

def build_message(commits: list[str], authors: list[str], short: bool = False) -> str:
    """ Combine the commits' messages into a bulleted list, either full messages
    or (if ``short``) only their titles, followed by the Co-authored-by trailers
    of all the messages and ``authors``. """
    lines = [line for commit in commits for line in commit.splitlines()]

    if short:
        body = [f"* {commit.splitlines()[0]}" for commit in commits]
    else:
        full = "\n\n".join(f"* {commit}" for commit in commits).splitlines()
        body = squeeze_blank_lines([line for line in full if not CO_AUTHORED_BY.match(line)])

    trailers: list[str] = []
    seen: set[str] = set()
    for line in [*lines, *authors]:
        if CO_AUTHORED_BY.match(line) and (key := line.lower()) not in seen:
            seen.add(key)
            trailers.append(line)

    msg = "\n".join(body).rstrip("\n")
    if trailers:
        msg += "\n\n" + "\n".join(trailers)
    return msg

def review_states(reviews: list[Any]) -> dict[str, str]:
    """ Each reviewer's current review state, i.e. their latest review that
    approved, requested changes or was dismissed (plain comments don't change
    it). Dismissed reviews don't count. """
    states: dict[str, str] = {}
    for review in reviews:  # chronological
        if review["state"] in {"APPROVED", "CHANGES_REQUESTED", "DISMISSED"}:
            states[review["author"]["login"]] = review["state"]
    return {login: state for login, state in states.items() if state != "DISMISSED"}

def delete_head_branch(pr: str, info: Any) -> bool:
    """ Delete the merged PR's head branch from GitHub, like the "Delete branch"
    button does. Branches in forks, and branches other open PRs are based on (they
    would be closed), are left alone. Returns ``False`` if the deletion failed. """
    branch: str = info["headRefName"]
    repo: str = info["headRepository"]["nameWithOwner"]

    if info["isCrossRepository"]:
        info_line(f"PR #{pr}: branch '{branch}' is in fork {repo}, not deleting it")
        return True

    dependents = gh_json("pr", "list", "--repo", repo, "--base", branch, "--state", "open", "--json", "number")
    if dependents:
        numbers = ", ".join(f"#{dependent['number']}" for dependent in dependents)
        info_line(f"PR #{pr}: branch '{branch}' is the base of open PRs {numbers}, not deleting it")
        return True

    info_line(f"PR #{pr}: deleting branch '{branch}' from {repo}")
    ref = f"repos/{repo}/git/refs/heads/{quote(branch, safe='/')}"
    result = subprocess.run(["gh", "api", "--method", "DELETE", ref], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    if result.returncode != 0:
        print(f"error: failed to delete branch '{branch}' from {repo}", file=sys.stderr)
        return False
    return True

def main(argv: list[str]) -> None:
    parser = argparse.ArgumentParser(prog="squash_merge.py", description="Squash-merge a GitHub PR.")
    parser.add_argument("pr", nargs="?", metavar="pr-number | url | branch",
        help="the PR to merge (default: the current branch's PR)")
    parser.add_argument("--override-review", action="store_true",
        help="merge even without an approval, or with changes requested")
    parser.add_argument("--short-log", action="store_true",
        help="list only the commits' titles in the message, not their full messages")
    args = parser.parse_args(argv)
    pr_ref: list[str] = [args.pr] if args.pr is not None else []

    # Everything about the PR comes from a single query, so it all describes the
    # same state of the PR. Without arguments, gh uses the current branch's PR.
    info = gh_json("pr", "view", *pr_ref, "--json",
        "number,url,state,reviews,labels,baseRefName,title,headRefOid,author,commits,headRefName,headRepository,isCrossRepository")

    # From here on, refer to the PR by number, however it was given.
    pr = str(info["number"])

    state: str = info["state"]
    if state != "OPEN":
        error(f"PR #{pr} is {state.lower()}, not open")

    if not pr_ref:
        branch = output("git", "branch", "--show-current").strip()
        print(f"Branch '{branch}' refers to PR #{pr}: {info['title']}\n  {info['url']}", flush=True)
        if not confirm("Is this the right PR?"):
            return

    labels = {label["name"] for label in info["labels"]}
    if not labels & {"status: ready", "status: accepted"}:
        error(f"PR #{pr} is not labelled 'status: ready' or 'status: accepted'")

    states = review_states(info["reviews"])
    approved = sorted(login for login, state in states.items() if state == "APPROVED")
    rejected = sorted(login for login, state in states.items() if state == "CHANGES_REQUESTED")
    problems: list[str] = []
    if not approved:
        problems.append("has no approving reviews")
    if rejected:
        problems.append("has changes requested by " + ", ".join(rejected))
    if problems:
        problem = f"PR #{pr} " + " and ".join(problems)
        if not args.override_review:
            error(f"{problem}; use --override-review to merge anyway")
        info_line(f"warning: {problem}; overridden with --override-review")

    base: str = info["baseRefName"]
    title: str = info["title"]
    head_oid: str = info["headRefOid"]

    # GitHub's own squash message credits the commits' authors (other than the PR
    # author), but a custom --body doesn't, so add them here.
    pr_author = info["author"]["login"]
    authors = [
        f"Co-authored-by: {author['name']} <{author['email']}>"
        for commit in info["commits"]
        for author in commit["authors"]
        if author.get("login") != pr_author
    ]

    run("git", "fetch", "-q", "origin", f"pull/{pr}/head", base)
    if output("git", "rev-parse", "FETCH_HEAD").strip() != head_oid:
        error(f"PR #{pr} head changed while fetching; try again")

    # NUL-separated, as messages can contain anything else.
    log = output("git", "log", "--reverse", "--no-merges", "--format=%B%x00", f"origin/{base}..{head_oid}")
    commits = [commit.strip("\n") for commit in log.split("\0")[:-1]]
    subject = f"{title} (#{pr})"
    msg = build_message(commits, authors, args.short_log)

    print(f"{subject}\n\n{msg}\n", flush=True)
    if not confirm("Merge?"):
        info_line("Merge aborted, no changes were made.")
        return

    # Refuse to merge if the PR was pushed to after the message was built.
    run("gh", "pr", "merge", pr, "--squash", "--match-head-commit", head_oid, "--subject", subject, "--body", msg)

    # gh pr merge also succeeds when it only enables auto-merge or adds the PR to a
    # merge queue, so don't touch labels until the PR is actually merged.
    merged = gh_json("pr", "view", pr, "--json", "state,closingIssuesReferences")
    state = merged["state"]
    if state != "MERGED":
        error(f"PR #{pr} is not merged (state: {state}); labels not updated")

    # A failure to delete the branch shouldn't stop labelling, so it's reported at the end.
    branch_deleted = delete_head_branch(pr, info)

    if "status: ready" in labels:
        info_line(f"PR #{pr}: replacing 'status: ready' with 'status: accepted'")
        run("gh", "pr", "edit", pr, "--remove-label", "status: ready", "--add-label", "status: accepted", quiet=True)
    else:
        info_line(f"PR #{pr}: already labelled 'status: accepted'")

    issues = merged["closingIssuesReferences"]
    if issues:
        # Label every issue even if some fail, then report the failures at the end.
        failed: list[str] = []
        for issue in issues:
            repo = issue["repository"]
            name = f"{repo['owner']['login']}/{repo['name']}#{issue['number']}"
            info_line(f"issue {name}: adding 'reso: completed'")
            result = subprocess.run(["gh", "issue", "edit", issue["url"], "--add-label", "reso: completed"],
                stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
            if result.returncode != 0:
                failed.append(issue["url"])
        if failed:
            error("failed to add 'reso: completed' to:\n" + "\n".join(f"  {url}" for url in failed))
    else:
        info_line(f"PR #{pr}: closes no issues, adding 'reso: completed' to the PR")
        run("gh", "pr", "edit", pr, "--add-label", "reso: completed", quiet=True)

    if not branch_deleted:
        sys.exit(1)

if __name__ == "__main__":
    main(sys.argv[1:])
