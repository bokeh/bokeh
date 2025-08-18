#!/usr/bin/env python3
"""
Test script to verify our new settings command implementation
"""
import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    from bokeh.settings import settings, PrioritizedSetting
    from bokeh.command.subcommands.settings import Settings
    from argparse import Namespace
    
    print("✓ Successfully imported settings and Settings command")
    
    # Test the Settings command
    settings_cmd = Settings()
    
    print(f"✓ Settings command name: {settings_cmd.name}")
    print(f"✓ Settings command help: {settings_cmd.help}")
    
    # Test with no arguments (show all settings)
    print("\n" + "="*50)
    print("Testing: bokeh settings")
    print("="*50)
    
    args = Namespace(filter=None, non_default=False)
    settings_cmd.invoke(args)
    
    print("\n" + "="*50)
    print("Testing: bokeh settings --filter server")
    print("="*50)
    
    args = Namespace(filter="server", non_default=False)
    settings_cmd.invoke(args)
    
    print("\n" + "="*50)
    print("Testing: bokeh settings --non-default")
    print("="*50)
    
    args = Namespace(filter=None, non_default=True)
    settings_cmd.invoke(args)
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
