const questionFieldsContainer = document.getElementById("questionFields");
const addQuestionButton = document.getElementById("addQuestion");

function generateQuestionField(questionType, questionNumber) {
    let questionField;
    if (questionType === "multiple_choice") {
        questionField = `
<div class="questionField" data-question-type="${questionType}">
<label for="question${questionNumber}Text">Question ${questionNumber}</label>
<input type="text" id="question${questionNumber}Text" required placeholder="Enter Survey Description" class="form-control">
<br>
<div class="choicesContainer">
<label>Option 1:</label>
<input type="text" class="choiceText custom-input" required>
    <button type="button" class="removeChoice btn btn-danger">-</button>
</div>
<div class="choicesContainer">
<label>Option 2:</label>
<input type="text" class="choiceText custom-input" required>
    <button type="button" class="removeChoice btn btn-danger">-</button>
</div>

<button type="button" class="addChoice btn btn-primary">Add Choice</button>
<button type="button" class="deleteQuestion btn btn-danger">Delete Question</button>
</div>
`;
    } else if (questionType === "short_answers") {
        questionField = `
<div class="questionField" data-question-type="${questionType}">
<label for="shortAnswer${questionNumber}Text">Question ${questionNumber}</label>
<br>
<textarea id="shortAnswer${questionNumber}Text" class="form-control" required placeholder="Enter Question Description"></textarea>
<input type="hidden" name="shortAnswer${questionNumber}" value="">
<button type="button" class="deleteQuestion btn btn-danger">Delete Question</button>
</div>
`;
    }
    questionFieldsContainer.insertAdjacentHTML("beforeend", questionField);
}

function addQuestion() {
    const questionTypeSelect = document.getElementById("questionType");
    const selectedType = questionTypeSelect.value;
    if (selectedType) {
        const questionNumber =
            questionFieldsContainer.querySelectorAll(".questionField").length + 1;
        generateQuestionField(selectedType, questionNumber);
        questionTypeSelect.disabled = true; // Disable the type select after choosing a type
    } else {
        alert("Please select a question type.");
    }
}

// Add event listener for "Add Question" button
addQuestionButton.addEventListener("click", addQuestion);

// Add event listener for "Delete Question" buttons
questionFieldsContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("deleteQuestion")) {
        const questionField = event.target.closest(".questionField");
        const questionTypeSelect = questionField.parentElement.querySelector(
            ".questionTypeSelect"
        );
        questionField.remove();
        questionTypeSelect.disabled = false; // Re-enable the corresponding type select
    }
});

// Add event listener for "Add Choice" buttons
questionFieldsContainer.addEventListener('click', function (event) {
    if (event.target.classList.contains('addChoice')) {
        const questionField = event.target.closest('.questionField');
        const choicesContainer = questionField.querySelectorAll('.choicesContainer');

        const newChoiceContainer = document.createElement('div');
        newChoiceContainer.classList.add('choicesContainer');
        const choiceNumber = choicesContainer.length + 1; // 计算当前选项的序号
        newChoiceContainer.innerHTML = `
    <label>Option ${choiceNumber}:</label> <!-- 显示选项序号 -->
    <input type="text" class="choiceText custom-input" required>
    <button type="button" class="removeChoice btn btn-danger">-</button>
`;
        questionField.insertBefore(newChoiceContainer, event.target);

        // 更新选项数量并显示
    }
});

// Add event listener for "Remove" buttons for choices
questionFieldsContainer.addEventListener("click", function (event) {
    if (event.target.classList.contains("removeChoice")) {
        const choicesContainer = event.target.parentNode;
        if (
            choicesContainer.parentNode.querySelectorAll(".choicesContainer").length >
            2
        ) {
            choicesContainer.parentNode.removeChild(choicesContainer);
        } else {
            alert("At least two choices required.");
        }
    }
});

// Modify form submit event handler
document
    .getElementById("surveyForm")
    .addEventListener("submit", function (event) {
        // Collect questions from the survey information
        const questions = collectQuestions();

        // Convert questions array to a hidden field and add it to the form
        const questionsField = document.createElement("input");
        questionsField.type = "hidden";
        questionsField.name = "questions"; // This is the field name the backend will receive
        questionsField.value = JSON.stringify(questions);

        // Add the hidden field to the form
        this.appendChild(questionsField);
    });

// Function to collect questions from the survey information
function collectQuestions() {
    const questions = [];

    // Iterate over each question field and collect question information
    const questionFields = document.querySelectorAll(".questionField");
    questionFields.forEach((questionField, index) => {
        const questionId = questionField.getAttribute("data-question-id")
        const questionType = questionField.getAttribute("data-question-type");
        let questionText;

        if (questionType === "multiple_choice") {
            questionText = questionField.querySelector('input[type="text"]').value;
        } else if (questionType === "short_answers") {
            questionText = questionField.querySelector("textarea").value;
        }

        // Build the question object
        const question = {
            qid: questionId ? questionId : "",
            qType: questionType,
            qText: questionText,
        };

        if (questionType === "multiple_choice") {
            question["options"] = []; // Ensure the question object has 'options' property
            const choiceInputs = questionField.querySelectorAll(".choiceText");
            choiceInputs.forEach((choiceInput) => {
                const choiceText = choiceInput.value;
                question["options"].push(choiceText);
            });
        }

        // Add the question object to the array
        questions.push(question);
    });

    // Return the questions array
    return questions;
}

