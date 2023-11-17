const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

// Nueva cadena de conexión a MongoDB Atlas
const dbUrl =
  "mongodb+srv://enrique2020k:73017920@cluster0.4eout.mongodb.net/chatbotdb?retryWrites=true&w=majority";

// Configuración de MongoDB
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Error de conexión a MongoDB:"));
db.once("open", () => {
  console.log("Conexión a MongoDB establecida exitosamente");

  // Define el esquema del chat
  const chatSchema = new mongoose.Schema({
    user: String,
    question: String,
    answer: String,
  });

  const Chat = mongoose.model("chats", chatSchema);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use(express.static(__dirname));

  app.post("/message", async (req, res) => {
    const userMessage = req.body.message;

    // Buscar la respuesta en la base de datos
    const matchingChat = await Chat.findOne({
      question: { $regex: new RegExp(userMessage, "i") },
    });

    let chatbotResponse;

    if (matchingChat) {
      chatbotResponse = matchingChat.answer;
    } else {
      chatbotResponse = "Lo siento, no tengo una respuesta para esa pregunta.";
    }

    // Guardar el mensaje del usuario en la base de datos
    const userChat = new Chat({
      user: "Usuario",
      question: userMessage,
      answer: "Usuario: " + userMessage,
    });
    userChat.save();

    // Guardar la respuesta del chatbot en la base de datos
    const chatbotChat = new Chat({
      user: "Chatbot",
      question: "Chatbot: " + userMessage,
      answer: chatbotResponse,
    });
    chatbotChat.save();

    res.json({ user: userMessage, chatbot: chatbotResponse });
  });

  // Iniciar el servidor
  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
  });
});
