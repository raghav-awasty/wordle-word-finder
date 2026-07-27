# Wordle Word Finder 🔤🟩🟨

_Inspired by my daily struggle to find wordle words_ ¯\\_(ツ)_/¯

A minimal web-based tool to help you find all valid 5-letter English words that can be formed using a given set of characters for the popular NYT game [Wordle](https://www.nytimes.com/games/wordle/index.html).

## 🔍 Features

- **Wordle-inspired UI** with tile-based inputs and matching color logic
- Instantly shows all valid 5-letter words that contain input letters
  - 🟩 **Green Tiles** — specify correct letters at correct positions
  - 🟨 **Yellow Characters** — specify letters that are present but in unknown positions
  - ⬛ **Gray Characters** — exclude letters that are not in the word
- 🗂️ **Word History** — view previous “Word of the Day” entries along with definitions
- 📬 **Submit Page** — easily submit a new word and trigger GitHub Actions to update history

## 🛠️ How It Works

- A list of valid English 5-letter words with frequency data is stored in `valid_words_frequencies.csv` (based on [@dracos](https://gist.github.com/dracos/dd0668f281e685bad51479e5acaadb93)).
- Input tiles capture your current Wordle guess with the Green, Yellow and Gray characters.
- JavaScript filters this list based on your input.

## 🕹 Usage

1. Fill in the green tile positions if you know any correct letter.
2. Add yellow tiles to indicate correct letters at incorrect positions.
3. Type gray letters (not in the word) into the exclusion box.
4. Hit **Enter** or click **Search** to see results.

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
   * fetches a definition from [dictionaryapi.dev](https://dictionaryapi.dev),
   * appends the entry to `data/word_otd.json` and commits it.
4. The bot comments the result on the issue and closes it on success.

A scheduled [`daily_reminder`](.github/workflows/daily_reminder.yml) workflow emails a nudge each morning with links to play, to the finder, and to the submit page. It needs two repository secrets, `MAIL_USERNAME` and `MAIL_PASSWORD` (a Gmail [app password](https://support.google.com/accounts/answer/185833)).

> **Note:** GitHub disables scheduled workflows in repositories with no activity for 60 days. Daily WOTD commits normally keep it alive.

## 📄 License

MIT License. Use freely and improve it!

### Made with ❤️ for Wordle fans.
