#!/usr/bin/env python3
"""Browser smoke/login test for the malaria workspace.

Usage examples:
  python scripts/malaria_browser_smoke.py
  python scripts/malaria_browser_smoke.py --username TEAM1 --password 'secret'
  MALARIA_USERNAME=TEAM1 MALARIA_PASSWORD=secret python scripts/malaria_browser_smoke.py
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


DEFAULT_URL = "http://72.61.170.115:9200/malaria/login"


@dataclass
class TestResult:
    ok: bool
    message: str


def run_test(base_url: str, username: str | None, password: str | None, headless: bool) -> TestResult:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        page = browser.new_page()
        try:
            page.goto(base_url, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_selector("text=Malaria Annual Reporting", timeout=10_000)
            page.wait_for_selector("text=Email or Username", timeout=10_000)
            page.wait_for_selector("text=Continue to workspace", timeout=10_000)

            # If no credentials are provided, only run page smoke checks.
            if not username or not password:
                return TestResult(
                    ok=True,
                    message="Smoke test passed: malaria login page loaded and key elements are present.",
                )

            page.get_by_placeholder("Your ComMicPlan email or username").fill(username)
            page.get_by_placeholder("Enter your password").fill(password)
            page.get_by_role("button", name="Continue to workspace").click()

            # Successful login should navigate away from /login.
            page.wait_for_timeout(2_000)
            page.wait_for_load_state("domcontentloaded")
            current_url = page.url
            if "/login" not in current_url:
                return TestResult(ok=True, message=f"Login test passed: navigated to {current_url}")

            # If still on login, try to detect an error toast/message.
            body_text = page.locator("body").inner_text(timeout=5_000)
            if "Login failed" in body_text or "Invalid" in body_text or "error" in body_text.lower():
                return TestResult(ok=False, message="Login test failed: credentials were rejected by the application.")

            return TestResult(ok=False, message="Login test failed: still on login page after submit.")

        except PlaywrightTimeoutError as exc:
            return TestResult(ok=False, message=f"Timeout while testing page: {exc}")
        except Exception as exc:  # pylint: disable=broad-except
            return TestResult(ok=False, message=f"Unexpected error: {exc}")
        finally:
            browser.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Malaria browser smoke/login test")
    parser.add_argument("--url", default=DEFAULT_URL, help="Login page URL")
    parser.add_argument("--username", default=os.getenv("MALARIA_USERNAME"), help="ComMicPlan username/email")
    parser.add_argument("--password", default=os.getenv("MALARIA_PASSWORD"), help="ComMicPlan password")
    parser.add_argument("--headed", action="store_true", help="Run with visible browser window")
    args = parser.parse_args()

    result = run_test(
        base_url=args.url,
        username=args.username,
        password=args.password,
        headless=not args.headed,
    )

    print(result.message)
    return 0 if result.ok else 1


if __name__ == "__main__":
    sys.exit(main())
