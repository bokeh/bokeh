from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest

from bokeh.embed.resources import (
    ResolvedResource,
    ResolvedResources,
    ResourceRequirements,
)
from bokeh.resources import Resources

# Module under test
import bokeh.io.jupyter as m # isort:skip


playwright = pytest.importorskip("playwright.sync_api")
_VERSION = "4.0.0"


@pytest.fixture(scope="module")
def portable_browser() -> Iterator[Any]:
    with playwright.sync_playwright() as manager:
        browser = manager.chromium.launch()
        yield browser
        browser.close()


@pytest.fixture
def page(portable_browser: Any) -> Iterator[Any]:
    page = portable_browser.new_page()
    yield page
    page.close()


def _resource_javascript(*assets: ResolvedResource, dependencies: list[str] | None = None,
        components: tuple[str, ...] = ("bokeh/core",), load_timeout: int = 1_000) -> tuple[Any, str]:
    resolved = ResolvedResources(
        ResourceRequirements(components),
        Resources(mode="inline"),
        _VERSION,
        assets,
    )
    payload = m.resource_payload(resolved, load_timeout, dependencies=dependencies)
    return payload, m.resource_javascript(payload, resolved.assets)


def _start_page(page: Any, resource_id: str | None = None) -> None:
    fallback = "" if resource_id is None else f"""
      <div data-bokeh-notebook-static-fallback data-bokeh-resource-id="{resource_id}">
        <strong>Portable Bokeh output</strong>
        <p>Waiting for resources</p>
      </div>
    """
    page.set_content(f"<!doctype html><html><head></head><body>{fallback}</body></html>")
    page.evaluate("""
      () => {
        window.__resourceEvents = []
        window.__ensureCalls = []
        for (const kind of ["complete", "error"]) {
          window.addEventListener(`bokeh:resources-${kind}`, (event) => {
            window.__resourceEvents.push({kind, detail: event.detail})
          })
        }
      }
    """)


def _wait_for_state(page: Any, resource_id: str, state: str) -> None:
    page.wait_for_function(
        """
        ({resourceId, state}) => [...document.head.querySelectorAll("meta[data-bokeh-notebook-resource]")]
          .some((owner) => owner.dataset.bokehNotebookResource === resourceId &&
            owner.dataset.bokehResourceState === state)
        """,
        arg={"resourceId": resource_id, "state": state},
        timeout=5_000,
    )


def test_portable_resources_load_inline_core_and_preserve_additive_asset_metadata(page: Any) -> None:
    core = ResolvedResource(
        "script",
        content="""
          /* BEGIN bokeh.js */
          window.Bokeh = {
            version: "4.0.0",
            resource_loader: {
              ensure: async (...args) => window.__ensureCalls.push(args),
            },
          }
        """,
        integrity="sha384-core",
        crossorigin="anonymous",
        nonce="core-nonce",
    )
    script = ResolvedResource(
        "script",
        url="https://assets.example/widget.js",
        integrity="sha384-widget",
        crossorigin="use-credentials",
        nonce="widget-nonce",
        module=True,
    )
    style = ResolvedResource("style", content=".bk-test {}", nonce="style-nonce")
    payload, javascript = _resource_javascript(
        core,
        script,
        style,
        components=("bokeh/core", "bokeh/widgets"),
    )
    _start_page(page)

    page.add_script_tag(content=javascript)
    _wait_for_state(page, payload["resource_id"], "loaded")

    state = page.evaluate(
        """
        (resourceId) => {
          const owner = [...document.head.querySelectorAll("meta[data-bokeh-notebook-resource]")]
            .find((candidate) => candidate.dataset.bokehNotebookResource === resourceId)
          const core = document.head.querySelector("script[data-bokeh-core-version]")
          return {
            ownerState: owner?.dataset.bokehResourceState,
            core: {
              version: core?.dataset.bokehCoreVersion,
              state: core?.dataset.bokehResourceState,
              type: core?.type,
              integrity: core?.getAttribute("integrity"),
              crossorigin: core?.getAttribute("crossorigin"),
              nonce: core?.nonce,
            },
            calls: window.__ensureCalls,
            events: window.__resourceEvents,
          }
        }
        """,
        payload["resource_id"],
    )

    assert state["ownerState"] == "loaded"
    assert state["core"] == {
        "version": _VERSION,
        "state": "loaded",
        "type": "text/javascript",
        "integrity": "sha384-core",
        "crossorigin": "anonymous",
        "nonce": "core-nonce",
    }
    assert state["calls"] == [[
        {"components": ["bokeh/core", "bokeh/widgets"], "extensions": []},
        {
            "mode": "resolved",
            "assets": [
                {
                    "kind": "script",
                    "url": "https://assets.example/widget.js",
                    "integrity": "sha384-widget",
                    "crossorigin": "use-credentials",
                    "nonce": "widget-nonce",
                    "module": True,
                },
                {"kind": "style", "content": ".bk-test {}", "nonce": "style-nonce"},
            ],
            "retry": True,
        },
        _VERSION,
    ]]
    assert state["events"] == [{
        "kind": "complete",
        "detail": {
            "resource_id": payload["resource_id"],
            "artifact_ids": [artifact["id"] for artifact in payload["artifacts"]],
        },
    }]


def test_portable_resources_wait_for_dependencies_in_order(page: Any) -> None:
    base, base_javascript = _resource_javascript(components=("bokeh/core",))
    dependent, dependent_javascript = _resource_javascript(
        dependencies=[base["resource_id"]],
        components=("bokeh/widgets",),
    )
    _start_page(page)
    page.evaluate(
        """
        (version) => {
          window.Bokeh = {
            version,
            resource_loader: {
              ensure: async (requirements) => window.__ensureCalls.push(requirements.components),
            },
          }
        }
        """,
        _VERSION,
    )

    page.add_script_tag(content=dependent_javascript)
    _wait_for_state(page, dependent["resource_id"], "loading")
    assert page.evaluate("window.__ensureCalls") == []

    page.add_script_tag(content=base_javascript)
    _wait_for_state(page, dependent["resource_id"], "loaded")

    assert page.evaluate("window.__ensureCalls") == [["bokeh/core"], ["bokeh/widgets"]]


def test_portable_resources_deduplicate_concurrent_owners(page: Any) -> None:
    payload, javascript = _resource_javascript()
    _start_page(page)
    page.evaluate(
        """
        (version) => {
          window.Bokeh = {
            version,
            resource_loader: {
              ensure: (...args) => {
                window.__ensureCalls.push(args)
                return new Promise((resolve) => window.__releaseEnsure = resolve)
              },
            },
          }
        }
        """,
        _VERSION,
    )

    page.add_script_tag(content=javascript)
    page.wait_for_function("window.__ensureCalls.length === 1")
    page.add_script_tag(content=javascript)
    assert page.locator(
        f'meta[data-bokeh-notebook-resource="{payload["resource_id"]}"]',
    ).count() == 1

    page.evaluate("window.__releaseEnsure()")
    page.wait_for_function(
        """
        (resourceId) => window.__resourceEvents.filter(
          (event) => event.kind === "complete" && event.detail.resource_id === resourceId,
        ).length === 2
        """,
        arg=payload["resource_id"],
    )

    assert page.evaluate("window.__ensureCalls.length") == 1
    assert page.locator(
        f'meta[data-bokeh-notebook-resource="{payload["resource_id"]}"]',
    ).count() == 1


def test_portable_resources_report_dependency_timeout(page: Any) -> None:
    payload, javascript = _resource_javascript(dependencies=["missing-resource"], load_timeout=100)
    _start_page(page, payload["resource_id"])

    page.add_script_tag(content=javascript)
    _wait_for_state(page, payload["resource_id"], "failed")

    state = page.evaluate(
        """
        (resourceId) => {
          const owner = [...document.head.querySelectorAll("meta[data-bokeh-notebook-resource]")]
            .find((candidate) => candidate.dataset.bokehNotebookResource === resourceId)
          const fallback = document.querySelector("[data-bokeh-notebook-static-fallback]")
          return {
            ownsPendingResource: owner?.hasAttribute("data-bokeh-resource"),
            ownerError: owner?.dataset.bokehResourceError,
            fallbackError: fallback?.dataset.bokehResourceError,
            title: fallback?.querySelector("strong")?.textContent,
            description: fallback?.querySelector("p")?.textContent,
            events: window.__resourceEvents,
          }
        }
        """,
        payload["resource_id"],
    )
    message = "Resource dependency missing-resource was not published within 100 ms"
    assert state["ownsPendingResource"] is False
    assert state["ownerError"] == message
    assert state["fallbackError"] == message
    assert state["title"] == "Bokeh resources failed to load"
    assert state["description"] == message
    assert state["events"][0]["kind"] == "error"
    assert state["events"][0]["detail"]["error"]["message"] == message


def test_portable_resources_retry_a_failed_owner(page: Any) -> None:
    payload, javascript = _resource_javascript(ResolvedResource("style", content=".retry {}"))
    _start_page(page)
    page.evaluate("(version) => window.Bokeh = {version}", _VERSION)

    page.add_script_tag(content=javascript)
    _wait_for_state(page, payload["resource_id"], "failed")
    page.evaluate(
        """
        () => window.Bokeh.resource_loader = {
          ensure: async (...args) => window.__ensureCalls.push(args),
        }
        """,
    )
    page.add_script_tag(content=javascript)
    _wait_for_state(page, payload["resource_id"], "loaded")

    events = page.evaluate("window.__resourceEvents.map(({kind}) => kind)")
    assert events == ["error", "complete"]
    assert page.evaluate("window.__ensureCalls.length") == 1
    assert page.locator(
        f'meta[data-bokeh-notebook-resource="{payload["resource_id"]}"]',
    ).count() == 1


def test_portable_resources_reject_an_active_incompatible_bokeh(page: Any) -> None:
    payload, javascript = _resource_javascript()
    _start_page(page, payload["resource_id"])
    page.evaluate(
        """
        () => window.Bokeh = {
          version: "3.9.0",
          resource_loader: {ensure: async () => undefined},
        }
        """,
    )

    page.add_script_tag(content=javascript)
    _wait_for_state(page, payload["resource_id"], "failed")

    message = page.locator("[data-bokeh-notebook-static-fallback]").get_attribute(
        "data-bokeh-resource-error",
    )
    assert message == "BokehJS 3.9.0 is already active. Refusing to load incompatible 4.0.0"
