import pytest
from playwright.sync_api import Page, expect
import os

def test_landing_page_screenshot(page: Page):
    target_url = "http://localhost:3000"
    print(f"Navigating to {target_url}")
    
    try:
        page.goto(target_url, timeout=60000)
    except Exception as e:
        pytest.fail(f"Could not reach {target_url}. Is the server running? Error: {e}")

    # Ensure local images folder exists in the current working directory of the runner
    # We will assume tests are run from backend/ or root. 
    # Let's use an absolute path or relative to the backend folder if possible.
    # The user said "save in loal images folder".
    
    images_dir = os.path.join(os.getcwd(), "images")
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)
        
    screenshot_path = os.path.join(images_dir, "landing_page.png")
    
    # Take screenshot
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")
    
    assert os.path.exists(screenshot_path)
