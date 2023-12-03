document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('gridContainer');

    const questionsAndAnswers = [
        { question: "", answer: "Answer 1" },
        { question: "Question 2", answer: "Answer 2" },
        { question: "Question 3", answer: "Answer 3" },
        { question: "Question 4", answer: "Answer 4" },
        { question: "Question 5", answer: "Answer 5" },
        { question: "Question 6", answer: "Answer 6" },
        { question: "Question 7", answer: "Answer 7" },
        { question: "Question 8", answer: "Answer 8" },
        { question: "Question 9", answer: "Answer 9" },
    ];

    questionsAndAnswers.forEach((item, index) => {
        const card_ff = document.createElement('div');
        card_ff.classList.add('card_ff');

        const front = document.createElement('div');
        front.classList.add('front');
        front.innerText = item.question;

        const back = document.createElement('div');
        back.classList.add('back');
        back.innerText = item.answer;

        card_ff.appendChild(front);
        card_ff.appendChild(back);

        gridContainer.appendChild(card_ff);
    });
});
