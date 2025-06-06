# Wordle Word Finder 🔤🟩🟨

_Inspired by my daily struggle to find wordle words_ ¯\\_(ツ)_/¯

A minimal web-based tool to help you find all valid 5-letter English words that can be formed using a given set of characters for the popular NYT game [Wordle](https://www.nytimes.com/games/wordle/index.html).

## 🔍 Features

- Clean, Wordle-inspired UI
- Type in a set of letters (e.g. `fied`)
- Instantly shows all valid 5-letter words that contain those letters

## 🛠️ How It Works

- A list of valid English 5-letter words is preprocessed using NLTK and stored in a `valid_words.json` file.
- JavaScript filters this list based on your input.

## 🚀 Usage

1. Type a partial set of letters (like `trs`) into the input box.
2. Click **Search**.
3. See all valid 5-letter words that contain those letters.

## 📄 License

MIT License. Use freely.

### Made with ❤️ for Wordle fans.
