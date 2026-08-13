"""Updates the Word of the Day (WOTD) history with a new word and its definition.

Validates the word, fetches a definition, and appends it to the history file.
Intended to run from the `process_word_submission` GitHub Actions workflow.

Also supports a backfill mode that re-attempts any entry whose definition is
still the placeholder:

    python scripts/update_word_otd.py --backfill
"""

import argparse
import csv
import json
import os
import sys
import time
from datetime import date

import requests

VALID_WORDS_PATH = "./data/valid_words_frequencies.csv"
WOTD_HISTORY_PATH = "./data/word_otd.json"

MISSING_DEFINITION = "No definition found."

# Transient failures against a free public API are the norm, not the exception --
# six entries in the history were permanently written as placeholders because a
# single request happened to fail. Retry with backoff, then try a second source.
REQUEST_TIMEOUT = 15
MAX_ATTEMPTS = 3
BACKOFF_SECONDS = 2
USER_AGENT = "wordle-word-finder (https://github.com/raghav-awasty/wordle-word-finder)"


def _fetch_json(url):
    """GET a URL and return parsed JSON, retrying on transient failures.

    Returns None if every attempt fails. A 404 is treated as a definitive
    "no such word" and is not retried.
    """
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = requests.get(
                url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT}
            )
            if response.status_code == 404:
                print(f"  {url} -> 404 (no entry)")
                return None
            response.raise_for_status()
            return response.json()
        except (requests.exceptions.RequestException, ValueError) as exc:
            print(f"  attempt {attempt}/{MAX_ATTEMPTS} failed for {url}: {exc}")
            if attempt < MAX_ATTEMPTS:
                time.sleep(BACKOFF_SECONDS * attempt)
    return None


def _from_dictionaryapi(word):
    """Primary source: dictionaryapi.dev."""
    data = _fetch_json(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}")
    if not data:
        return None
    try:
        return data[0]["meanings"][0]["definitions"][0]["definition"]
    except (KeyError, IndexError, TypeError) as exc:
        print(f"  unexpected dictionaryapi.dev response shape: {exc}")
        return None


def _from_wiktionary(word):
    """Fallback source: Wiktionary REST definitions endpoint.

    Parsed defensively -- any unexpected shape returns None so the caller can
    fall through rather than writing garbage into the history file.
    """
    data = _fetch_json(f"https://en.wiktionary.org/api/rest_v1/page/definition/{word}")
    if not isinstance(data, dict):
        return None
    try:
        for entry in data.get("en", []):
            for definition in entry.get("definitions", []):
                text = definition.get("definition", "").strip()
                # The REST payload embeds HTML; strip tags crudely but safely.
                text = _strip_html(text)
                if text:
                    return text
    except (AttributeError, TypeError) as exc:
        print(f"  unexpected Wiktionary response shape: {exc}")
    return None


def _strip_html(text):
    """Remove HTML tags and collapse whitespace."""
    out = []
    depth = 0
    for char in text:
        if char == "<":
            depth += 1
        elif char == ">":
            depth = max(0, depth - 1)
        elif depth == 0:
            out.append(char)
    return " ".join("".join(out).split())


def get_word_definition(word):
    """Fetch a definition, trying each source in order.

    Returns the placeholder only if every source is exhausted.
    """
    print(f"Fetching definition for '{word}'...")
    for source in (_from_dictionaryapi, _from_wiktionary):
        definition = source(word)
        if definition:
            print(f"  found via {source.__name__}")
            return definition
    print(f"  all sources exhausted for '{word}'")
    return MISSING_DEFINITION


def load_valid_words():
    """Load the set of allowed 5-letter words."""
    if not os.path.exists(VALID_WORDS_PATH):
        print(f"Valid words file '{VALID_WORDS_PATH}' not found.")
        sys.exit(1)

    valid_words = set()
    with open(VALID_WORDS_PATH, "r", encoding="utf-8") as f:
        try:
            for row in csv.reader(f):
                if row and row[0].strip():
                    valid_words.add(row[0].lower().strip())
        except (csv.Error, UnicodeDecodeError) as exc:
            print(f"Could not load valid words from '{VALID_WORDS_PATH}': {exc}")
            sys.exit(1)
    return valid_words


def load_history():
    """Load the WOTD history, tolerating a missing or malformed file."""
    if not os.path.exists(WOTD_HISTORY_PATH):
        return []
    with open(WOTD_HISTORY_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_history(history):
    """Write the history back, keeping the trailing newline git expects."""
    with open(WOTD_HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
        f.write("\n")


def update_word_of_the_day(new_word):
    """Validate the word, fetch a definition, and append it to the history."""
    if not new_word or len(new_word) != 5 or not new_word.isalpha():
        print(f"Invalid word provided: '{new_word}'. Must be a 5-letter word.")
        sys.exit(1)

    new_word = new_word.lower()

    if new_word not in load_valid_words():
        print(f"The word '{new_word}' is not in the list of valid words.")
        sys.exit(1)

    history = load_history()

    if new_word in {entry["word"] for entry in history}:
        print(f"The word '{new_word}' has already been used.")
        sys.exit(1)

    history.append(
        {
            "date": date.today().isoformat(),
            "word": new_word,
            "definition": get_word_definition(new_word),
        }
    )
    save_history(history)

    print(f"Successfully added new Word of the Day: {new_word}")


def backfill_definitions():
    """Re-attempt every entry still carrying the placeholder definition."""
    history = load_history()
    pending = [e for e in history if e.get("definition", "").strip() == MISSING_DEFINITION]

    if not pending:
        print("No entries need backfilling.")
        return

    print(f"Backfilling {len(pending)} entr{'y' if len(pending) == 1 else 'ies'}...")
    recovered = 0
    for entry in pending:
        definition = get_word_definition(entry["word"])
        if definition != MISSING_DEFINITION:
            entry["definition"] = definition
            recovered += 1

    if recovered:
        save_history(history)

    print(f"Recovered {recovered} of {len(pending)} missing definitions.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--backfill",
        action="store_true",
        help="Re-attempt definitions for entries that are still placeholders.",
    )
    args = parser.parse_args()

    if args.backfill:
        backfill_definitions()
    else:
        # The word is passed in as an environment variable by the workflow.
        word_to_add = os.getenv("WORD_TO_ADD")
        if not word_to_add:
            print("Error: No word provided. Run this script via the GitHub Action.")
            sys.exit(1)
        update_word_of_the_day(word_to_add)
