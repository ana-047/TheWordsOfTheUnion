document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('gridContainer');

    const questionsAndAnswers = [
        { question: "Question 1", answer: "Answer 1" },
        { question: "Question 2", answer: "Answer 2" },
        { question: "Question 3", answer: "Answer 3" },
        { question: "Question 4", answer: "Answer 4" },
        { question: "Question 5", answer: "Answer 5" },
        { question: "Question 6", answer: "Answer 6" },
        { question: "Question 7", answer: "Answer 7" },
        { question: "Question 8", answer: "Answer 8" },
        { question: "Question 9", answer: "Answer 9" },
    ];

    // Define the number of rows and columns in the grid
    const numRows = 3;
    const numCols = 3;

    for (let row = 0; row < numRows; row++) {
        const gridRow = document.createElement('div');
        gridRow.classList.add('gridRow');

        for (let col = 0; col < numCols; col++) {
            const card_ff = document.createElement('div');
            card_ff.classList.add('card_ff');

            const index = row * numCols + col;
            const item = questionsAndAnswers[index];

            if (item) {
                const front = document.createElement('div');
                front.classList.add('front');
                front.innerText = item.question;

                const back = document.createElement('div');
                back.classList.add('back');
                back.innerText = item.answer;

                card_ff.appendChild(front);
                card_ff.appendChild(back);
            }

            gridRow.appendChild(card_ff);
        }

        gridContainer.appendChild(gridRow);
    }
});
