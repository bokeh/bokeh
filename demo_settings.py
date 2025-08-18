"""
Demonstration of the new bokeh settings command implementation

This shows what the command will do when implemented.
"""

# Simulate the key parts of our implementation
class MockPrioritizedSetting:
    def __init__(self, name, env_var, default=None, dev_default=None, convert=str, help=""):
        self.name = name
        self._env_var = env_var
        self._default = default
        self._dev_default = dev_default
        self.help = help
        self.convert_type = "String"  # Simplified for demo
    
    def __call__(self):
        # Return the default for demo
        return self._default

class MockSettings:
    def __init__(self):
        self.dev = False
    
    # Sample settings like those in real Bokeh
    browser = MockPrioritizedSetting("browser", "BOKEH_BROWSER", default=None, dev_default="none", 
                                   help="The default browser that Bokeh should use to show documents with.")
    
    minified = MockPrioritizedSetting("minified", "BOKEH_MINIFIED", default=True, dev_default=False,
                                    help="Whether Bokeh should use minified BokehJS resources.")
    
    log_level = MockPrioritizedSetting("log_level", "BOKEH_LOG_LEVEL", default="info", dev_default="debug",
                                     help="Set the log level for JavaScript BokehJS code.")
    
    allowed_ws_origin = MockPrioritizedSetting("allowed_ws_origin", "BOKEH_ALLOW_WS_ORIGIN", default=[],
                                             help="A comma-separated list of allowed websocket origins.")

def demo_settings_command():
    """Demo what 'bokeh settings' would output"""
    print("Settings for Bokeh 3.8.0-rc.1")
    print("=" * 30)
    print()
    
    # Get all settings (in real implementation, this uses reflection)
    mock_settings = MockSettings()
    settings_list = [
        ("allowed_ws_origin", mock_settings.allowed_ws_origin),
        ("browser", mock_settings.browser),
        ("log_level", mock_settings.log_level),
        ("minified", mock_settings.minified),
    ]
    
    for i, (name, setting) in enumerate(settings_list):
        if i > 0:
            print()
        
        print(name)
        print("-" * len(name))
        print(f"Environment Variable : {setting._env_var}")
        print(f"Current Value        : {setting()}")
        print(f"Default Value        : {setting._default}")
        if setting._dev_default is not None:
            print(f"Dev Default Value    : {setting._dev_default}")
        print(f"Type                 : {setting.convert_type}")
        print(f"Help                 : {setting.help}")

def demo_settings_filter():
    """Demo what 'bokeh settings --filter browser' would output"""
    print("\nSettings for Bokeh 3.8.0-rc.1")
    print("=" * 30)
    print()
    
    # Only show browser setting
    mock_settings = MockSettings()
    setting = mock_settings.browser
    name = "browser"
    
    print(name)
    print("-" * len(name))
    print(f"Environment Variable : {setting._env_var}")
    print(f"Current Value        : {setting()}")
    print(f"Default Value        : {setting._default}")
    print(f"Dev Default Value    : {setting._dev_default}")
    print(f"Type                 : {setting.convert_type}")
    print(f"Help                 : {setting.help}")

def demo_info_with_settings():
    """Demo what 'bokeh info' would show with our changes"""
    print("Python version        :  3.11.9 (main, Aug 18 2025, 12:00:00)")
    print("Bokeh version         :  3.8.0-rc.1")
    print("BokehJS static path   :  /path/to/bokeh/server/static")
    print("Operating system      :  Windows-10")
    print()
    print("Non-default settings:")
    print("--------------------")
    print("  browser               : \"chrome\" (env: BOKEH_BROWSER)")
    print("  log_level             : \"debug\" (env: BOKEH_LOG_LEVEL)")

if __name__ == "__main__":
    print("=== DEMO: bokeh settings ===")
    demo_settings_command()
    
    print("\n\n=== DEMO: bokeh settings --filter browser ===")
    demo_settings_filter()
    
    print("\n\n=== DEMO: bokeh info (with our enhancement) ===")
    demo_info_with_settings()
