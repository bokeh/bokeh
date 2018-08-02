// Just a dumb key/value record for collecting arbitrary info for tests
export const results: Record<string, any> = {}

// Selenium has race conditions that make it difficult to read out the
// results structure. This function deletes/creates a div that can act as
// a semaphore. Tests should wait for the previous div to be stale, then
// find the new div. At that point the results should be available
function _update_test_div(): void {
  const body = document.getElementsByTagName("body")[0]
  const col = document.getElementsByClassName("bokeh-test-div");

  if (col.length == 1)
    body.removeChild(col[0])
    delete col[0]

  const box = document.createElement("div")
  box.classList.add("bokeh-test-div")
  box.style.display = "none"
  body.insertBefore(box, body.firstChild)
}

export function init(): void {
  _update_test_div()
}

export function record(key: string, value: any): void {
  results[key] = value
  _update_test_div()
}

export function count(key: string): void {
  if (results[key] == undefined)
    results[key] = 0
  results[key] += 1
  _update_test_div()
}

export function clear(): void {
  for (const prop of Object.keys(results))
    delete results[prop]
  _update_test_div()
}
