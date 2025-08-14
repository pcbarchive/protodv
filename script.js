function getElements() {
    return new Proxy({}, {
        get(_, prop) {
            return document.getElementById(prop)
        }
    })
}
const elements = getElements()
const { quizTitle, counter, progressBarIndicator, question, verticalQuizButtons, horizontalQuizButtons, orientationToggle, resultsCanvas, matchesCanvas, matchesDropdown, valueSelectors, proportionToggle, proportionTypeIndicator, listerPercentages, listHolder, customCanvas } = elements
const date = new Date().toISOString().slice(0, 10)
const axisWeights = [1, 0.9, 1, 0.6, 0.6, 0.7]
let questions, ideologies
let maxPossibleValues = [0, 0, 0, 0, 0, 0]
let selectedIdeology = 0
let sortedIdeologies = []
let listerSource = "results"
let matchesPercentages = []
orientationToggle.checked = false
let orientationIsToggled = false
proportionToggle.checked = false
let proportionIsToggled = false
let proportionType = "relative"
let currentName = "Click to edit name"
let customPercentages = [50, 50, 50, 50, 50, 50]
function calculateMaxValues() {
    questions.forEach(q => {
        q.effect.forEach((val, i) => {
            maxPossibleValues[i] += Math.abs(val)
        })
    })
}
function resetQuiz() {
    progression = 0
    answers = []
    axisScores = [0, 0, 0, 0, 0, 0]
    resultsPercentages = [50, 50, 50, 50, 50, 50]
    updateLister()
    updateQuestion()
}
function show(section, listerSourceInput = "results") {
    window.scrollTo({ top: 0, behavior: "instant" })
    sectionNames.forEach(id => document.getElementById(id).classList.remove("active"))
    document.getElementById(section).classList.add("active")
    listerSource = listerSourceInput
    if (section == "listerSection") {
        updateLister()
    }
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
orientationToggle.addEventListener("change", function () {
    const display = orientationIsToggled ? ["none", "flex"] : ["flex", "none"]
    horizontalQuizButtons.style.display = display[0]
    verticalQuizButtons.style.display = display[1]
    orientationIsToggled = !orientationIsToggled
    setTimeout(() => { requestAnimationFrame(() => { quizTitle.scrollIntoView({ behavior: "smooth" }) }) }, 25)
})
proportionToggle.addEventListener("change", function () {
    proportionType = proportionIsToggled ? "relative" : "absolute"
    proportionIsToggled = !proportionIsToggled
    updateLister()
})
function archetype(results) {
    let thirds = [0, 0, 0, 0, 0, 0]
    for (let i in results) {
        if (results[i] <= 30) {
            thirds[i] = 1
        } else if (results[i] >= 70) {
            thirds[i] = -1
        }
    }
    const nounIndex = (thirds[2] + 1) * 9 + (thirds[1] + 1) * 3 + (thirds[0] + 1)
    const adjectiveIndex = (thirds[5] + 1) * 9 + (thirds[4] + 1) * 3 + (thirds[3] + 1)
    return `The ${adjectives[adjectiveIndex]} ${nouns[nounIndex]}`
}
function match(ideologyIndex, showSection) {
    if (ideologyIndex >= ideologies.length) {
        selectedIdeology = 0
    } else if (ideologyIndex < 0) {
        selectedIdeology = ideologies.length - 1
    } else {
        selectedIdeology = ideologyIndex
    }
    matchesDropdown.selectedIndex = selectedIdeology
    matchesPercentages = [...ideologies[selectedIdeology].stats]
    const ctx = matchesCanvas.getContext("2d")
    ctx.clearRect(0, 0, matchesCanvas.width, matchesCanvas.height)
    drawCanvas(matchesCanvas, ideologies[selectedIdeology].name)
    if (showSection) { show("matchesSection") }
}
function drawCanvas(canvas, name = null, rowToUpdate = null) {
    const ctx = canvas.getContext("2d")
    const percentages = getPercentages(canvas)
    const displayName = getDisplayName(canvas, name)
    if (rowToUpdate === null) {
        drawFullCanvas(ctx, canvas, displayName)
    } else {
        ctx.font = "48px brandontext"
        ctx.fillStyle = "hsl(0 0% 12.5%)"
        ctx.fillRect(32, 106, 736, 64)
        ctx.fillStyle = "hsl(0 0% 100%)"
        ctx.textAlign = "left"
        ctx.fillText(archetype(percentages), 32, 154)
    }
    const rowsToDraw = rowToUpdate !== null ? [rowToUpdate] : [...Array(6).keys()]
    rowsToDraw.forEach(row => {
        drawRowBackground(ctx, row)
        drawRowValues(ctx, row, percentages[row])
        if (rowToUpdate === null) {
            drawAxisLabel(ctx, row)
        }
    })
    function getPercentages(canvas) {
        if (canvas === resultsCanvas) return resultsPercentages
        if (canvas === customCanvas) return customPercentages
        return matchesPercentages
    }
    function getDisplayName(canvas, name) {
        if (canvas === resultsCanvas) return sortedIdeologies[0].name
        if (canvas === customCanvas) return currentName
        return name || "Missing name"
    }
    function drawFullCanvas(ctx, canvas, displayName) {
        ctx.fillStyle = "hsl(0 0% 12.5%)"
        ctx.fillRect(0, 0, 800, 960)
        ctx.fillStyle = "hsl(0 0% 100%)"
        ctx.textAlign = "right"
        ctx.font = "16px brandontext"
        ctx.fillText("quark88.github.io/dozenvalues", 768, 40)
        ctx.fillText('Version 7.0.0 "Lovecraft"', 768, 64)
        ctx.fillText(getDateInfo(canvas) + date, 768, 88)
        ctx.textAlign = "left"
        ctx.font = "64px cocogoose"
        ctx.fillText("DozenValues", 32, 80)
        ctx.font = "48px brandontext"
        ctx.fillText(archetype(percentages), 32, 154)
        ctx.fillText(displayName, 32, 224)
        function getDateInfo(canvas) {
            if (canvas === resultsCanvas) return "Taken on "
            if (canvas === customCanvas) return "Generated on "
            return "Viewed on "
        }
    }
    function drawRowBackground(ctx, row) {
        ctx.fillStyle = "hsl(0 0% 0%)"
        ctx.fillRect(128, 288 + row * 112, 544, 64)
    }
    function drawAxisLabel(ctx, row) {
        ctx.font = "24px brandontext"
        ctx.textAlign = "center"
        ctx.fillStyle = "hsl(0 0% 100%)"
        ctx.fillText(`${axisNames[row]} axis`, 400, 272 + row * 112)
    }
    function drawRowValues(ctx, row, percentage) {
        [0, 1].forEach(position => {
            const xPos = 128 + position * ((544 - 6) * (percentage / 100) + 6)
            const width = (544 - 6) * Math.abs((position * 100 - percentage) / 100)
            ctx.fillStyle = valueColors[row * 2 + position]
            ctx.fillRect(xPos, 294 + row * 112, width, 52)
            const p = position === 0 ? percentage : 100 - percentage
            if (p >= 25) {
                drawPercentageText(ctx, position, row, p)
            }
            drawIcon(ctx, row, position)
        })
    }
    function drawPercentageText(ctx, position, row, p) {
        const x = position === 0 ? 136 : 664
        ctx.fillStyle = "hsl(0 0% 0%)"
        ctx.font = "32px brandontext"
        ctx.textAlign = position === 0 ? "left" : "right"
        ctx.fillText(`${p.toFixed(1)}%`, x, 332 + row * 112)
    }
    function drawIcon(ctx, row, position) {
        const icon = new Image()
        icon.src = `./assets/icons/${valueNames[row * 2 + position].toLowerCase()}.svg`
        icon.onload = () => ctx.drawImage(icon, 32 + position * 640, 272 + row * 112, 96, 96)
    }
}
function resetCustom() {
    currentName = "Click to edit name"
    customPercentages = [50, 50, 50, 50, 50, 50]
    drawCanvas(customCanvas)
}
function randomCustom() {
    customPercentages.forEach((_, i) => {
        customPercentages[i] = Math.floor((50 + (Math.random() + Math.random() - 1) * 50) / 5) * 5
    })
    drawCanvas(customCanvas)
}
function handleCustomCanvasClick(e) {
    const rect = customCanvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (customCanvas.width / rect.width)
    const y = (e.clientY - rect.top) * (customCanvas.height / rect.height)
    if (x >= 32 && x <= 768 && y >= 186 && y <= 224) {
        const newName = prompt("Enter new ideology name:", currentName)
        if (newName !== null && newName.trim() !== "") {
            currentName = newName
            drawCanvas(customCanvas)
        }
        return
    }
    for (let row = 0; row < 6; row++) {
        const rowYStart = 272 + row * 112
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
            else if (x >= 128 && x <= 672 && y >= 288 + row * 112 && y <= 288 + row * 112 + 64) {
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
    proportionTypeIndicator.textContent = `Showing ${proportionType} percentages`
    if (listerSource == "matches") {
        percentages = ideologies[selectedIdeology].stats
    } else if (listerSource == "custom") {
        percentages = customPercentages
    } else {
        percentages = resultsPercentages
    }
    listerPercentages.innerHTML = ""
    percentages.forEach((p, i) => {
        const percentage = document.createElement("listerPercentage")
        const leftDiv = document.createElement("div")
        const rightDiv = document.createElement("div")
        leftDiv.style.backgroundColor = valueColors[i * 2]
        leftDiv.style.borderTopLeftRadius = ".5vw"
        leftDiv.style.borderBottomLeftRadius = ".5vw"
        leftDiv.textContent = p.toFixed(1) + "%"
        rightDiv.style.backgroundColor = valueColors[i * 2 + 1]
        rightDiv.style.borderTopRightRadius = ".5vw"
        rightDiv.style.borderBottomRightRadius = ".5vw"
        rightDiv.textContent = (100 - p).toFixed(1) + "%"
        percentage.appendChild(leftDiv)
        percentage.appendChild(rightDiv)
        listerPercentages.appendChild(percentage)
    })
    let maxScore = 0
    let totalWeight = 0
    for (let i = 0; i < 6; i++) {
        const furthestDelta = Math.max(percentages[i], 100 - percentages[i])
        maxScore += axisWeights[i] * Math.pow(furthestDelta / 100, 3)
        totalWeight += axisWeights[i]
    }
    ideologies.forEach(ideology => {
        let totalScore = 0
        for (let i = 0; i < 6; i++) {
            const delta = Math.abs(percentages[i] - ideology.stats[i])
            totalScore += axisWeights[i] * Math.pow(delta / 100, 3)
        }
        let similarity
        if (proportionType === "absolute") {
            const normalizedScore = totalScore / totalWeight
            const normalizedMax = maxScore / totalWeight
            similarity = 100 * (1 - (normalizedScore / normalizedMax))
        } else if (proportionType === "relative") {
            const worstScore = Math.max(...ideologies.map(ideology => {
                let score = 0
                for (let i = 0; i < 6; i++) {
                    const delta = Math.abs(percentages[i] - ideology.stats[i])
                    score += axisWeights[i] * Math.pow(delta / 100, 3)
                }
                return score
            }))
            similarity = 100 * (1 - (totalScore / worstScore))
        }
        ideology.similarity = parseFloat(similarity.toFixed(1))
    })
    listHolder.innerHTML = ""
    sortedIdeologies = [...ideologies].sort((a, b) => b.similarity - a.similarity)
    ideologies.forEach((ideology, i) => {
        ideology.originalIndex = i
    })
    sortedIdeologies.forEach((ideology) => {
        const listElement = document.createElement("listElement")
        listElement.textContent = `${ideology.name} (${Math.round(ideology.similarity).toFixed(1)}%)`
        listElement.addEventListener("click", () => match(ideology.originalIndex, true))
        listHolder.appendChild(listElement)
    })
}
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const [dataResponse, questionsResponse, ideologiesResponse] = await Promise.all([
            fetch("./data.json"),
            fetch("./questions.json"),
            fetch("./ideologies.json")
        ])
        const data = await dataResponse.json()
        questions = await questionsResponse.json()
        ideologies = await ideologiesResponse.json()
        ideologies.sort((a, b) => a.name.localeCompare(b.name))
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === "string") {
                document.getElementById(key).innerText = value
            }
        })
        versionText.title = data.versionEasterEgg[0]
        versionText.href = data.versionEasterEgg[1]
        window.sectionNames = data.sectionNames
        window.axisNames = data.axisNames
        window.valueNames = data.valueNames
        window.valueColors = data.valueColors
        const cells = document.querySelectorAll("#valueGrid > cell")
        data.axisNames.forEach((name, index) => {
            cells[index].insertAdjacentHTML("afterbegin", name)
        })
        const homeButtonNames = document.querySelectorAll(".homeButton")
        homeButtonNames.forEach((homeButtonName, i) => {
            homeButtonName.textContent = data.homeButtonNames[i]
        })
        const axisExplanations = document.querySelectorAll("#axisExplanations > axisExplanation")
        let i = 0
        axisExplanations.forEach(axisExplanation => {
            const values = axisExplanation.querySelectorAll("value")
            const axisArrow = axisExplanation.querySelector("axisArrow")
            values[0].querySelector("valueName").textContent = data.valueNames[i].toLowerCase()
            values[0].querySelector("valueDescription").textContent = data.valueExplanations[i]
            i++
            const axisIndex = Array.from(axisExplanations).indexOf(axisExplanation)
            axisArrow.innerHTML = `${data.axisNames[axisIndex]}<img src="./assets/icons/arrow.svg">`
            values[1].querySelector("valueName").textContent = data.valueNames[i].toLowerCase()
            values[1].querySelector("valueDescription").textContent = data.valueExplanations[i]
            i++
        })
        window.adjectives = data.adjectives
        window.nouns = data.nouns
        ideologies.forEach((ideology, i) => {
            const option = document.createElement("option")
            option.value = i
            option.textContent = ideology.name
            matchesDropdown.appendChild(option)
        })
        matchesDropdown.addEventListener("change", function () {
            match(this.selectedIndex)
        })
        calculateMaxValues()
        valueNames.forEach((value, i) => {
            const valueSelector = document.createElement("img")
            valueSelector.src = `./assets/icons/${value.toLowerCase()}.svg`
            valueSelector.id = `${value.toLowerCase()}Selector`
            if (i % 2 === 0) {
                valueSelector.classList.add("gridIconLeft")
            } else {
                valueSelector.classList.add("gridIconRight")
            }
            valueSelector.classList.add("unselected")
            valueSelector.addEventListener("click", () => {
                valueSelector.classList.toggle("unselected")
                updateQuestionVisibility()
            })
            valueSelectors.appendChild(valueSelector)
        })
        questions.forEach((question, i) => {
            const questionCard = document.createElement("questionCard")
            questionCard.innerHTML = `${i + 1}. ${question.text}`
            const a = [{ p: "levelQuestion", n: "strataQuestion" }, { p: "commandQuestion", n: "demandQuestion" }, { p: "unityQuestion", n: "autonomyQuestion" }, { p: "volitionQuestion", n: "obligationQuestion" }, { p: "inclusionQuestion", n: "supremacyQuestion" }, { p: "sanctityQuestion", n: "noveltyQuestion" }]
            a.forEach(x => questionCard.classList.remove(x.p, x.n))
            const questionIcons = document.createElement("div")
            questionIcons.classList.add("questionIcons")
            question.effect.forEach((e, j) => {
                if (e > 0) {
                    questionCard.classList.add(a[j].p)
                    for (let k = 0; k < e; k++)questionIcons.innerHTML += `<img src="./assets/icons/round/${valueNames[j * 2].toLowerCase()}.svg" class="valueIcon" data-value="${valueNames[j * 2].toLowerCase()}">`
                } else if (e < 0) {
                    questionCard.classList.add(a[j].n)
                    for (let k = 0; k < -e; k++)questionIcons.innerHTML += `<img src="./assets/icons/round/${valueNames[j * 2 + 1].toLowerCase()}.svg" class="valueIcon" data-value="${valueNames[j * 2 + 1].toLowerCase()}">`
                }
            })
            if (question.effect.filter(v => v !== 0).length > 1 || question.effect.some(v => Math.abs(v) > 1)) {
                const children = questionIcons.children
                for (let i = children.length - 1; i > 0; i--) {
                    const combo = document.createElement("img")
                    combo.src = "./assets/icons/combo.svg"
                    combo.classList.add("comboIcon")
                    questionIcons.insertBefore(combo, children[i])
                }
            }
            questionCard.appendChild(questionIcons)
            questionsHolder.appendChild(questionCard)
        })
        resetQuiz()
        updateQuestionVisibility()
        match(selectedIdeology)
        document.fonts.ready.then(() => {
            drawCanvas(resultsCanvas)
            drawCanvas(matchesCanvas, ideologies[selectedIdeology].name)
            resetCustom()
            customCanvas.addEventListener("click", handleCustomCanvasClick)
            show("homeSection")
        })
    } catch (error) {
        console.error("Error fetching resources:", error)
    }
})
/*document.addEventListener("keydown", event => {
    const key = event.key
    const isVisible = section => section.classList.contains("active")
    if ((isVisible(customSection) || isVisible(aboutSection) || isVisible(treeSection)) && (key === "Backspace" || key === "0")) {
        show("homeSection")
    } else if (isVisible(home)) { // Otherwise, if the home section is displayed:
        switch (key) {
            // Enter and one brings you to the quiz section.
            case "Enter":
            case "1":
                show("quizSection")
                break
            // Two brings you to the create section.
            case "2":
                show("createSection")
                break
            // Three brings you to the about section.
            case "3":
                show("about")
                break
            // Four brings you to the tree section.
            case "4":
                show("tree")
                break
        }
    } else if (isVisible(quizSection)) { // Otherwise, if the quiz section is displayed:
        if (key === "0" || key === "Backspace") { // Backspace or zero triggers the previous event.
            quizBack.click()
        } else { // Otherwise, numbers one to five triggers their corresponding button's event.
            const buttonMap = { "1": button1, "2": button2, "3": button3, "4": button4, "5": button5 }
            if (buttonMap[key] && buttonMap[key].style.display === "flex") {
                buttonMap[key].click()
            }
        }
    } else if (isVisible(resultsSection)) { // Otherwise, if the results section is displayed:
        if (key === "0" || key === "Backspace") { // Zero or backspace triggers the previous event.
            resultsBack.click()
        }
    }
})*/