# Scrollable Tabs Feature - Issue #14417

## Summary
Added horizontal and vertical scrolling support for tab headers when displaying a large number of tabs.

## Problem
In Bokeh 3.6+, when creating layouts with many tabs (e.g., >10-15 tabs), the tab headers would extend beyond the viewport, causing:
- Plots not fitting on screen
- Browser-level horizontal scrollbar appearing
- Content being stretched or cut off

This feature existed in Bokeh 2.4 but was lost in later versions.

## Solution
Restored scrolling functionality by:

1. **Added wrapper element** (`bk-headers-wrapper`) around tab headers in the DOM structure
2. **Applied CSS overflow** to enable native browser scrolling:
   - `overflow-x: auto` for horizontal tabs (`tabs_location="above"` or `"below"`)
   - `overflow-y: auto` for vertical tabs (`tabs_location="left"` or `"right"`)

## Implementation Details

### Files Modified

#### TypeScript (BokehJS)
- `bokehjs/src/lib/models/layouts/tabs.ts`
  - Added `headers_wrapper_el` property to `TabsView`
  - Modified `render()` to create wrapper element
  - Modified `_update_headers()` to append headers to wrapper

#### CSS/LESS
- `bokehjs/src/less/tabs.less`
  - Added `.bk-headers-wrapper` styles with flex layout and overflow properties
  - Split styling between container (`.bk-header`) and scrollable wrapper

### Tests Added

#### Unit Tests
- `bokehjs/test/unit/models/layouts/tabs.ts`
  - Test for wrapper element presence in DOM
  - Test for proper parent-child relationship
  - Test for overflow styles
  - Test for scrolling when many tabs exceed container width

#### Integration Tests
- `bokehjs/test/integration/regressions.ts`
  - Test for horizontal scrolling with 20 tabs
  - Test for vertical scrolling with 15 tabs
  - Verification of DOM structure and scroll behavior

### Documentation
- `docs/bokeh/source/docs/user_guide/interaction/widgets.rst`
  - Added note about automatic scrolling for large numbers of tabs

### Examples
- `examples/basic/layouts/tabs_scrollable.py`
  - Demo with 20 tabs showing scrolling functionality

## Usage Example

```python
from bokeh.models import TabPanel
from bokeh.plotting import figure, show
from bokeh.models.layouts import Tabs

# Create many tabs
tab_panels = []
for i in range(20):
    p = figure(width=400, height=400)
    p.circle([1, 2, 3], [4, 5, 6], size=10)
    tab_panels.append(TabPanel(child=p, title=f"Tab {i+1}"))

# Tabs will automatically scroll when headers exceed width
tabs = Tabs(tabs=tab_panels, width=800)
show(tabs)
```

## Benefits
- ✅ Minimal code changes (backward compatible)
- ✅ Native browser scrolling (no additional JavaScript logic)
- ✅ Works for all tab orientations (above/below/left/right)
- ✅ Maintains accessibility and keyboard navigation
- ✅ No breaking changes to existing code

## Testing
Run the tests with:
```bash
cd bokehjs
node make test:unit:models/layouts/tabs
node make test:integration:regressions
```

## Related Issues
- Fixes #14417: Cannot scroll or wrap large number of tabs
- Related to #14303: Previous discussion about tab header wrapping
