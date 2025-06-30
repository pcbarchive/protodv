const fs = require('fs');

function generateQuestions() {
    const axisNames = [
        ["Level", "Strata"],
        ["Command", "Demand"],
        ["Unity", "Autonomy"],
        ["Volition", "Obligation"],
        ["Inclusion", "Supremacy"],
        ["Sanctity", "Novelty"]
    ];

    const questions = [];
    const counts = {};

    // Generate single-value questions (24 + 24 + 12 + 12 = 72 questions)
    const singleValueCases = [
        { value: 1, count: 4 },
        { value: -1, count: 4 },
        { value: 2, count: 2 },
        { value: -2, count: 2 }
    ];

    singleValueCases.forEach(({ value, count }) => {
        for (let axis = 0; axis < 6; axis++) {
            for (let i = 0; i < count; i++) {
                const effect = [0, 0, 0, 0, 0, 0];
                effect[axis] = value;
                
                const nameBase = axisNames[axis][value > 0 ? 0 : 1];
                const nameCount = (counts[nameBase] || 0) + 1;
                counts[nameBase] = nameCount;
                
                questions.push({
                    text: `${nameBase} ${nameCount}`,
                    effect: effect
                });
            }
        }
    });

    // Generate two-value questions (60 questions)
    const twoValueCases = [
        { value1: 1, value2: 1 },
        { value1: 1, value2: -1 },
        { value1: -1, value2: 1 },
        { value1: -1, value2: -1 }
    ];

    // Generate all unique axis pairs
    for (let axis1 = 0; axis1 < 6; axis1++) {
        for (let axis2 = axis1 + 1; axis2 < 6; axis2++) {
            twoValueCases.forEach(({ value1, value2 }) => {
                const effect = [0, 0, 0, 0, 0, 0];
                effect[axis1] = value1;
                effect[axis2] = value2;
                
                const name1 = axisNames[axis1][value1 > 0 ? 0 : 1];
                const name2 = axisNames[axis2][value2 > 0 ? 0 : 1];
                const combinedName = `${name1} ${name2}`;
                
                const nameCount = (counts[combinedName] || 0) + 1;
                counts[combinedName] = nameCount;
                
                questions.push({
                    text: `${combinedName} ${nameCount}`,
                    effect: effect
                });
            });
        }
    }

    return questions;
}

const questions = generateQuestions();
const jsonString = JSON.stringify(questions, null, 2);

// Save to file
fs.writeFile('questions.json', jsonString, (err) => {
    if (err) {
        console.error('Error writing file:', err);
    } else {
        console.log('Successfully generated questions.json');
    }
});