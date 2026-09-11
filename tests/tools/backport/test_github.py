# Standard library imports
import subprocess
import unittest
from unittest.mock import patch

# Bokeh imports
from tools.backport import github


class GitHubCLITests(unittest.TestCase):
    def test_sends_json_requests_through_gh_api(self) -> None:
        completed = subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout='{"merged": true}',
            stderr="",
        )
        with patch("tools.backport.github.subprocess.run", return_value=completed) as run:
            result = github.GitHubAPI().request(
                "PUT",
                "/repos/bokeh/bokeh/pulls/15264/merge",
                json={"merge_method": "rebase"},
            )

        self.assertEqual(result, {"merged": True})
        run.assert_called_once_with(
            [
                "gh",
                "api",
                "--method",
                "PUT",
                "repos/bokeh/bokeh/pulls/15264/merge",
                "--input",
                "-",
            ],
            input='{"merge_method": "rebase"}',
            text=True,
            capture_output=True,
            check=False,
        )

    def test_allows_an_expected_http_error(self) -> None:
        completed = subprocess.CompletedProcess(
            args=[],
            returncode=1,
            stdout='{"message": "Not Found"}',
            stderr="gh: Not Found (HTTP 404)\n",
        )
        with patch("tools.backport.github.subprocess.run", return_value=completed):
            result = github.GitHubAPI().request(
                "DELETE",
                "/repos/bokeh/bokeh/git/refs/heads/backport/3.9.2",
                expected=(204, 404),
            )

        self.assertEqual(result, {"message": "Not Found"})
