# Wordle Word Finder 🔤🟩🟨

_Inspired by my daily struggle to find wordle words_ ¯\\_(ツ)_/¯

A minimal web-based tool to help you find all valid 5-letter English words that can be formed using a given set of characters for the popular NYT game [Wordle](https://www.nytimes.com/games/wordle/index.html).

## 🔍 Features

- **A real Wordle board** — type your guesses into a 6×5 grid and tap each tile to set its colour, exactly as the game shows it
- Results filter **live** as you type and recolour, ranked by how common each word is
- **Correct handling of repeated letters** — because guesses are recorded row by row, the solver can tell "two E's in one guess" (the answer has at least two) apart from "an E in two different guesses" (it has at least one)
- 🗂️ **Word History** — past “Word of the Day” entries on a calendar, with current and longest streaks
- 📬 **Submit Page** — submit a new word and trigger GitHub Actions to update the history

## 🛠️ How It Works

- A list of valid English 5-letter words with frequency data is stored in `valid_words_frequencies.csv` (based on [@dracos](https://gist.github.com/dracos/dd0668f281e685bad51479e5acaadb93)).
- Each filled row is read as one guess. For every letter in that row the solver works out:
  - 🟩 green → that exact position is fixed
  - 🟨 yellow → the letter is in the word but not at that position
  - ⬛ grey → if the same letter is green or yellow elsewhere in the row, the answer holds *exactly* that many of it; otherwise the letter is absent entirely
- Constraints from all rows are combined, and the word list is filtered against them in the browser.

## 🕹 Usage

1. Type a guess you have already played into a row.
2. Click (or tap) each tile to cycle it grey → yellow → green to match what Wordle showed you.
3. Matching words appear immediately, most common first. Add another guess to narrow further.

Once a position is confirmed green, typing that same letter there again in a later row colours it green for you. Click it if you ever need to change it back.

Keyboard: letters type, **Backspace** deletes, **arrow keys** move, **Space** recolours the tile under the cursor (**Shift+Space** cycles backwards).

## 🌐 Pages

- `/index.html` — Main Wordle helper tool.
- `/src/history.html` — Browse past words and their definitions on a calendar, with current and longest streaks.
- `/src/submit.html` — Submit today’s word and trigger the update via GitHub Actions.

## 🚀 Deploying

1. **Fork this repo** to your own GitHub account.
2. Go to your repository **Settings > Pages**, and under “Source” choose the `main` branch and `/ (root)` folder.
3. Visit `https://your-username.github.io/wordle-word-finder` to see it live.

### ✍️ Submitting the Word of the Day

No tokens or secrets needed in the browser — submission goes through a GitHub issue, so GitHub handles authentication.

1. Enter the day's word on `/submit.html` and hit **Enter** (or click **Submit**).
2. A pre-filled GitHub issue titled `WOTD: WORD` opens in a new tab. Click **Create**.
3. The [`process_word_submission`](.github/workflows/process_word_submission.yml) workflow fires on issue creation and runs [`scripts/update_word_otd.py`](scripts/update_word_otd.py), which:
   * validates the word is 5 letters and present in `valid_words_frequencies.csv`,
   * rejects it if it has already been used,
   * fetches a definition from [dictionaryapi.dev](https://dictionaryapi.dev), falling back to [Datamuse](https://api.datamuse.com) if that has no entry,
   * appends the entry to `data/word_otd.json` and commits it.
4. The bot comments the result on the issue and closes it on success.

A scheduled [`daily_reminder`](.github/workflows/daily_reminder.yml) workflow emails a nudge each morning with links to play, to the finder, and to the submit page. It needs two repository secrets, `MAIL_USERNAME` and `MAIL_PASSWORD` (a Gmail [app password](https://support.google.com/accounts/answer/185833)).

> **Note:** GitHub disables scheduled workflows in repositories with no activity for 60 days. Daily WOTD commits normally keep it alive.

## 📄 License

MIT License. Use freely and improve it!

### Made with ❤️ for Wordle fans.
