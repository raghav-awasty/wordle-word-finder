// History page specific functionality

let wordsData = [];
let today = new Date();

function Calendar(selector) {
    this.el = document.querySelector(selector);
    this.current = new Date();
    this.current.setDate(1); // Set to first day of month
    this.draw();
    
    // Auto-open today's word if it exists
    const self = this;
    setTimeout(function() {
        const todayElement = document.querySelector('.today');
        if (todayElement && todayElement.classList.contains('has-word')) {
            self.openDay(todayElement);
        }
    }, 500);
}

Calendar.prototype.draw = function() {
    this.drawHeader();
    this.drawMonth();
}

Calendar.prototype.drawHeader = function() {
    const self = this;
    if (!this.header) {
        this.header = createElement('div', 'header');
        this.title = createElement('h1');
        
        const right = createElement('div', 'right');
        right.addEventListener('click', function() { self.nextMonth(); });
        
        const left = createElement('div', 'left');
        left.addEventListener('click', function() { self.prevMonth(); });
        
        this.header.appendChild(left);
        this.header.appendChild(this.title);
        this.header.appendChild(right);
        this.el.appendChild(this.header);
    }
    
    this.title.innerHTML = DateUtils.formatDate(this.current);
}

Calendar.prototype.drawMonth = function() {
    const self = this;
    
    if (this.month) {
        this.oldMonth = this.month;
        this.oldMonth.className = 'month out ' + (self.next ? 'next' : 'prev');
        this.oldMonth.addEventListener('animationend', function() {
            if (self.oldMonth && self.oldMonth.parentNode) {
                self.oldMonth.parentNode.removeChild(self.oldMonth);
            }
            self.month = createElement('div', 'month');
            self.buildCalendar();
            self.el.appendChild(self.month);
            setTimeout(function() {
                self.month.className = 'month in ' + (self.next ? 'next' : 'prev');
            }, 16);
        });
    } else {
        this.month = createElement('div', 'month');
        this.el.appendChild(this.month);
        this.buildCalendar();
        this.month.className = 'month new';
    }
}

Calendar.prototype.buildCalendar = function() {
    this.backFill();
    this.currentMonth();
    this.forwardFill();
}

Calendar.prototype.backFill = function() {
    const clone = new Date(this.current);
    const dayOfWeek = clone.getDay();
    
    if (!dayOfWeek) return;
    
    clone.setDate(clone.getDate() - dayOfWeek);
    
    for (let i = dayOfWeek; i > 0; i--) {
        this.drawDay(new Date(clone));
        clone.setDate(clone.getDate() + 1);
    }
}

Calendar.prototype.forwardFill = function() {
    const clone = new Date(this.current);
    clone.setMonth(clone.getMonth() + 1);
    clone.setDate(0); // Last day of current month
    const dayOfWeek = clone.getDay();
    
    if (dayOfWeek === 6) return;
    
    for (let i = dayOfWeek; i < 6; i++) {
        clone.setDate(clone.getDate() + 1);
        this.drawDay(new Date(clone));
    }
}

Calendar.prototype.currentMonth = function() {
    const clone = new Date(this.current);
    
    while (clone.getMonth() === this.current.getMonth()) {
        this.drawDay(new Date(clone));
        clone.setDate(clone.getDate() + 1);
    }
}

Calendar.prototype.getWeek = function(day) {
    if (!this.week || day.getDay() === 0) {
        this.week = createElement('div', 'week');
        this.month.appendChild(this.week);
    }
}

Calendar.prototype.drawDay = function(day) {
    const self = this;
    this.getWeek(day);
    
    const outer = createElement('div', this.getDayClass(day));
    outer.addEventListener('click', function() {
        self.openDay(this);
    });
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const name = createElement('div', 'day-name', dayNames[day.getDay()]);
    const number = createElement('div', 'day-number', day.getDate().toString().padStart(2, '0'));
    const events = createElement('div', 'day-events');
    
    this.drawEvents(day, events);
    
    outer.appendChild(name);
    outer.appendChild(number);
    outer.appendChild(events);
    this.week.appendChild(outer);
}

Calendar.prototype.drawEvents = function(day, element) {
    if (day.getMonth() === this.current.getMonth()) {
        const wordData = wordsData.find(word => DateUtils.sameDay(word.date, day));
        if (wordData) {
            const wordSpan = createElement('span', 'word-indicator', wordData.word);
            element.appendChild(wordSpan);
        }
    }
}

Calendar.prototype.getDayClass = function(day) {
    const classes = ['day'];
    if (day.getMonth() !== this.current.getMonth()) {
        classes.push('other');
    } else if (DateUtils.sameDay(today, day)) {
        classes.push('today');
    }
    
    // Check if this day has a word
    const wordData = wordsData.find(word => DateUtils.sameDay(word.date, day));
    if (wordData) {
        classes.push('has-word');
    }
    
    return classes.join(' ');
}

Calendar.prototype.openDay = function(el) {
    const dayNumber = +el.querySelector('.day-number').textContent;
    const day = new Date(this.current);
    day.setDate(dayNumber);
    
    const currentOpened = document.querySelector('.details');
    const weekRow = el.parentNode; // The week containing the clicked day
    const wordData = wordsData.find(word => DateUtils.sameDay(word.date, day));
    
    // Check if clicking the same day that's already open - close it
    if (currentOpened && currentOpened.previousElementSibling === weekRow && 
        this.lastClickedDay === dayNumber) {
        this.closeDetails(currentOpened);
        this.lastClickedDay = null;
        return;
    }
    
    // Don't open if no word data (clicking empty cells closes any open details)
    if (!wordData) {
        if (currentOpened) {
            this.closeDetails(currentOpened);
        }
        this.lastClickedDay = null;
        return;
    }
    
    // If there's an existing details panel, just update its content
    if (currentOpened) {
        // If it's in the same week, just update content with fade
        if (currentOpened.previousElementSibling === weekRow) {
            this.renderEvents([wordData], currentOpened);
            this.updateArrow(el, currentOpened);
            this.lastClickedDay = dayNumber;
            return;
        } else {
            // Different week - close old and create new
            this.closeDetails(currentOpened);
        }
    }
    
    // Create new details panel
    const details = createElement('div', 'details in');
    const arrow = createElement('div', 'arrow');
    
    details.appendChild(arrow);
    
    // Insert details panel after the week row, not inside it
    if (weekRow.nextSibling) {
        this.month.insertBefore(details, weekRow.nextSibling);
    } else {
        this.month.appendChild(details);
    }
    
    this.renderEvents([wordData], details);
    this.updateArrow(el, details);
    this.lastClickedDay = dayNumber;
}

Calendar.prototype.updateArrow = function(dayEl, detailsEl) {
    const arrow = detailsEl.querySelector('.arrow');
    const dayRect = dayEl.getBoundingClientRect();
    const detailsRect = detailsEl.getBoundingClientRect();
    const dayCenter = dayRect.left + dayRect.width / 2;
    const detailsLeft = detailsRect.left;
    arrow.style.left = (dayCenter - detailsLeft - 8) + 'px';
}

Calendar.prototype.closeDetails = function(detailsEl) {
    detailsEl.className = 'details out';
    detailsEl.addEventListener('animationend', function() {
        if (detailsEl.parentNode) {
            detailsEl.parentNode.removeChild(detailsEl);
        }
    });
}

Calendar.prototype.renderEvents = function(events, detailsEl) {
    const currentWrapper = detailsEl.querySelector('.events');
    const wrapper = createElement('div', 'events in' + (currentWrapper ? ' new' : ''));
    
    events.forEach(function(wordData) {
        const eventDiv = createElement('div', 'event');
        const title = createElement('h3', '', wordData.word);
        const definition = createElement('div', 'word-definition', wordData.definition);
        
        eventDiv.appendChild(title);
        eventDiv.appendChild(definition);
        wrapper.appendChild(eventDiv);
    });
    
    if (currentWrapper) {
        currentWrapper.className = 'events out';
        currentWrapper.addEventListener('animationend', function() {
            if (currentWrapper.parentNode) {
                currentWrapper.parentNode.removeChild(currentWrapper);
            }
            detailsEl.appendChild(wrapper);
        });
    } else {
        detailsEl.appendChild(wrapper);
    }
}

Calendar.prototype.nextMonth = function() {
    this.current.setMonth(this.current.getMonth() + 1);
    this.next = true;
    this.draw();
}

Calendar.prototype.prevMonth = function() {
    this.current.setMonth(this.current.getMonth() - 1);
    this.next = false;
    this.draw();
}

// Load word history data and initialize calendar
async function loadHistory() {
    try {
        const history = await DataLoader.loadJSON('../data/word_otd.json');
        wordsData = history.map(entry => ({
            date: new Date(entry.date),
            word: entry.word,
            definition: entry.definition
        }));

        new Calendar('#calendar');
    } catch (error) {
        console.error('Error loading word history:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadHistory);
