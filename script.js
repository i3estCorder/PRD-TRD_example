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

    let sentimentAnalyzer = null;

    // 3. Engine Initialization & CDN Check
    function initSentimentEngine() {
        try {
            // Check if Sentiment constructor exists (loaded via CDN)
            if (typeof Sentiment !== "undefined") {
                sentimentAnalyzer = new Sentiment();
                
                // Enable inputs and button
                inputText.removeAttribute("disabled");
                analyzeBtn.removeAttribute("disabled");
                btnText.textContent = "Analyze Emotion";
                libraryErrorBanner.classList.add("hidden");
                console.log("Sentiment.js successfully initialized.");
            } else {
                throw new Error("Sentiment library is not loaded from CDN.");
            }
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
