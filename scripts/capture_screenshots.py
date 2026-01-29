#!/usr/bin/env python3
"""
Capture screenshots of the movie recommender UI for the README.
Run with the Flask app already running on http://localhost:5001
Usage: python scripts/capture_screenshots.py
"""
import os
import sys
import time

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Install playwright first: pip install playwright && playwright install chromium")
    sys.exit(1)

BASE_URL = "http://localhost:5001"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "screenshots")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1200, "height": 900})
        try:
            page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(f"Could not load {BASE_URL}: {e}")
            print("Make sure the Flask app is running: python app.py")
            browser.close()
            sys.exit(1)

        time.sleep(1)

        # 1. Main view (initial state)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "main.png"), full_page=True)
        print("Saved screenshots/main.png")

        # 2. Search / top movies: focus search, wait for results
        page.click("#movieSearch")
        time.sleep(2)  # allow top-movies API to load
        page.screenshot(path=os.path.join(OUTPUT_DIR, "search.png"), full_page=True)
        print("Saved screenshots/search.png")

        # 3. Rating modal: click first search result if any
        first_result = page.query_selector(".search-result-item[data-movie-id]")
        if first_result:
            first_result.click()
            time.sleep(0.5)
            page.screenshot(path=os.path.join(OUTPUT_DIR, "rating-modal.png"), full_page=True)
            print("Saved screenshots/rating-modal.png")
            # Close modal so we don't leave overlay on next steps
            page.keyboard.press("Escape")
            time.sleep(0.2)

        browser.close()

    print("Done. Screenshots saved to", OUTPUT_DIR)


if __name__ == "__main__":
    main()
