#!/usr/bin/env python3
"""
Simple test to verify settings import
"""
import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    # Mock the version for testing
    import sys
    class MockMetadata:
        @staticmethod
        def version(package):
            return "3.8.0-rc.1"
    
    sys.modules['importlib.metadata'] = MockMetadata()
    
    from bokeh.settings import settings, PrioritizedSetting
    print("✓ Successfully imported settings")
    
    # Test that our Settings subcommand can be imported
    from bokeh.command.subcommands.settings import Settings
    print("✓ Successfully imported Settings command")
    
    # Create the command
    settings_cmd = Settings()
    print(f"✓ Command name: {settings_cmd.name}")
    print(f"✓ Command help: {settings_cmd.help}")
    
    # Test the helper method
    test_value = "test_string"
    formatted = settings_cmd._format_value(test_value)
    print(f"✓ Format value test: '{test_value}' -> '{formatted}'")
    
    print("\n✓ All basic tests passed!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
