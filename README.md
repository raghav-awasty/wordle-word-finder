# Wordle Word Finder

A web application to help find possible Wordle words based on clues, with word history tracking and automated updates.

## Project Structure

```
.
├── src/                    # HTML files
│   ├── index.html         # Main word finder page
│   ├── history.html       # Word history calendar
│   └── submit.html        # Submit new word page
│
├── public/                # Static assets
│   ├── css/               # Stylesheets
│   │   ├── base.css       # Common styles
│   │   ├── index.css      # Index page styles
│   │   ├── history.css    # History page styles
│   │   └── submit.css     # Submit page styles
│   │
│   └── js/                # JavaScript files
│       ├── common.js      # Shared utilities
│       ├── index.js       # Index page logic
│       ├── history.js     # History page logic
│       └── submit.js      # Submit page logic
│
├── data/                  # Data files
│   ├── valid_words.json   # List of valid Wordle words
│   └── word_otd.json      # Word of the day history
│
├── scripts/               # Python scripts
│   └── update_word_otd.py # Update word of the day script
│
├── .github/               # GitHub workflows
│   └── workflows/
│       ├── daily_reminder.yml
│       └── update_word_otd.yml
│
└── README.md
```

## Features

- **Word Finder**: Enter green (correct position), yellow (wrong position), and gray (not in word) letters to find possible words
- **Interactive Tiles**: Navigate between letter positions using arrow keys or tab
- **Word History**: View past words of the day in a calendar interface
- **Word Submission**: Submit new words through GitHub Actions integration
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

1. Open `src/index.html` in your web browser
2. Enter your Wordle clues:
   - **Green tiles**: Letters you know are in the correct position
   - **Yellow letters**: Letters that are in the word but in wrong positions
   - **Gray letters**: Letters that are not in the word
3. Click "Search" to find matching words

## Architecture

### Separation of Concerns

- **HTML**: Clean semantic structure in `src/` directory
- **CSS**: Modular stylesheets with base styles and page-specific styles
- **JavaScript**: Common utilities separated from page-specific logic
- **Data**: JSON files isolated in `data/` directory
- **Scripts**: Python automation scripts in `scripts/` directory

### CSS Architecture

- `base.css`: Common styles, variables, and utility classes
- Page-specific CSS files override and extend base styles
- Consistent design system with CSS custom properties
- Mobile-first responsive design

### JavaScript Architecture

- `common.js`: Shared utilities, constants, and helper functions
- Page-specific JS files handle individual page functionality
- Modular approach with clear separation of concerns
- Event-driven architecture with proper initialization patterns

## Development

### File Organization

The project follows a clean separation of concerns:

- **Frontend assets** are organized by type (HTML, CSS, JS)
- **Data files** are separated from code
- **Build scripts** are isolated in their own directory
- **GitHub workflows** handle automation

### Adding New Pages

1. Create HTML file in `src/`
2. Add page-specific CSS in `public/css/`
3. Add page-specific JS in `public/js/`
4. Link base.css and common.js for shared functionality

### Styling Guidelines

- Use CSS custom properties defined in `base.css`
- Follow the existing naming conventions
- Mobile-first responsive design
- Use utility classes where appropriate

## Automation

The project includes GitHub Actions for:

- **Daily reminders** to update the word of the day
- **Automated word updates** when submitted through the web interface

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- Works on mobile and desktop devices

## 🚀 Deployment

1. **Fork this repo** to your own GitHub account
2. Go to your repository **Settings > Pages**, and under "Source" choose the `main` branch and `/ (root)` folder
3. Visit `https://your-username.github.io/wordle-word-finder` to see it live

### ✍️ Submitting the Word of the Day

To use the Submit page:

* Generate a GitHub [Personal Access Token](https://github.com/settings/tokens/new?scopes=repo) with `repo` scope
* Use it to authorize the form on `submit.html`, which triggers a GitHub Actions workflow to append the word and its definition to the `word_otd.json` file

## 📄 License

MIT License. Use freely and improve it!

### Made with ❤️ for Wordle fans.
