function getElements() {
    return new Proxy({}, {
        get(_, prop) {
            return document.getElementById(prop)
        }
    })
}
const elements = getElements()
const { quizTitle, counter, progressBarIndicator, question, verticalQuizButtons, horizontalQuizButtons, orientationToggle, resultsCanvas, matchesCanvas, matchesDropdown, valueSelectors, listHolder, customCanvas } = elements
const date = new Date().toISOString().slice(0, 10)
const axes = ["Ownership", "Production", "Structure", "Legality", "Identity", "Culture"]
const values = ["level", "strata", "command", "demand", "unity", "autonomy", "volition", "obligation", "inclusion", "supremacy", "sanctity", "novelty"]
const valueColors = ["#ff0c57", "#1fe545", "#b900d3", "#ffc100", "#0cd1a5", "#ff3a17", "#ffff00", "#2876ff", "#ff15a8", "#ff7b09", "#9bf122", "#894efa"]
const sections = ["homeSection", "instructionsSection", "quizSection", "matchesSection", "resultsSection", "questionsSection", "listerSection", "customSection", "aboutSection"]
const axisWeights = [1, 0.9, 1, 0.6, 0.6, 0.7]
let questions = []
let progression = 0
let answers = []
let axisScores = [0, 0, 0, 0, 0, 0]
let maxPossibleValues = [0, 0, 0, 0, 0, 0]
let ideologies = []
let selectedIdeology = 0
let matchesPercentages = []
let isToggled = false
let resultsPercentages = [50, 50, 50, 50, 50, 50]
let customPercentages = [50, 50, 50, 50, 50, 50]
let currentName = "Click to edit name"
function calculateMaxValues() {
    questions.forEach(q => {
        q.effect.forEach((val, i) => {
            maxPossibleValues[i] += Math.abs(val)
        })
    })
}
function show(section) {
    window.scrollTo({ top: 0, behavior: "instant" })
    sections.forEach(id => document.getElementById(id).classList.remove("active"))
    document.getElementById(section).classList.add("active")
    if (section === "homeSection") resetQuiz()
}
function updateQuestion() {
    question.textContent = questions[progression].text
    counter.textContent = `Question ${progression + 1} of ${questions.length}`
    progressBarIndicator.style.width = (60 * (progression / (questions.length - 1))) + "vw"
}
function calculateResults() {
    for (let i = 0; i < 6; i++) {
        const percentage = 50 + (axisScores[i] / maxPossibleValues[i]) * 50
        resultsPercentages[i] = Math.round(percentage * 10) / 10
    }
    updateLister()
}
function addScore(opinion) {
    questions[progression].effect.forEach((val, i) => {
        axisScores[i] += val * opinion
    })
    progression++
    answers.push(opinion)
    if (progression >= questions.length) {
        calculateResults()
        drawCanvas(resultsCanvas)
        show("resultsSection")
    } else {
        updateQuestion()
    }
}
function back() {
    if (progression > 0) {
        progression--
        const lastAnswer = answers.pop()
        questions[progression].effect.forEach((val, i) => {
            axisScores[i] -= val * lastAnswer
        })
        updateQuestion()
    } else {
        show("instructionsSection")
    }
}
function resetQuiz() {
    progression = 0
    answers = []
    axisScores = [0, 0, 0, 0, 0, 0]
    resultsPercentages = [50, 50, 50, 50, 50, 50]
    updateLister()
    updateQuestion()
}
orientationToggle.addEventListener('change', function () {
    const display = isToggled ? ["none", "flex"] : ["flex", "none"]
    horizontalQuizButtons.style.display = display[0]
    verticalQuizButtons.style.display = display[1]
    isToggled = !isToggled
    setTimeout(() => { requestAnimationFrame(() => { quizTitle.scrollIntoView({ behavior: 'smooth' }) }) }, 25)
})
function match(ideologyIndex) {
    if (ideologyIndex >= ideologies.length) {
        selectedIdeology = 0
    } else if (ideologyIndex < 0) {
        selectedIdeology = ideologies.length - 1
    } else {
        selectedIdeology = ideologyIndex
    }
    matchesDropdown.selectedIndex = selectedIdeology
    matchesPercentages = [...ideologies[selectedIdeology].stats]
    const ctx = matchesCanvas.getContext('2d')
    ctx.clearRect(0, 0, matchesCanvas.width, matchesCanvas.height)
    drawCanvas(matchesCanvas, ideologies[selectedIdeology].name)
    show("matchesSection")
}
function drawCanvas(canvas, name = null, rowToUpdate = null) {
    let percentages
    let displayName
    if (canvas === resultsCanvas) {
        percentages = resultsPercentages
        displayName = ideologies.length > 0 ? ideologies[0].name : "Your Results"
        dateInfo = "Taken on "
    }
    else if (canvas === customCanvas) {
        percentages = customPercentages
        displayName = currentName
        dateInfo = "Generated on "
    }
    else {
        percentages = matchesPercentages
        displayName = name || "Missing name"
        dateInfo = "Viewed on "
    }
    const ctx = canvas.getContext("2d")
    ctx.textRendering = "optimizeLegibility"
    if (rowToUpdate === null) {
        ctx.fillStyle = "hsl(0 0% 12.5%)"
        ctx.fillRect(0, 0, 800, 880)
        ctx.fillStyle = "hsl(0 0% 100%)"
        ctx.textAlign = "right"
        ctx.font = "16px brandontext"
        ctx.fillText("quark88.github.io/dozenvalues", 768, 40)
        ctx.fillText("Version 7.0.0 'Lovecraft'", 768, 64)
        ctx.fillText(dateInfo + date, 768, 88)
        ctx.textAlign = "left"
        ctx.font = "64px cocogoose"
        ctx.fillText("DozenValues", 32, 80)
        ctx.font = "48px brandontext"
        ctx.fillText(displayName, 32, 144)
        if (canvas === customCanvas) {
            ctx.fillStyle = "rgba(0,0,0,0)"
            ctx.fillRect(32, 144, 736, 48)
        }
    }
    const rowsToDraw = rowToUpdate !== null ? [rowToUpdate] : [...Array(6).keys()]
    rowsToDraw.forEach(row => {
        ctx.fillStyle = "hsl(0 0% 0%)"
        ctx.fillRect(128, 208 + row * 112, 544, 64)
        if (rowToUpdate === null) {
            ctx.font = "24px brandontext"
            ctx.textAlign = "center"
            ctx.fillStyle = "hsl(0 0% 100%)"
            ctx.fillText(`${axes[row]} axis`, 400, 192 + row * 112)
        }
        for (let i = row * 2; i <= row * 2 + 1; i++) {
            const percentage = percentages[row]
            const position = i % 2
            const xPos = 128 + position * ((544 - 6) * (percentage / 100) + 6)
            const width = (544 - 6) * Math.abs((position * 100 - percentage) / 100)
            ctx.fillStyle = valueColors[i]
            ctx.fillRect(xPos, 214 + row * 112, width, 52)
            const p = Math.round(percentage * 10) / 10
            const text = position === 0 ? `${p}%` : `${Math.round((100 - p) * 10) / 10}%`
            const x = position === 0 ? 136 : 664
            ctx.fillStyle = "hsl(0 0% 0%)"
            ctx.font = "32px brandontext"
            ctx.textAlign = position === 0 ? "left" : "right"
            if ((position === 0 && p >= 25) || (position === 1 && (100 - p) >= 25)) {
                ctx.fillText(text, x, 252 + row * 112)
            }
            const icon = new Image()
            icon.src = `./assets/icons/${values[i]}.svg`
            icon.onload = () => ctx.drawImage(icon, 32 + position * 640, 192 + row * 112, 96, 96)
        }
    })
}
function handleCustomCanvasClick(e) {
    const rect = customCanvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (customCanvas.width / rect.width)
    const y = (e.clientY - rect.top) * (customCanvas.height / rect.height)
    if (x >= 32 && x <= 768 && y >= 106 && y <= 144) {
        const newName = prompt("Enter new ideology name:", currentName)
        if (newName !== null && newName.trim() !== "") {
            currentName = newName
            drawCanvas(customCanvas)
        }
        return
    }
    for (let row = 0; row < 6; row++) {
        const rowYStart = 192 + row * 112
        if (y >= rowYStart && y <= rowYStart + 96) {
            if (x >= 32 && x <= 128) {
                customPercentages[row] = Math.min(100, customPercentages[row] + 5)
                drawCanvas(customCanvas, currentName, row)
                break
            }
            else if (x >= 672 && x <= 768) {
                customPercentages[row] = Math.max(0, customPercentages[row] - 5)
                drawCanvas(customCanvas, currentName, row)
                break
            }
            else if (x >= 128 && x <= 672 && y >= 208 + row * 112 && y <= 208 + row * 112 + 64) {
                const barX = x - 128
                const percentage = Math.round((barX / 544) * 100 / 5) * 5
                customPercentages[row] = Math.max(0, Math.min(100, percentage))
                drawCanvas(customCanvas, currentName, row)
                break
            }
        }
    }
}
function updateQuestionVisibility() {
    const selectedValues = Array.from(document.querySelectorAll("#valueSelectors img:not(.unselected)")).map(img => img.id.replace("Selector", ""))
    let visibleCount = 0
    document.querySelectorAll("questionCard").forEach(card => {
        const shouldShow = selectedValues.length === 0 || Array.from(card.querySelectorAll(".valueIcon")).some(icon =>
            selectedValues.includes(icon.dataset.value)
        )
        card.style.display = shouldShow ? "flex" : "none"
        if (shouldShow) visibleCount++
    })
    questionCardCount.textContent = `Showing ${visibleCount} of ${questions.length} questions`
}
function updateLister() {
    ideologies.forEach(ideology => {
        let totalScore = 0
        let totalWeight = 0
        for (let i = 0; i < 6; i++) {
            const delta = Math.abs(resultsPercentages[i] - ideology.stats[i])
            totalScore += axisWeights[i] * Math.pow(delta / 100, 3)
            totalWeight += axisWeights[i]
        }
        ideology.similarity = 100 - (totalScore / totalWeight * 100)
    })
    ideologies.sort((a, b) => b.similarity - a.similarity)
    const minSim = ideologies[ideologies.length - 1].similarity
    const range = 100 - minSim
    ideologies.forEach(ideology => {
        ideology.similarity = Math.round(((ideology.similarity - minSim) / range * 100) * 10) / 10
    })
    listHolder.innerHTML = ""
    ideologies.forEach((ideology, i) => {
        const listElement = document.createElement("listElement")
        listElement.textContent = `${ideology.name} (${ideology.similarity}%)`
        listElement.addEventListener("click", () => match(i))
        listHolder.appendChild(listElement)
        const option = document.createElement("option")
        option.value = i
        option.textContent = ideology.name
        matchesDropdown.appendChild(option)
    })
}
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const [questionsResponse, ideologiesResponse] = await Promise.all([
            fetch("./questions.json"),
            fetch("./ideologies.json")
        ])
        questions = await questionsResponse.json()
        ideologies = await ideologiesResponse.json()
        calculateMaxValues()
        questions.forEach((question, i) => {
            const questionCard = document.createElement("questionCard")
            questionCard.innerHTML = `${i + 1}. ${question.text}`
            const a = [{ p: "levelQuestion", n: "strataQuestion" }, { p: "commandQuestion", n: "demandQuestion" }, { p: "unityQuestion", n: "autonomyQuestion" }, { p: "volitionQuestion", n: "obligationQuestion" }, { p: "inclusionQuestion", n: "supremacyQuestion" }, { p: "sanctityQuestion", n: "noveltyQuestion" }]
            a.forEach(x => questionCard.classList.remove(x.p, x.n))
            const iconContainer = document.createElement("div")
            iconContainer.style.display = "flex"
            question.effect.forEach((e, j) => {
                if (e > 0) {
                    questionCard.classList.add(a[j].p)
                    for (let k = 0; k < e; k++)iconContainer.innerHTML += `<img src="./assets/icons/round/${values[j * 2]}.svg" class="valueIcon" data-value="${values[j * 2]}">`
                } else if (e < 0) {
                    questionCard.classList.add(a[j].n)
                    for (let k = 0; k < -e; k++)iconContainer.innerHTML += `<img src="./assets/icons/round/${values[j * 2 + 1]}.svg" class="valueIcon" data-value="${values[j * 2 + 1]}">`
                }
            })
            questionCard.appendChild(iconContainer)
            questionsHolder.appendChild(questionCard)
        })
        document.querySelectorAll("#valueSelectors img").forEach(icon => {
            icon.classList.add("unselected")
            icon.addEventListener("click", () => {
                icon.classList.toggle("unselected")
                updateQuestionVisibility()
            })
        })
        updateQuestion()
        updateQuestionVisibility()
        updateLister()
        document.fonts.ready.then(() => {
            drawCanvas(resultsCanvas)
            drawCanvas(matchesCanvas, ideologies[selectedIdeology].name)
            drawCanvas(customCanvas)
            customCanvas.addEventListener("click", handleCustomCanvasClick)
        })
        show("homeSection")
    } catch (error) {
        console.error("Error fetching resources:", error)
    }
})