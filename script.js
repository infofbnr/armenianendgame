document.addEventListener('DOMContentLoaded', () => {
    // Load word list from an external file
    async function fetchWordList(url) {
        const response = await fetch(url);
        const text = await response.text();
        return text.split('\n')
            .map(word => word.trim().toLowerCase())
            .filter(word => /^[ա-ֆև]+$/.test(word) && word.length > 0); // Adjust for Armenian alphabet
    }
    const faqItems = document.querySelectorAll('.faq-item h2');

    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const answer = item.nextElementSibling;

            if (answer.style.display === 'block') {
                answer.style.display = 'none';
            } else {
                answer.style.display = 'block';
            }
        });
    });
    
    let wordList = [];
    let generatedWord = '';
    let history = [];
    let usedWords = new Set();
    let lives = 3;

    // DOM elements
    const generatedWordElement = document.getElementById('generated-word');
    const historyElement = document.getElementById('history');
    const livesElement = document.getElementById('lives');
    const errorMessageElement = document.getElementById('error-message');
    const userWordInput = document.getElementById('user-word');
    const gameForm = document.getElementById('game-form');

    // Load game state from localStorage
    function loadGameState() {
        const savedState = JSON.parse(localStorage.getItem('gameState'));
        if (savedState) {
            history = savedState.history || [];
            lives = savedState.lives || 3;
            generatedWord = savedState.generatedWord || 'սկիզբ'; // Armenian default start
        } else {
            resetGame();
        }
    }

    // Save game state to localStorage
    function saveGameState() {
        localStorage.setItem('gameState', JSON.stringify({
            history,
            lives,
            generatedWord
        }));
    }

    // Pick a random word from the word list
    function pickRandomWord() {
        return wordList[Math.floor(Math.random() * wordList.length)];
    }

    // Update the DOM with current game state
    function updateUI() {
        generatedWordElement.textContent = `Ստեղծուած բառն է: ${generatedWord}`;
        historyElement.textContent = `Գործածած բառեր: ${history.join(' -> ')}`;
        livesElement.textContent = `Կեանք: ${lives}`;
        saveGameState();
    }

    // Check if the user's word is valid
    function validateWord(userWord) {
        const lowerWord = userWord.toLowerCase();
        
        if (!wordList.includes(lowerWord)) {
            return 'Այս բառը բառարանի մեջ չկա։'; // The word is not in the word list
        }
        if (usedWords.has(lowerWord)) {
            return 'Դուք արդեն օգտագործել եք այս բառը։'; // You already used this word
        }
        const lastChar = generatedWord.slice(-1); // Get the last character of the generated word
        if (lowerWord.charAt(0) !== lastChar) {
            return `Բառը պետք է սկսվի '${lastChar}'-ով, բայց սկսվում է '${lowerWord.charAt(0)}'-ով։`; 
            // The word must start with the last character of the previous word
        }
        return true; // The word is valid
    }
    
    // End the game with a message
    function endGame(message, score) {
        alert(`${message} Your score: ${score}`);
        resetGame();
    }

    // Reset the game state
    function resetGame() {
        history = [];
        usedWords = new Set();
        lives = 3;
        generatedWord = pickRandomWord();
        saveGameState();
        updateUI();
    }

    // Handle game form submission
    gameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const userWord = userWordInput.value.trim().toLowerCase();
        const validationResult = validateWord(userWord);

        if (validationResult === true) {
            usedWords.add(userWord);
            history.push(userWord);
            errorMessageElement.textContent = '';

            const nextLetter = userWord.charAt(userWord.length - 1);
            const nextWords = wordList.filter(word => word.startsWith(nextLetter) && !usedWords.has(word));

            if (nextWords.length > 0) {
                generatedWord = nextWords[Math.floor(Math.random() * nextWords.length)];
            } else {
                endGame('No more words available. You win!', history.length);
            }
        } else {
            errorMessageElement.textContent = validationResult;
            if (lives > 0) {
                lives -= 1;
                if (lives === 0) {
                    endGame("Game over! You've run out of lives.", history.length);
                }
            }
        }

        updateUI();
        userWordInput.value = '';
    });

    // Initialize game state
    loadGameState();
    fetchWordList('anki_words_only.txt').then(loadedWordList => {
        wordList = loadedWordList;
        if (generatedWord === 'սկիզբ') {
            generatedWord = pickRandomWord();
        }
        updateUI();
    });
});
