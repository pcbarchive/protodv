// Creates document elements.
function getElements() {
    return new Proxy({}, {
        get(_, prop) {
            return document.getElementById(prop)
        }
    })
}
const elements = getElements()
// The stuff below is to make variables global.
// The site data.
let data = {}
// The quiz questions.
var questions = []
// The possible ideologies.
let ideologies = []
// The axis weights.
const axisWeights = [1, 0.9, 1, 0.6, 0.6, 0.7]
// The toggle stuff.
orientationToggle.checked = false
let orientationIsToggled = false
proportionToggle.checked = false
let proportionIsToggled = false
// The maximum possible values for every axis.
let maxPossibleValues = [0, 0, 0, 0, 0, 0]
// The site's sections.
const sections = []
// The answers picked during the quiz.
let answers = []
// The sum of all picked answers for every axis.
let axisScores = []
// The percentages associated with the quiz itself.
let resultsPercentages = []
// The ideology given at the end of the quiz.
let resultIdeology = ""
// The ideology selected to display on the match canvas.
let selectedIdeology = 0
// The name given by the user for the custom results maker tool.
let customName = "Click to edit ideology name"
// The percentages associated with the custom results maker tool.
let customPercentages = [50, 50, 50, 50, 50, 50]
// Today.
const date = new Date().toISOString().slice(0, 10)
// Injects content.
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Gets the JSONs.
        const [dataResponse, questionsResponse, ideologiesResponse] = await Promise.all([
            fetch("./data.json"),
            fetch("./questions.json"),
            fetch("./ideologies.json")
        ])
        // Converts the JSONs to arrays.
        data = await dataResponse.json()
        questions = await questionsResponse.json()
        ideologies = await ideologiesResponse.json()
        // Calculates the maximum possible values for every axis.
        questions.forEach(q => {
            q.effect.forEach((val, i) => {
                maxPossibleValues[i] += Math.abs(val)
            })
        })
        // Extracts the sections.
        data.sectionNames.forEach(section => {
            sections.push(eval(section))
        })
        // Sets up the section CSS files.
        const style = document.createElement('style')
        style.textContent = data.sectionNames
            .map(section => `@import url('./styles/${section.replace('Section', '')}.css');`)
            .join('\n')
        document.head.appendChild(style)
        // Sets up the root color variables for the values.
        const root = document.documentElement
        data.valueColors.forEach((color, i) => {
            root.style.setProperty(`--${data.valueNames[i].toLowerCase()}`, color)
        })
        // Sorts ideologies alphabetically.
        ideologies = ideologies.sort((a, b) => a.name.localeCompare(b.name))
        // Automatically inject string data.
        Object.entries(data)
            .filter(([_, v]) => typeof v === "string")
            .forEach(([k, v]) => {
                document.getElementById(k) && (document.getElementById(k).innerText = v)
            })
        // Sets up the version easter egg.
        titleVersion.title = data.titleVersionEasterEgg[0]
        titleVersion.href = data.titleVersionEasterEgg[1]
        // Sets up the home values display and axis explanations.
        for (let i = 0; i < data.axisNames.length; i++) {
            // Home values display.
            const j = i * 2
            const [leftName, rightName] = data.valueNames.slice(j, j + 2)
            const [leftText, rightText] = data.valueExplanations.slice(j, j + 2)
            const axisCell = Object.assign(document.createElement("div"), { className: "gridCell" })
            const axisTitle = Object.assign(document.createElement("h3"), { textContent: data.axisNames[i] })
            const axisImages = Object.assign(document.createElement("div"), { className: "gridImageContainer" })
            for (const [index, name] of [leftName, rightName].entries()) {
                const a = Object.assign(document.createElement("a"), {
                    href: `#${name}`,
                    className: index % 2 === 0 ? "iconLeft" : "iconRight"
                })
                const img = Object.assign(document.createElement("img"), {
                    src: `./assets/images/values/paired/${name.toLowerCase()}.svg`,
                    className: index % 2 === 0 ? "iconLeft" : "iconRight"
                })
                a.appendChild(img)
                axisImages.appendChild(a)
            }
            axisCell.append(axisTitle, axisImages)
            homeValuesGrid.appendChild(axisCell)
            // Axis explanations.
            const makeExplanation = (title, text) => {
                const t = Object.assign(document.createElement("h3"), { id: title, innerText: title })
                t.style.color = `var(--${title.toLowerCase()})`
                const p = Object.assign(document.createElement("p"), { innerText: text })
                return Object.assign(document.createElement("div"), { className: "valueExplanation" }, { append: () => { } }), (() => {
                    const div = document.createElement("div")
                    div.className = "valueExplanation"
                    div.append(t, p)
                    return div
                })()
            }
            const leftValueExplanation = makeExplanation(leftName, leftText)
            const rightValueExplanation = makeExplanation(rightName, rightText)
            const explanationArrow = Object.assign(document.createElement("div"), { className: "valueExplanation" })
            explanationArrow.append(
                Object.assign(document.createElement("h4"), { innerText: data.axisNames[i] }),
                Object.assign(document.createElement("img"), { src: "./assets/images/interface/explanations/arrow.svg" })
            )
            const axisExplanation = Object.assign(document.createElement("div"), { className: "axisExplanation" })
            axisExplanation.append(leftValueExplanation, explanationArrow, rightValueExplanation)
            homeAxisExplanations.appendChild(axisExplanation)
        }
        // Sets up the home buttons.
        startButtonSpan.innerText = data.homeButtonNames[0]
        startButton.onclick = () => show(instructionsSection)
        const homeButtons = [...homeButtonContainer.getElementsByTagName("button")]
        for (let i = 1; i < homeButtons.length; i++) {
            const button = homeButtons[i]
            button.innerText = data.homeButtonNames[i]
            button.onclick = () => show(sections[i + 3])
        }
        // Sets up the orientation toggle.
        orientationToggle.addEventListener("change", function () {
            const display = orientationIsToggled ? ["none", "flex"] : ["flex", "none"]
            horizontalQuizButtons.style.display = display[0]
            verticalQuizButtons.style.display = display[1]
            orientationIsToggled = !orientationIsToggled
            setTimeout(() => { requestAnimationFrame(() => { quizTitle.scrollIntoView({ behavior: "smooth" }) }) }, 25)
        })
        // Sets up the proportion toggle.
        proportionToggle.addEventListener("change", function () {
            proportionIsToggled = !proportionIsToggled
            updateLister("lister")
        })
        // Sets up the lister percentage indicators.
        for (let i = 0; i < data.axisNames.length; i++) {
            const percentage = document.createElement("div")
            percentage.classList.add("listerPercentageHolder")
            const leftDiv = document.createElement("div")
            leftDiv.classList.add("listerPercentage", "listerPercentageLeft")
            leftDiv.style.backgroundColor = data.valueColors[i * 2]
            percentage.appendChild(leftDiv)
            const rightDiv = document.createElement("div")
            rightDiv.classList.add("listerPercentage", "listerPercentageRight")
            rightDiv.style.backgroundColor = data.valueColors[i * 2 + 1]
            percentage.appendChild(rightDiv)
            listerPercentages.appendChild(percentage)
        }
        // Sets up the matches ideology dropdown.
        ideologies.forEach((ideology, i) => {
            const option = document.createElement("option")
            option.value = i
            option.textContent = ideology.name
            matchesDropdown.appendChild(option)
        })
        matchesDropdown.addEventListener("change", function () {
            match(this.selectedIndex)
        })
        // Sets up the question value selectors.
        data.valueNames.forEach((value, i) => {
            const valueSelector = document.createElement("img")
            valueSelector.src = `./assets/images/values/paired/${value.toLowerCase()}.svg`
            valueSelector.id = `${value.toLowerCase()}Selector`
            if (i % 2 === 0) {
                valueSelector.classList.add("iconLeft")
            } else {
                valueSelector.classList.add("iconRight")
            }
            valueSelector.classList.add("unselected")
            valueSelector.addEventListener("click", () => {
                valueSelector.classList.toggle("unselected")
                updateQuestionVisibility()
            })
            valueSelectors.appendChild(valueSelector)
        })
        // Sets up the question cards display.
        questions.forEach((question, i) => {
            const questionCard = document.createElement("div")
            questionCard.classList.add("questionCard")
            questionCard.innerHTML = `<div class="questionText">${i + 1}. ${question.text}</div>`
            const a = [{ p: "levelQuestion", n: "strataQuestion" }, { p: "commandQuestion", n: "demandQuestion" }, { p: "unityQuestion", n: "autonomyQuestion" }, { p: "volitionQuestion", n: "obligationQuestion" }, { p: "inclusionQuestion", n: "supremacyQuestion" }, { p: "sanctityQuestion", n: "noveltyQuestion" }]
            a.forEach(x => questionCard.classList.remove(x.p, x.n))
            const questionIcons = document.createElement("div")
            questionIcons.classList.add("questionIcons")
            question.effect.forEach((e, j) => {
                if (e > 0) {
                    questionCard.classList.add(a[j].p)
                    for (let k = 0; k < e; k++)questionIcons.innerHTML += `<img src="./assets/images/values/round/${data.valueNames[j * 2].toLowerCase()}.svg" class="valueIcon">`
                } else if (e < 0) {
                    questionCard.classList.add(a[j].n)
                    for (let k = 0; k < -e; k++)questionIcons.innerHTML += `<img src="./assets/images/values/round/${data.valueNames[j * 2 + 1].toLowerCase()}.svg" class="valueIcon">`
                }
            })
            if (question.effect.filter(v => v !== 0).length > 1 || question.effect.some(v => Math.abs(v) > 1)) {
                const children = questionIcons.children
                for (let i = children.length - 1; i > 0; i--) {
                    const combo = document.createElement("img")
                    combo.src = "./assets/images/interface/questions/combo.svg"
                    combo.classList.add("comboIcon")
                    questionIcons.insertBefore(combo, children[i])
                }
            }
            questionCard.appendChild(questionIcons)
            questionsHolder.appendChild(questionCard)
        })
        // Sets up the archetype cubes.
        createCube(data.nouns, nounCube)
        createCube(data.adjectives, adjectiveCube)
        updateQuestionVisibility()
        document.fonts.ready.then(() => {
            show(homeSection)
            resetQuiz()
            drawCanvas(resultsCanvas)
            drawCanvas(matchesCanvas)
            drawCanvas(customCanvas)
            customCanvas.addEventListener("click", handleCustomCanvasClick)
        })
    } catch (error) {
        // For if fetching the data doesn't work.
        console.error("Error fetching resources:", error)
    }
})
// Shows a given section and sets up its back buttons.
function show(section, back = homeSection) {
    // Section.
    window.scrollTo({ top: 0, behavior: "instant" })
    sections.forEach(s => {
        s.style.display = "none"
    })
    section.style.display = "flex"
    if (section === homeSection) {
        titleSection.style.zoom = "1"
    } else {
        titleSection.style.zoom = ".6"
    }
    // Buttons.
    const backButtons = section.getElementsByClassName("back")
    Array.from(backButtons).forEach(button => {
        button.onclick = null
        if (section === quizSection) {
            button.onclick = () => quizBack()
        } else {
            button.onclick = () => show(back)
        }
    })
}
// Empties the quiz's accumulated data.
function resetQuiz() {
    answers = []
    updateQuestion()
    axisScores = [0, 0, 0, 0, 0, 0]
    resultsPercentages = [50, 50, 50, 50, 50, 50]
    updateLister("results")
}
// Handles the quiz's opinion buttons.
function addScore(opinion) {
    questions[answers.length].effect.forEach((effect, axis) => {
        axisScores[axis] += effect * opinion
    })
    answers.push(opinion)
    // When the quiz is finished.
    if (answers.length >= questions.length) {
        calculateResults()
        drawCanvas(resultsCanvas)
        show(resultsSection)
    } else {
        updateQuestion()
    }
}
// Adjusts the quiz interfact for the current question.
function updateQuestion() {
    question.textContent = questions[answers.length].text
    counter.textContent = `Question ${answers.length + 1} of ${questions.length}`
    progressBarIndicator.style.width = (60 * (answers.length / (questions.length - 1))) + "vw"
}
// Handles the quiz's back button.
function quizBack() {
    if (answers.length > 0) {
        const latestAnswer = answers.pop()
        questions[answers.length].effect.forEach((effect, axis) => {
            axisScores[axis] -= effect * latestAnswer
        })
        updateQuestion()
    } else {
        show(instructionsSection)
    }
}
// Input percentages, get the associated archetype.
function archetype(percentages) {
    let thirds = [0, 0, 0, 0, 0, 0]
    for (let i in percentages) {
        if (percentages[i] <= 30) {
            thirds[i] = 1
        } else if (percentages[i] >= 70) {
            thirds[i] = -1
        }
    }
    const nounIndex = (thirds[2] + 1) * 9 + (thirds[1] + 1) * 3 + (thirds[0] + 1)
    const adjectiveIndex = (thirds[5] + 1) * 9 + (thirds[4] + 1) * 3 + (thirds[3] + 1)
    return `The ${data.adjectives[adjectiveIndex]} ${data.nouns[nounIndex]}`
}
// Takes the data from the test and converts it into percentages.
function calculateResults() {
    for (let i = 0; i < 6; i++) {
        const percentage = 50 + (axisScores[i] / maxPossibleValues[i]) * 50
        resultsPercentages[i] = Math.round(percentage * 10) / 10
    }
    updateLister("results")
}
function drawCanvas(canvasId, rowToUpdate = null) {
    const ctx = canvasId.getContext("2d")
    if (canvasId === resultsCanvas) {
        name = resultIdeology
        canvasType = "Taken"
        percentages = resultsPercentages
    } else if (canvasId === matchesCanvas) {
        name = ideologies[selectedIdeology].name
        canvasType = "Viewed"
        percentages = ideologies[selectedIdeology].stats
    } else if (canvasId === customCanvas) {
        name = customName
        canvasType = "Generated"
        percentages = customPercentages
    }
    ctx.textBaseline = "top"
    ctx.fillStyle = "hsl(0 0% 12.5%)"
    if (rowToUpdate === null) {
        ctx.fillRect(0, 0, 800, 960)
    } else {
        ctx.fillRect(32, 32, 736, 200)
    }
    ctx.fillStyle = "hsl(0 0% 100%)"
    ctx.textAlign = "right"
    ctx.font = "16px brandontext"
    ctx.fillText("quark88.github.io/dozenvalues", 768, 32)
    ctx.fillText('Version 7.0.0 "Lovecraft"', 768, 56)
    ctx.fillText(`${canvasType} on ${date}`, 768, 80)
    ctx.textAlign = "left"
    ctx.font = "64px cocogoose"
    ctx.fillText("DozenValues", 32, 40)
    ctx.font = "48px brandontext"
    ctx.fillText(archetype(percentages), 32, 112)
    ctx.fillText(name, 32, 176)
    if (rowToUpdate === null) {
        for (x = 0; x < data.axisNames.length; x++) {
            ctx.fillStyle = "hsl(0 0% 0%)"
            ctx.fillRect(128, 288 + x * 112, 544, 64)
            ctx.font = "24px brandontext"
            ctx.textAlign = "center"
            ctx.fillStyle = "hsl(0 0% 100%)"
            ctx.fillText(`${data.axisNames[x]} axis`, 400, 260 + x * 112)
            drawRowValues(ctx, x, percentages[x])
        }
    } else {
        ctx.fillStyle = "hsl(0 0% 0%)"
        ctx.fillRect(128, 288 + rowToUpdate * 112, 544, 64)
        drawRowValues(ctx, rowToUpdate, percentages[rowToUpdate])
    }
}
function drawRowValues(ctx, row, percentage) {
    [0, 1].forEach(position => {
        const xPos = 128 + position * ((544 - 6) * (percentage / 100) + 6)
        const width = (544 - 6) * Math.abs((position * 100 - percentage) / 100)
        ctx.fillStyle = data.valueColors[row * 2 + position]
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
    ctx.fillText(`${p.toFixed(1)}%`, x, 306 + row * 112)
}
function drawIcon(ctx, row, position) {
    const icon = new Image()
    icon.src = `./assets/images/values/paired/${data.valueNames[row * 2 + position].toLowerCase()}.svg`
    icon.onload = () => ctx.drawImage(icon, 32 + position * 640, 272 + row * 112, 96, 96)
}
function resetCustom() {
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
        const newName = prompt("Enter new ideology name:", customName)
        if (newName !== null && newName.trim() !== "") {
            customName = newName
            drawCanvas(customCanvas)
        }
        return
    }
    for (let row = 0; row < 6; row++) {
        const rowYStart = 272 + row * 112
        if (y >= rowYStart && y <= rowYStart + 96) {
            if (x >= 32 && x <= 128) {
                customPercentages[row] = Math.min(100, customPercentages[row] + 5)
                drawCanvas(customCanvas, row)
                break
            }
            else if (x >= 672 && x <= 768) {
                customPercentages[row] = Math.max(0, customPercentages[row] - 5)
                drawCanvas(customCanvas, row)
                break
            }
            else if (x >= 128 && x <= 672 && y >= 288 + row * 112 && y <= 288 + row * 112 + 64) {
                const barX = x - 128
                const percentage = Math.round((barX / 544) * 100 / 5) * 5
                customPercentages[row] = Math.max(0, Math.min(100, percentage))
                drawCanvas(customCanvas, row)
                break
            }
        }
    }
}
function match(ideologyIndex) {
    if (ideologyIndex >= ideologies.length) {
        selectedIdeology = 0
    } else if (ideologyIndex < 0) {
        selectedIdeology = ideologies.length - 1
    } else {
        selectedIdeology = ideologyIndex
    }
    matchesDropdown.selectedIndex = selectedIdeology
    drawCanvas(matchesCanvas)
    if (!matchesSection.classList.contains("activeSection")) {
        show(matchesSection)
    }
}
function updateQuestionVisibility() {
    const selectedValues = Array.from(document.querySelectorAll("#valueSelectors img:not(.unselected)")).map(img => img.id.replace("Selector", ""))
    let visibleCount = 0
    document.querySelectorAll(".questionCard").forEach(card => {
        const shouldShow = selectedValues.length === 0 ||
            selectedValues.some(value => card.classList.contains(`${value}Question`))
        card.style.display = shouldShow ? "flex" : "none"
        if (shouldShow) visibleCount++
    })
    questionCardCount.textContent = `Showing ${visibleCount} of ${questions.length} questions`
}
function updateLister(listerSource) {
    proportionType = proportionIsToggled ? "absolute" : "relative"
    proportionTypeIndicator.textContent = `Showing ${proportionType} percentages`
    if (listerSource == "matches") {
        percentages = ideologies[selectedIdeology].stats
    } else if (listerSource == "custom") {
        percentages = customPercentages
    } else if (listerSource == "results") {
        percentages = resultsPercentages
    }
    const percentageIndicators = document.getElementsByClassName("listerPercentage")
    for (let i = 0; i < data.axisNames.length; i++) {
        percentageIndicators[i * 2].textContent = percentages[i].toFixed(1) + "%"
        percentageIndicators[i * 2 + 1].textContent = (100 - percentages[i]).toFixed(1) + "%"
    }
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
    sortedIdeologies.forEach((ideology, i) => {
        const listElement = document.createElement("div")
        listElement.classList.add("listElement")
        listElement.textContent = `${i + 1}. ${ideology.name} (${Math.round(ideology.similarity).toFixed(1)}%)`
        listElement.addEventListener("click", () => match(ideology.originalIndex, true))
        listHolder.appendChild(listElement)
    })
    resultIdeology = sortedIdeologies[0].name
}
function createCube(textData, cube) {
    const layers = [0, 1, 2].map(() => {
        const d = document.createElement("div")
        d.className = "cubeLayer"
        return d
    })
    let displayData = textData
    let cubeColors = data.valueColors.slice(cube === nounCube ? 0 : 6, cube === nounCube ? 6 : 12)
    if (cube !== nounCube) {
        cubeColors = [cubeColors[2], cubeColors[3], cubeColors[4], cubeColors[5], cubeColors[1], cubeColors[0]]
        displayData = new Array(27)
        for (let x = 0; x < 27; x++) {
            const layer = Math.floor(x / 9)
            const row = Math.floor((x % 9) / 3)
            const col = x % 3
            const index = (2 - col) * 9 + (2 - row) * 3 + (2 - layer)
            displayData[x] = textData[index]
        }
    }
    const rgbColors = cubeColors.map(h => {
        const hex = h[0] === "#" ? h.slice(1) : h
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16)
        }
    })
    for (let x = 0; x < 27; x++) {
        const cell = document.createElement("div")
        cell.className = "cubeCell"
        if (cube === nounCube) cell.innerHTML = `The<br>${displayData[x]}`
        else cell.textContent = displayData[x]
        let sr = 0, sg = 0, sb = 0, count = 0
        const posInThree = x % 3
        if (posInThree === 0) { const c = rgbColors[0]; sr += c.r; sg += c.g; sb += c.b; count += 1 }
        else if (posInThree === 2) { const c = rgbColors[1]; sr += c.r; sg += c.g; sb += c.b; count += 1 }
        else { sr += rgbColors[0].r + rgbColors[1].r; sg += rgbColors[0].g + rgbColors[1].g; sb += rgbColors[0].b + rgbColors[1].b; count += 2 }
        const posInNine = Math.floor((x % 9) / 3)
        if (posInNine === 0) { const c = rgbColors[2]; sr += c.r; sg += c.g; sb += c.b; count += 1 }
        else if (posInNine === 2) { const c = rgbColors[3]; sr += c.r; sg += c.g; sb += c.b; count += 1 }
        else { sr += rgbColors[2].r + rgbColors[3].r; sg += rgbColors[2].g + rgbColors[3].g; sb += rgbColors[2].b + rgbColors[3].b; count += 2 }
        const layerIndex = Math.floor(x / 9)
        if (layerIndex === 0) { const c = rgbColors[4]; sr += c.r; sg += c.g; sb += c.b; count += 1 }
        else if (layerIndex === 2) { const c = rgbColors[5]; sr += c.r; sg += c.g; sb += c.b; count += 1 }
        else { sr += rgbColors[4].r + rgbColors[5].r; sg += rgbColors[4].g + rgbColors[5].g; sb += rgbColors[4].b + rgbColors[5].b; count += 2 }
        const r = Math.round(sr / count)
        const g = Math.round(sg / count)
        const b = Math.round(sb / count)
        const hex = (r << 16 | g << 8 | b).toString(16).padStart(6, "0")
        cell.style.backgroundColor = `#${hex}`
        layers[Math.floor(x / 9)].appendChild(cell)
    }
    layers.forEach(l => cube.appendChild(l))
}
