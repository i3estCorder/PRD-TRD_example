/* ==========================================================================
   Emotion Analyzer - Main Javascript Logic
   Handles local Sentiment.js, UI updates, LocalStorage, and dynamic themes
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM Elements
    const inputText = document.getElementById("input-text");
    const charCounter = document.getElementById("char-counter");
    const validationMsg = document.getElementById("validation-msg");
    const analyzeBtn = document.getElementById("analyze-btn");
    const btnText = document.getElementById("btn-text");
    const libraryErrorBanner = document.getElementById("library-error-banner");
    
    // Result elements
    const resultSection = document.getElementById("result-section");
    const sentimentEmoji = document.getElementById("sentiment-emoji");
    const sentimentLabel = document.getElementById("sentiment-label");
    const scoreGauge = document.getElementById("score-gauge");
    const scoreVal = document.getElementById("score-val");
    const compVal = document.getElementById("comp-val");
    const recommendationText = document.getElementById("recommendation-text");
    
    // History elements
    const historyList = document.getElementById("history-list");
    const noHistoryMsg = document.getElementById("no-history-msg");
    const clearHistoryBtn = document.getElementById("clear-history-btn");

    // 2. Constants & Configuration
    const MIN_LENGTH = 2;
    const MAX_LENGTH = 500;
    
    // Empirical mapping for colors based on sentiment type
    const THEME_MAP = {
        Positive: {
            color: "#10b981", // Emerald
            bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(4, 120, 87, 0.05) 100%)",
            glow: "rgba(16, 185, 129, 0.25)",
            emoji: "😊"
        },
        Neutral: {
            color: "#64748b", // Slate
            bg: "linear-gradient(135deg, rgba(100, 116, 139, 0.18) 0%, rgba(71, 85, 105, 0.05) 100%)",
            glow: "rgba(100, 116, 139, 0.25)",
            emoji: "😐"
        },
        Negative: {
            color: "#f43f5e", // Rose
            bg: "linear-gradient(135deg, rgba(244, 63, 94, 0.18) 0%, rgba(190, 24, 74, 0.05) 100%)",
            glow: "rgba(244, 63, 94, 0.25)",
            emoji: "😢"
        }
    };

    // Empathetic responses pool (PRD requirement 3)
    const RECOMMENDATION_POOL = {
        Positive: [
            "좋은 하루였나 보네요! 그 기분이 더 오래 가길 바랄게요. 😊",
            "멋져요! 당신의 긍정적인 에너지가 주변 사람들에게도 전달될 거예요.",
            "즐거운 순간을 기록해주셔서 감사해요. 오늘도 파이팅!"
        ],
        Neutral: [
            "조금 더 이야기해줄래요? 어떤 일들이 있었는지 궁금해요. 😐",
            "평온한 일상이군요. 가끔은 이런 잔잔한 하루도 좋은 법이죠.",
            "당신의 차분한 하루를 응원합니다."
        ],
        Negative: [
            "많이 힘들었겠어요. 오늘 하루도 정말 고생 많으셨습니다. 😢",
            "속상한 마음이 느껴지네요. 슬픈 감정을 억누르지 않아도 괜찮아요.",
            "힘든 시간이 지나가고 나면, 꼭 좋은 일이 찾아올 거예요. 힘내세요."
        ]
    };

    // Global State (TRD requirement 6)
    let appState = {
        inputText: "",
        currentResult: null,
        history: []
    };

// Local fallback class in case Sentiment CDN fails or doesn't support browser usage
class BrowserSentiment {
    constructor() {
        // Standard AFINN-165 subset mapping common emotional words to valence scores
        this.afinn = {
            "happy": 3, "glad": 3, "joy": 3, "love": 3, "good": 3, "great": 3, "awesome": 4, "wonderful": 4, "fantastic": 4,
            "nice": 2, "smile": 2, "laugh": 2, "fun": 4, "beautiful": 3, "excellent": 3, "delight": 3, "perfect": 3,
            "sad": -2, "angry": -3, "hate": -3, "bad": -2, "terrible": -3, "horrible": -3, "worst": -3, "ugly": -2,
            "lonely": -2, "depression": -3, "depressed": -3, "fear": -2, "scared": -2, "worry": -3, "worried": -3,
            "hurt": -2, "pain": -2, "sick": -2, "poor": -2, "fail": -2, "failure": -2, "dislike": -2, "disappointed": -2,
            "boring": -2, "bored": -2, "annoyed": -2, "annoying": -2, "tired": -2, "exhausted": -2, "weak": -2,
            "helpless": -2, "useless": -2, "crying": -2, "cry": -1, "tears": -2, "grief": -2, "mourn": -2,
            "like": 2, "love": 3, "pleased": 3, "hope": 2, "hopeful": 2, "sweet": 2, "cool": 1, "smart": 2, "clever": 2,
            "amaze": 2, "amazed": 2, "amazing": 4, "cheer": 2, "cheerful": 2, "excited": 3, "exciting": 3, "enjoy": 2,
            "satisfied": 2, "satisfy": 2, "thrilled": 5, "proud": 2, "calm": 2, "peaceful": 2, "gentle": 2, "kind": 2,
            "safe": 2, "healthy": 2, "strong": 2, "active": 1, "brave": 2, "creative": 2, "eager": 2, "friendly": 2,
            "honest": 2, "generous": 2, "helpful": 2, "intelligent": 2, "polite": 2, "sincere": 2, "wise": 2,
            "hard": -1, "difficult": -1, "stress": -2, "stressed": -2, "stressful": -2, "loss": -3, "lost": -2,
            "miss": -2, "alone": -2, "scare": -2, "terrific": 4, "superb": 5, "outstanding": 5, "coolest": 3, "best": 3,
            "winner": 3, "win": 4, "winning": 4, "success": 2, "successful": 3, "triumph": 4, "victory": 4,
            "unhappy": -2, "unpleasant": -2, "unsafe": -2, "unstable": -2, "unwanted": -2, "worthless": -3,
            "wrong": -2, "worries": -3, "worrying": -3, "anxious": -2, "anxiety": -2, "fearful": -2, "fearing": -2
        };
    }

    analyze(text) {
        // Tokenize text into lowercased words
        const tokens = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 0);

        let score = 0;
        let positive = [];
        let negative = [];
        let words = [];

        // Simple negation tracking
        const negations = ["not", "never", "no", "neither", "nor", "none", "hardly", "seldom"];
        let negateNext = false;

        tokens.forEach((token) => {
            if (negations.includes(token)) {
                negateNext = true;
                return;
            }

            if (this.afinn.hasOwnProperty(token)) {
                let wordScore = this.afinn[token];
                if (negateNext) {
                    wordScore = -wordScore;
                    negateNext = false;
                }
                score += wordScore;
                words.push(token);
                if (wordScore > 0) {
                    positive.push(token);
                } else if (wordScore < 0) {
                    negative.push(token);
                }
            } else {
                negateNext = false;
            }
        });

        const comparative = tokens.length > 0 ? score / tokens.length : 0;

        return {
            score: score,
            comparative: comparative,
            tokens: tokens,
            words: words,
            positive: positive,
            negative: negative
        };
    }
}

    let sentimentAnalyzer = null;

    // 3. Engine Initialization & CDN Check
    function initSentimentEngine() {
        try {
            // Check if Sentiment constructor exists (loaded via CDN)
            if (typeof Sentiment !== "undefined") {
                sentimentAnalyzer = new Sentiment();
                console.log("Sentiment.js successfully initialized via CDN.");
            } else {
                console.warn("Sentiment library not loaded via CDN. Falling back to local BrowserSentiment.");
                sentimentAnalyzer = new BrowserSentiment();
            }
            
            // Enable inputs and button
            inputText.removeAttribute("disabled");
            analyzeBtn.removeAttribute("disabled");
            btnText.textContent = "Analyze Emotion";
            libraryErrorBanner.classList.add("hidden");
        } catch (error) {
            console.error("Initialization failure:", error);
            libraryErrorBanner.classList.remove("hidden");
            btnText.textContent = "Engine Unavailable";
            analyzeBtn.setAttribute("disabled", "true");
        }
    }

    // Attempt initialization immediately
    // Add small delay to ensure script tag parses
    setTimeout(initSentimentEngine, 200);

    // 4. History Handling (LocalStorage integration)
    function loadHistory() {
        const storedHistory = localStorage.getItem("emotion_history");
        if (storedHistory) {
            try {
                appState.history = JSON.parse(storedHistory);
                renderHistory();
            } catch (error) {
                console.error("Failed to parse history from localStorage:", error);
                appState.history = [];
            }
        }
    }

    function saveHistory() {
        localStorage.setItem("emotion_history", JSON.stringify(appState.history));
    }

    function addHistoryItem(text, label, score, timestamp) {
        const newItem = {
            id: Date.now(),
            text: text,
            label: label,
            score: score,
            time: timestamp
        };
        
        // Add to front of array
        appState.history.unshift(newItem);
        
        // Cap at 3 items (PRD/TRD requirement)
        if (appState.history.length > 3) {
            appState.history.pop();
        }
        
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = "";
        
        if (appState.history.length === 0) {
            noHistoryMsg.classList.remove("hidden");
            clearHistoryBtn.classList.add("hidden");
            historyList.appendChild(noHistoryMsg);
            return;
        }
        
        noHistoryMsg.classList.add("hidden");
        clearHistoryBtn.classList.remove("hidden");
        
        appState.history.forEach((item) => {
            const card = document.createElement("div");
            card.className = "history-card";
            
            // Format time cleanly
            const dateObj = new Date(item.time);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            const theme = THEME_MAP[item.label];
            const scoreClass = item.label === "Positive" ? "score-positive" : (item.label === "Negative" ? "score-negative" : "score-neutral");
            
            card.innerHTML = `
                <div class="history-left">
                    <span class="history-emoji">${theme.emoji}</span>
                    <div class="history-content">
                        <p class="history-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</p>
                        <span class="history-time">${timeStr}</span>
                    </div>
                </div>
                <div class="history-right">
                    <span class="history-score ${scoreClass}">Score: ${item.score}</span>
                </div>
            `;
            
            historyList.appendChild(card);
        });
    }

    // Helper to escape HTML tags in history items
    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 5. Input Event Listeners
    inputText.addEventListener("input", () => {
        const text = inputText.value;
        const len = text.length;
        
        // Update character counter
        charCounter.textContent = `${len} / ${MAX_LENGTH}`;
        
        // Toggle character counter highlight color if empty or full
        if (len === MAX_LENGTH) {
            charCounter.style.color = "#f43f5e";
        } else {
            charCounter.style.color = "var(--text-muted)";
        }
        
        // Hide validation messages on typing
        if (len >= MIN_LENGTH) {
            validationMsg.classList.add("hidden");
            inputText.style.borderColor = "var(--glass-border)";
        }
    });

    // 6. Analysis Engine Trigger
    analyzeBtn.addEventListener("click", () => {
        const text = inputText.value.trim();
        
        // Input validation checks
        if (!text || text.length < MIN_LENGTH) {
            // Trigger visual error warning: shake text area & show validation
            validationMsg.classList.remove("hidden");
            inputText.classList.add("shake");
            inputText.style.borderColor = "#f43f5e";
            
            // Remove shake class after animation completes
            setTimeout(() => {
                inputText.classList.remove("shake");
            }, 400);
            
            // Alert user (PRD Exception handling)
            alert("Please enter a valid English sentence (at least 2 characters).");
            return;
        }

        // Trigger loading state briefly for UX feel
        analyzeBtn.setAttribute("disabled", "true");
        btnText.textContent = "Analyzing...";
        
        setTimeout(() => {
            performSentimentAnalysis(text);
            analyzeBtn.removeAttribute("disabled");
            btnText.textContent = "Analyze Emotion";
        }, 300); // 300ms transition delay to simulate local speed with UX clarity
    });

    // Clear history action
    clearHistoryBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all history?")) {
            appState.history = [];
            saveHistory();
            renderHistory();
        }
    });

    // 7. Sentiment Processing & Dynamic DOM Updates
    function performSentimentAnalysis(text) {
        if (!sentimentAnalyzer) return;

        // Perform analysis (using Sentiment.js)
        const analysis = sentimentAnalyzer.analyze(text);
        
        // Determine label
        let label = "Neutral";
        if (analysis.score > 0) {
            label = "Positive";
        } else if (analysis.score < 0) {
            label = "Negative";
        }

        // Get randomly selected recommendation sentence (PRD Requirement 3)
        const recommendations = RECOMMENDATION_POOL[label];
        const randomIndex = Math.floor(Math.random() * recommendations.length);
        const finalRecommendation = recommendations[randomIndex];

        // Update state
        appState.currentResult = {
            score: analysis.score,
            comparative: analysis.comparative,
            label: label,
            recommendation: finalRecommendation
        };

        // Render result dashboard
        renderResult(appState.currentResult);

        // Add to history list
        addHistoryItem(text, label, analysis.score, Date.now());
    }

    function renderResult(result) {
        // Show result section if hidden
        resultSection.classList.remove("hidden");
        
        const theme = THEME_MAP[result.label];

        // 1. Update CSS Custom variables dynamically (Smooth transitions)
        document.documentElement.style.setProperty("--theme-color", theme.color);
        document.documentElement.style.setProperty("--theme-bg-gradient", theme.bg);
        document.documentElement.style.setProperty("--theme-glow", theme.glow);

        // 2. Update text fields and badges
        sentimentEmoji.textContent = theme.emoji;
        sentimentLabel.textContent = result.label;
        
        // Dynamic colors for label badge
        sentimentLabel.style.color = theme.color;
        sentimentLabel.style.borderColor = theme.color;
        
        // Display score numbers
        scoreVal.textContent = result.score > 0 ? `+${result.score}` : result.score;
        compVal.textContent = result.comparative.toFixed(2);
        
        // 3. Dynamic gauge bar visualization
        // Standardize sentiment score scale: default sentiment.js score bounds generally fall within [-5, 5] for single sentences.
        // We map score [-5, 5] to gauge fill percentages [0%, 100%]. 0 score = 50% neutral fill.
        let fillPercentage = 50; // Neutral default
        const maxScoreBound = 5;
        
        if (result.score !== 0) {
            // Cap score calculation
            const cappedScore = Math.max(-maxScoreBound, Math.min(maxScoreBound, result.score));
            // Map [-5, 5] to [10, 90] to keep gauge bar nice and visibly floating
            fillPercentage = 50 + (cappedScore / maxScoreBound) * 40;
        }
        scoreGauge.style.width = `${fillPercentage}%`;
        
        // 4. Update quotes & empathy responses
        recommendationText.textContent = result.recommendation;

        // Smooth scroll result into view on mobile
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 8. Initial Load actions
    loadHistory();
});
