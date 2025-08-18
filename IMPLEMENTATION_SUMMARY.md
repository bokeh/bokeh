# Summary of Changes for Bokeh Issue #14585

## Implementation Overview

I have implemented the requested feature to add a `bokeh` command for displaying settings. This is a two-part implementation as requested:

### Part 1: Enhanced `bokeh info` command
- **File Modified**: `src/bokeh/command/subcommands/info.py`
- **Changes**: Added display of non-default settings at the end of `bokeh info` output

### Part 2: New `bokeh settings` command  
- **File Created**: `src/bokeh/command/subcommands/settings.py`
- **Purpose**: Comprehensive settings management command

## Detailed Changes

### 1. Enhanced `info.py` (`src/bokeh/command/subcommands/info.py`)

**Import Changes**:
```python
# OLD
from bokeh.settings import settings

# NEW  
from bokeh.settings import PrioritizedSetting, settings
```

**Added Methods**:
- `_print_non_default_settings()`: Identifies and displays settings that differ from their defaults
- `_format_value()`: Formats setting values for consistent display

**Enhanced `invoke()` method**:
- Now calls `_print_non_default_settings()` after regular info output
- Shows settings that have been changed from defaults with their environment variables

### 2. New `settings.py` (`src/bokeh/command/subcommands/settings.py`)

**Command Features**:
- **Base command**: `bokeh settings` - Shows all available Bokeh settings
- **Filter option**: `bokeh settings --filter KEYWORD` - Filter settings by keyword
- **Non-default option**: `bokeh settings --non-default` - Show only changed settings

**Key Components**:

#### Command Arguments:
```python
args = (
    ('--filter', Argument(
        metavar="KEYWORD",
        help="Filter settings by keyword (case-insensitive search in name and help text)",
    )),
    ('--non-default', Argument(
        action="store_true", 
        help="Show only settings that have been changed from their default values",
    )),
)
```

#### Core Methods:

1. **`invoke()`**: Main command execution
   - Discovers all `PrioritizedSetting` attributes from settings class
   - Applies filtering based on command-line arguments
   - Displays formatted output

2. **`_print_setting()`**: Detailed setting display
   - Shows environment variable name
   - Current value (with dev mode indicator)
   - Default value and dev default (if different)
   - Type information
   - Wrapped help text

3. **`_format_value()`**: Value formatting
   - Handles None, strings, lists, booleans consistently
   - Ensures readable output format

## Example Output

### `bokeh info` (enhanced)
```
Python version        :  3.11.9 
Bokeh version         :  3.8.0-rc.1
BokehJS static path   :  /path/to/bokeh/server/static
Operating system      :  Windows-10

Non-default settings:
--------------------
  browser               : "chrome" (env: BOKEH_BROWSER)
  log_level             : "debug" (env: BOKEH_LOG_LEVEL)
```

### `bokeh settings`
```
Settings for Bokeh 3.8.0-rc.1
==============================

allowed_ws_origin
-----------------
Environment Variable : BOKEH_ALLOW_WS_ORIGIN
Current Value        : []
Default Value        : []
Type                 : List[String]
Help                 : A comma-separated list of allowed websocket origins for Bokeh server applications.

browser
-------
Environment Variable : BOKEH_BROWSER
Current Value        : none (dev mode)
Default Value        : None
Dev Default Value    : none
Type                 : String
Help                 : The default browser that Bokeh should use to show documents with.
                      Valid values are any of the predefined browser names understood by the
                      Python standard library webbrowser module.
```

### `bokeh settings --filter server`
Shows only settings containing "server" in name or help text.

### `bokeh settings --non-default`
Shows only settings that have been changed from their default values.

## Technical Implementation Details

### Setting Discovery
The implementation uses reflection to find all `PrioritizedSetting` attributes:

```python
setting_items = []
for attr_name in dir(settings):
    attr = getattr(settings.__class__, attr_name, None)
    if isinstance(attr, PrioritizedSetting):
        setting_items.append((attr_name, attr))
```

### Dev Mode Handling
The code correctly handles development mode defaults:

```python
if settings.dev and dev_default_value is not None:
    is_default = current_value == dev_default_value
else:
    is_default = current_value == default_value
```

### Text Formatting
Help text is properly wrapped for readability:

```python
wrapper = textwrap.TextWrapper(
    width=80,
    initial_indent=" ",
    subsequent_indent="                      "
)
```

## Integration with Existing Code

The new command integrates seamlessly with Bokeh's existing command infrastructure:

1. **Auto-discovery**: The command is automatically discovered by `subcommands.__init__.py`
2. **Consistent API**: Follows the same pattern as other subcommands (inherit from `Subcommand`)
3. **Standard arguments**: Uses Bokeh's `Argument` class for command-line options
4. **Settings integration**: Uses the existing `PrioritizedSetting` system

## Benefits

1. **User-friendly**: Easy to discover what settings are available
2. **Debugging**: Quickly see which settings have been modified
3. **Documentation**: Each setting shows its help text and type
4. **Filtering**: Can focus on relevant settings
5. **Environment integration**: Shows environment variable names

This implementation fully addresses the GitHub issue #14585 requirements while maintaining consistency with Bokeh's existing codebase and command patterns.
