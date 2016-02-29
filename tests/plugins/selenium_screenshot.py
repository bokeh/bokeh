import time

def get_selenium_screenshot(selenium, url, screenshot_path, wait, width=1000, height=1000):
    selenium.get(url)
    selenium.set_window_size(width=width, height=height)
    time.sleep(wait)
    selenium.get_screenshot_as_file(screenshot_path)
