"""This script updates the Word of the Day (WOTD) history with a new word and its definition.
It checks if the word is valid, fetches its definition, and appends it to the history file.
This script is intended to be run as part of a GitHub Action workflow."""

import json
import csv
from datetime import date
import os
import sys
import requests

VALID_WORDS_PATH = "./data/valid_words_frequencies.csv"
WOTD_HISTORY_PATH = "./data/word_otd.json"


def get_word_definition(word):
    """Fetches a definition for a given word from a public API."""
    try:
        response = requests.get(
            f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}",
            timeout=15
        )
        response.raise_for_status()
        data = response.json()
        definition = data[0]["meanings"][0]["definitions"][0]["definition"]
        return definition
    except (requests.exceptions.RequestException, KeyError, IndexError) as e:
        print(f"Could not fetch definition for '{word}': {e}")
        return "No definition found."


def update_word_of_the_day(new_word):
    """Fetches a definition for the provided word and updates the history file."""
    if not new_word or len(new_word) != 5 or not new_word.isalpha():
        print(f"Invalid word provided: '{new_word}'. Must be a 5-letter word.")
        sys.exit(1)

    new_word = new_word.lower()

    if not os.path.exists(VALID_WORDS_PATH):
        print(f"Valid words file '{VALID_WORDS_PATH}' not found.")
        sys.exit(1)
    
    valid_words = set()
    with open(VALID_WORDS_PATH, "r", encoding="utf-8") as f:
        try:
            csv_reader = csv.reader(f)
            for row in csv_reader:
                if row and len(row) >= 1:  # Ensure row has at least word column
                    word = row[0].lower().strip()
                    if word:  # Only add non-empty words
                        valid_words.add(word)
        except (csv.Error, UnicodeDecodeError) as e:
            print(f"Could not load valid words from '{VALID_WORDS_PATH}': {e}")
            sys.exit(1)

    if new_word not in valid_words:
        print(f"The word '{new_word}' is not in the list of valid words.")
        sys.exit(1)

    wotd_history = []
    if os.path.exists(WOTD_HISTORY_PATH):
        with open(WOTD_HISTORY_PATH, "r", encoding="utf-8") as f:
            try:
                wotd_history = json.load(f)
            except json.JSONDecodeError:
                wotd_history = []

    used_words = {entry["word"] for entry in wotd_history}
    if new_word in used_words:
        print(f"The word '{new_word}' has already been used.")
        sys.exit(1)

    definition = get_word_definition(new_word)

    new_entry = {
        "date": date.today().isoformat(),
        "word": new_word,
        "definition": definition,
    }

    wotd_history.append(new_entry)
    with open(WOTD_HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(wotd_history, f, indent=2)

    print(f"Successfully added new Word of the Day: {new_word}")


if __name__ == "__main__":
    # The word will be passed as an environment variable from the GitHub Action
    # We use 'GITHUB_EVENT_INPUTS_WORD'
    word_to_add = os.getenv("WORD_TO_ADD")
    if not word_to_add:
        print("Error: No word provided. Run this script via the GitHub Action.")
        sys.exit(1)
    update_word_of_the_day(word_to_add)
