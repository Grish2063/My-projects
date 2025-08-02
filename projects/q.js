const questions = [
    {
        question:"Where is Mt.Everest Located at?", 
        answers: [
            {text : "Nepal" , correct: true},
            {text : "India" , correct: false},
            {text : "China" , correct: false},
            {text : "Bhutan" , correct: false},
        ]
    },
    {
        question:"Which is the smallest country in the world?", 
        answers: [
            {text : "Australia" , correct: false},
            {text : "Japan" , correct: false},
            {text : "Russia" , correct: false},
            {text : "Vatican City" , correct: true},
        ]
    },
    {
        question:"What is the capital city of Nepal?", 
        answers: [
            {text : "Kathmandu" , correct: true},
            {text : "Bhaktapur" , correct: false},
            {text : "Pokhara" , correct: false},
            {text : "Lalitpur" , correct: false},
        ]
    },
    {
        question:"Which country hosted World cup 2014?", 
        answers: [
            {text : "Brazil" , correct: true},
            {text : "Russia" , correct: false},
            {text : "China" , correct: false},
            {text : "Argentina" , correct: false},
        ]
    }
];

const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-btn");
const nextButton = document.getElementById("next-btn");
const toggleBtn = document.getElementById("dark-mode-toggle");
const timerDisplay = document.getElementById("timer");
const progress = document.getElementById("progress");

let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 15;

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    nextButton.innerText = "Next";
    showQuestion();
}

function showQuestion() {
    resetState();
    const currentQuestion = questions[currentQuestionIndex];
    progress.innerText = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    questionElement.innerText = `${currentQuestionIndex + 1}. ${currentQuestion.question}`;

    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.innerText = answer.text;
        button.classList.add("btn");
        button.dataset.correct = answer.correct;
        button.addEventListener("click", selectAnswer);
        answerButtons.appendChild(button);
    });

    startTimer(); // Start timer for each question
}

function resetState() {
    clearInterval(timer);
    timerDisplay.textContent = "";
    nextButton.style.display = "none";
    while (answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

function selectAnswer(e) {
    clearInterval(timer);
    const selectedButton = e.target;
    const correct = selectedButton.dataset.correct === "true";

    if (correct) {
        selectedButton.classList.add("correct");
        score++;
    } else {
        selectedButton.classList.add("incorrect");
    }

    Array.from(answerButtons.children).forEach(button => {
        button.disabled = true;
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        }
    });

    nextButton.style.display = "block";
}

nextButton.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showScore();
    }
});

function showScore() {
    clearInterval(timer);
    resetState();
    questionElement.innerText = `🎉 You scored ${score} out of ${questions.length}!`;
    nextButton.innerText = "Play Again";
    nextButton.style.display = "block";
    nextButton.onclick = () => {
        startQuiz();
    };
}

function startTimer() {
    timeLeft = 15;
    timerDisplay.textContent = `Time: ${timeLeft}s`;

    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            autoSkipQuestion();
        }
    }, 1000);
}

function autoSkipQuestion() {
    Array.from(answerButtons.children).forEach(button => {
        button.disabled = true;
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        }
    });

    nextButton.style.display = "block";
}

function updateToggleIcon() {
    toggleBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
}

if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
}
updateToggleIcon();

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
    } else {
        localStorage.removeItem("darkMode");
    }

    updateToggleIcon();
});

startQuiz();





