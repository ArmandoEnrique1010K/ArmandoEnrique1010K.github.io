const jsonUrl = "base_conocimiento_ANSI.json";

async function loadKnowledgeBase() {
  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();

    // Inicializa 'question' como un array si no existe
    data.question = data.question || [];

    return data;
  } catch (error) {
    console.error("Error loading knowledge base:", error);
    return null;
  }
}

let knowledgeBase;

// Cargar la base de conocimientos al cargar la página
window.onload = async function () {
  knowledgeBase = await loadKnowledgeBase();
  console.log("Knowledge Base:", knowledgeBase);
};

function sendMessage() {
  var userInput = document.getElementById("userInput").value;
  console.log("User Input:", userInput);

  // Asegurarse de que la base de conocimientos se haya cargado correctamente
  if (!knowledgeBase) {
    console.error("Knowledge Base is not loaded.");
    return;
  }

  var chatContainer = document.getElementById("chat");
  // Get the bot's response from the knowledge base
  var botResponse = getBotResponse(userInput);

  // Display user message in the chat
  chatContainer.innerHTML +=
    "<div class='pregunta-respuesta'> <p><strong>Pregunta: </strong>" +
    userInput +
    "</p><p><strong>Respuesta: </strong>" +
    botResponse +
    "</p></div>";

  // Clear the input field after sending the message
  document.getElementById("userInput").value = "";
}

function findBestMatch(userQuestion, knowledgeBase) {
  const userQuestionLower = userQuestion.toLowerCase();
  const questions = knowledgeBase.question.map((q) => q.question.toLowerCase());

  // Encuentra la mejor coincidencia usando la distancia de Levenshtein
  const bestMatch = getBestLevenshteinMatch(userQuestionLower, questions);

  return bestMatch;
}

function getBestLevenshteinMatch(str, strArray) {
  let minDistance = Infinity;
  let bestMatch = null;

  for (const candidate of strArray) {
    const distance = calculateLevenshteinDistance(str, candidate);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = candidate;
    }
  }

  // Ajusta este umbral según sea necesario
  const cutoff = 0.6;
  return minDistance <= cutoff * bestMatch.length ? bestMatch : null;
}

function calculateLevenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + (str1[i - 1] !== str2[j - 1] ? 1 : 0),
          dp[i][j - 1] + 1,
          dp[i - 1][j] + 1
        );
      }
    }
  }

  return dp[m][n];
}
function getAnswerForQuestion(question, knowledgeBase) {
  // Obtener la respuesta correspondiente a la pregunta en la base
  const matchedQuestion = knowledgeBase.question.find(
    (q) => q.question.toLowerCase() === question
  );
  return matchedQuestion ? matchedQuestion.answer : null;
}

function getBotResponse(userInput) {
  console.log("User Input (Bot Response):", userInput);
  console.log("Knowledge Base (Bot Response):", knowledgeBase);

  if (!knowledgeBase) {
    return "Lo siento, no tengo una respuesta para esa pregunta.";
  }

  // Utiliza la función findBestMatch en lugar de la búsqueda exacta
  var bestMatch = findBestMatch(userInput, knowledgeBase);

  // Modifica la respuesta para usar la mejor coincidencia
  return bestMatch
    ? getAnswerForQuestion(bestMatch, knowledgeBase)
    : "Lo siento, no tengo una respuesta para esa pregunta.";
}
function openTeachDialog() {
  document.getElementById("dialogOverlay").style.display = "flex";
}

function closeTeachDialog() {
  document.getElementById("dialogOverlay").style.display = "none";
}

function saveTeachDialog() {
  var userInput = document.getElementById("dialogInput").value;

  if (userInput) {
    // Obtén la pregunta actual del último elemento en el chat
    var chatElement = document.getElementById("chat");

    if (chatElement.children.length > 0) {
      var currentQuestion = chatElement.lastElementChild.textContent;

      if (currentQuestion) {
        var trimmedQuestion = currentQuestion.replace("Pregunta: ", "").trim();

        // Verifica si hay conocimientos y si existe la pregunta actual
        if (knowledgeBase && trimmedQuestion) {
          // Verifica si la pregunta ya existe en la base de conocimientos
          var existingQuestion = knowledgeBase.question.find(
            (q) => q.question.toLowerCase() === trimmedQuestion.toLowerCase()
          );

          if (existingQuestion) {
            // Actualiza la respuesta si la pregunta ya existe
            existingQuestion.answer = userInput;
          } else {
            // Agrega una nueva pregunta y respuesta a la base de conocimientos
            knowledgeBase.question.push({
              question: trimmedQuestion,
              answer: userInput,
            });
          }

          // Actualiza el archivo JSON
          updateKnowledgeBase();
        }

        // Actualiza la UI con la nueva respuesta
        document.getElementById("chat").innerHTML +=
          "<p>Bot: " + userInput + "</p>";

        // Cierra el cuadro de diálogo
        closeTeachDialog();
      } else {
        console.error("Error: currentQuestion is null or empty.");
      }
    } else {
      console.error("Error: chatElement does not contain any child elements.");
    }
  } else {
    console.error("Error: userInput is empty.");
  }
}

async function updateKnowledgeBase() {
  try {
    const response = await fetch(jsonUrl, {
      method: "POST", // O 'POST' dependiendo de tu configuración del servidor
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(knowledgeBase),
    });

    if (response.ok) {
      console.log("Knowledge base updated successfully.");
    } else {
      console.error("Failed to update knowledge base.");
    }
  } catch (error) {
    console.error("Error updating knowledge base:", error);
  }
}
