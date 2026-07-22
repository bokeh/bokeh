# External imports
from scripts import milestone


def issue(*, issue_type, labels=()):
    return {
        "kind": "issues",
        "node": {
            "issueType": None if issue_type is None else {"name": issue_type},
            "labels": {"edges": [{"node": {"name": label}} for label in labels]},
            "number": 123,
            "state": "CLOSED",
            "title": "Issue title",
        },
    }


def pull_request(*, labels=()):
    return {
        "kind": "pullRequests",
        "node": {
            "labels": {"edges": [{"node": {"name": label}} for label in labels]},
            "number": 456,
            "state": "MERGED",
            "title": "PR title",
        },
    }


def test_get_type_uses_native_issue_type():
    item = issue(issue_type="Bug", labels=("type: feature",))

    assert milestone.get_type(item) == "bug"


def test_get_type_uses_label_for_pull_request():
    item = pull_request(labels=("type: task",))

    assert milestone.get_type(item) == "task"


def test_check_issue_requires_native_issue_type():
    item = issue(issue_type=None, labels=("type: bug", "reso: completed"))
    problems = []

    milestone.check_issue(item, problems)

    assert problems == ["issue does not have a type: #123 Issue title"]


def test_check_issue_accepts_valid_native_issue_type_without_label():
    item = issue(issue_type="Feature", labels=("reso: completed",))
    problems = []

    milestone.check_issue(item, problems)

    assert problems == []


def test_check_issue_rejects_non_changelog_type():
    item = issue(issue_type="Discussion", labels=("reso: completed",))
    problems = []

    milestone.check_issue(item, problems)

    assert problems == ["issue has an invalid type: #123 Issue title"]


def test_check_pr_still_validates_type_labels():
    item = pull_request(labels=("status: accepted", "type: discussion", "reso: completed"))
    problems = []

    milestone.check_pr(item, problems)

    assert problems == ["PR has an invalid type: #456 PR title"]
