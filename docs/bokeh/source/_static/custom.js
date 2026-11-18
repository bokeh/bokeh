window.addEventListener("DOMContentLoaded", function () {
  const gallery = document.querySelector(".bk-gallery-tabs")
  if (gallery != null) {
    const selectTab = () => {
      const label = document.getElementById(window.location.hash.slice(1))
      if (label?.matches("label.sd-tab-label") && gallery.contains(label)) {
        label.control.checked = true
      } else {
        gallery.querySelector('input[type="radio"]').checked = true
      }
    }
    const linkTab = (label) => {
      if (label?.id && window.location.hash !== `#${label.id}`) {
        window.history.pushState(null, "", `#${label.id}`)
      }
    }
    gallery.addEventListener("change", (event) => linkTab(event.target.labels?.[0]))
    gallery.addEventListener("click", (event) => linkTab(event.target.closest("label.sd-tab-label")))
    window.addEventListener("hashchange", selectTab)
    selectTab()
  }

  const filter = document.querySelector(".bk-example-filter")
  if (filter != null) {
    const input = filter.querySelector("#bk-example-query")
    const topicFilter = filter.querySelector("#bk-example-topic")
    const typeFilter = filter.querySelector("#bk-example-type")
    const count = filter.querySelector("[role=status]")
    const entries = Array.from(document.querySelectorAll(".bk-example-entry"), (element) => {
      const heading = element.querySelector(".bk-example-heading")
      const title = heading.querySelector("p").textContent.trim()
      const topics = Array.from(element.querySelectorAll(".bk-example-topic"), (topic) => topic.textContent.trim())
      const type = element.querySelector(".bk-example-type").textContent.trim()
      const overview = element.querySelector(".bk-example-summary")
      const description = element.querySelector(".bk-example-details")
      const sourcePath = decodeURIComponent(element.querySelector(".bk-example-links a.external").pathname)
      const filename = sourcePath.slice(sourcePath.indexOf("/examples/") + 1)
      const text = [heading.textContent, ...topics, overview?.textContent, description?.textContent, filename].join(" ").toLowerCase()
      if (description != null) {
        const disclosure = document.createElement("details")
        const summary = document.createElement("summary")
        summary.textContent = "Details"
        summary.setAttribute("aria-label", `Details for ${title}`)
        description.replaceWith(disclosure)
        disclosure.append(summary, description)
      }
      return {element, topics, type, text}
    })
    for (const [select, key] of [[topicFilter, "topics"], [typeFilter, "type"]]) {
      const values = new Set(entries.flatMap((entry) => entry[key]))
      for (const value of Array.from(values).sort((a, b) => a.localeCompare(b))) {
        select.add(new Option(value, value))
      }
    }
    const update = () => {
      const terms = input.value.toLowerCase().trim().split(/\s+/)
      let matches = 0
      for (const {element, topics, type, text} of entries) {
        const visible = (!topicFilter.value || topics.includes(topicFilter.value))
          && (!typeFilter.value || typeFilter.value === type)
          && terms.every((term) => text.includes(term))
        element.hidden = !visible
        matches += Number(visible)
      }
      count.textContent = matches ? `${matches} of ${entries.length} examples` : "No matching examples"
    }
    filter.hidden = false
    filter.addEventListener("input", update)
    filter.addEventListener("submit", (event) => event.preventDefault())
    filter.addEventListener("reset", () => requestAnimationFrame(update))
    update()
  }
})

// Sphinx can return null for an empty search preview, but its caller appends a Node.
window.addEventListener('DOMContentLoaded', function () {
  if (typeof Search !== "undefined") {
    const makeSearchSummary = Search.makeSearchSummary.bind(Search)
    Search.makeSearchSummary = (...args) => makeSearchSummary(...args) ?? document.createDocumentFragment()
  }
})

// Simplify the sidebar TOC on the releases page
window.addEventListener('DOMContentLoaded', function () {
  if (window.location.pathname.endsWith("releases.html")) {
    [].forEach.call(document.querySelectorAll('.toc-h3'), function (el) {
      el.parentElement.remove()
    });
  }
})

// Route anchors from the former module-sized model reference pages to the
// corresponding one-class-per-page reference. URL fragments are not sent to
// the server, so this compatibility behavior has to run in the browser.
window.addEventListener('DOMContentLoaded', function () {
  const marker = "/docs/reference/models/"
  const markerIndex = window.location.pathname.indexOf(marker)

  if (markerIndex == -1) {
    return
  }

  const hash = window.location.hash
  const match = hash.match(/^#bokeh\.models(?:\.[a-z_][a-z0-9_]*)*\.([A-Z][A-Za-z0-9_]*)(\..*)?$/)
  const redirect = document.querySelector("[data-bokeh-model-redirect]")
  const modelsRoot = window.location.pathname.slice(0, markerIndex + marker.length)
  const relativePath = window.location.pathname.slice(modelsRoot.length)
  const classPage = relativePath.match(/^(?:[a-z_][a-z0-9_]*\/)+[A-Z][A-Za-z0-9_]*\/(?:index\.html)?$/)

  if (classPage == null && (redirect != null || match != null)) {
    const className = redirect?.dataset.bokehModelRedirect ?? match[1]
    const documentPath = relativePath.replace(/\.html$/, "")
    const categoryPath = redirect == null ? documentPath : documentPath.replace(/\/[^/]+$/, "")
    window.location.replace(modelsRoot + categoryPath + "/" + className + "/" + window.location.search + hash)
    return
  }

  // Older links sometimes used the implementation module in the object ID.
  // Model pages use the stable top-level bokeh.models namespace instead.
  if (match != null && document.getElementById(hash.slice(1)) == null) {
    const normalizedHash = "#bokeh.models." + match[1] + (match[2] ?? "")
    const target = document.getElementById(normalizedHash.slice(1))
    if (target != null) {
      window.history.replaceState(null, "", normalizedHash)
      target.scrollIntoView()
    }
  }
})
