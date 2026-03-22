"""
Sherlock Service — Username OSINT search across 350+ sites.
Uses sherlock-project library to find username presence on social platforms.
"""

import asyncio
import json
import subprocess
import os
import tempfile
from typing import List, Dict


async def search_username(username: str) -> List[Dict[str, str]]:
    """
    Run Sherlock search for a given username.
    Returns list of {site_name, url, status} dictionaries.
    """
    results = []

    try:
        # Run sherlock in a subprocess to avoid blocking
        result = await asyncio.get_event_loop().run_in_executor(
            None, _run_sherlock_sync, username
        )
        results = result
    except Exception as e:
        print(f"❌ Sherlock error: {e}")
        # Fallback: manual check popular sites
        results = await _fallback_search(username)

    return results


def _run_sherlock_sync(username: str) -> List[Dict[str, str]]:
    """Synchronous Sherlock execution."""
    results = []
    
    try:
        # Create a temporary directory for output
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_file = os.path.join(tmp_dir, f"{username}.txt")
            
            # Run sherlock CLI
            process = subprocess.run(
                [
                    "sherlock",
                    username,
                    "--output", output_file,
                    "--timeout", "10",
                    "--print-found",
                    "--no-color",
                ],
                capture_output=True,
                text=True,
                timeout=120,  # 2 minute max
                cwd=tmp_dir,
            )
            
            # Parse output
            output = process.stdout
            if output:
                for line in output.strip().split("\n"):
                    line = line.strip()
                    if not line or line.startswith("[") and "*" in line:
                        continue
                    if ": http" in line:
                        parts = line.split(": ", 1)
                        if len(parts) == 2:
                            site_name = parts[0].strip("[+] ").strip("[*] ").strip()
                            url = parts[1].strip()
                            results.append({
                                "site_name": site_name,
                                "url": url,
                                "status": "found"
                            })
            
            # Also try reading the output file
            if os.path.exists(output_file) and not results:
                with open(output_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("http"):
                            results.append({
                                "site_name": _extract_site_name(line),
                                "url": line,
                                "status": "found"
                            })
                            
    except subprocess.TimeoutExpired:
        print("⏰ Sherlock search timed out")
    except FileNotFoundError:
        print("❌ Sherlock not installed, using fallback")
        results = _fallback_search_sync(username)
    except Exception as e:
        print(f"❌ Sherlock subprocess error: {e}")
        results = _fallback_search_sync(username)
    
    return results


def _extract_site_name(url: str) -> str:
    """Extract site name from URL."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "")
        return domain.split(".")[0].capitalize()
    except:
        return "Unknown"


def _fallback_search_sync(username: str) -> List[Dict[str, str]]:
    """Fallback: check common sites manually."""
    import urllib.request
    
    sites = {
        "GitHub": f"https://github.com/{username}",
        "Twitter": f"https://twitter.com/{username}",
        "Instagram": f"https://instagram.com/{username}",
        "Reddit": f"https://reddit.com/user/{username}",
        "TikTok": f"https://tiktok.com/@{username}",
        "YouTube": f"https://youtube.com/@{username}",
        "LinkedIn": f"https://linkedin.com/in/{username}",
        "Pinterest": f"https://pinterest.com/{username}",
        "Twitch": f"https://twitch.tv/{username}",
        "Medium": f"https://medium.com/@{username}",
        "DevTo": f"https://dev.to/{username}",
        "HackerNews": f"https://news.ycombinator.com/user?id={username}",
        "Keybase": f"https://keybase.io/{username}",
        "GitLab": f"https://gitlab.com/{username}",
        "Steam": f"https://steamcommunity.com/id/{username}",
        "Spotify": f"https://open.spotify.com/user/{username}",
        "SoundCloud": f"https://soundcloud.com/{username}",
        "Flickr": f"https://flickr.com/people/{username}",
        "Telegram": f"https://t.me/{username}",
        "VK": f"https://vk.com/{username}",
    }
    
    results = []
    for site_name, url in sites.items():
        try:
            req = urllib.request.Request(url, method="HEAD")
            req.add_header("User-Agent", "Mozilla/5.0")
            response = urllib.request.urlopen(req, timeout=5)
            if response.status == 200:
                results.append({
                    "site_name": site_name,
                    "url": url,
                    "status": "found"
                })
        except:
            pass
    
    return results


async def _fallback_search(username: str) -> List[Dict[str, str]]:
    """Async fallback search."""
    return await asyncio.get_event_loop().run_in_executor(
        None, _fallback_search_sync, username
    )
