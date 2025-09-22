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
- `/history.html` — Browse past submitted words and their definitions. Build the streak!
- `/submit.html` — Submit today’s word and trigger update via GitHub Actions.

## 🚀 Deploying

1. **Fork this repo** to your own GitHub account.
2. Go to your repository **Settings > Pages**, and under “Source” choose the `main` branch and `/ (root)` folder.
3. Visit `https://your-username.github.io/wordle-word-finder` to see it live.

### ✍️ Submitting the Word of the Day

To use the `Submit` page:

* Generate a GitHub [Personal Access Token](https://github.com/settings/tokens/new?scopes=repo) with `repo` scope.
* Use it to authorize the form on `/submit.html`, which triggers a GitHub Actions workflow to append the word and its definition to the `word_otd.json` file.

## 📄 License

MIT License. Use freely and improve it!

### Made with ❤️ for Wordle fans.
