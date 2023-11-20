const socket = io();
const chatbox = document.getElementById("chatbox");
const send = document.getElementById("send");
const messagesDiv = document.getElementById("messages");
const usernameInput = document.getElementById("usernameInput");
const connectedUsersList = document.getElementById("connectedUsers");
let username = "";

socket.on("loadMessages", (data) => {
  const messages = data.messages;
  console.log("Messages chargés:", messages);

  messagesDiv.innerHTML = "";

  const sortedMessages = messages.sort((a, b) => b.timestamp - a.timestamp);

  const reversedMessages = sortedMessages.reverse();

  reversedMessages.forEach((message) => {
    const formattedDate = moment(message.timestamp).fromNow();
    const newMessage = `<div><strong>${message.username} - ${formattedDate} -</strong> ${message.text}</div><hr>`;
    messagesDiv.innerHTML += newMessage;
  });
});

while (username === "" || username === null) {
  username = prompt("Veuillez saisir votre pseudo:");
}

socket.emit("changeUsername", username);

send.addEventListener("click", () => {
  let textChatbox = chatbox.value.trim();
  if (textChatbox !== "") {
    const formattedDate = moment(Date.now()).fromNow();
    const newMessage = `<div><strong>${username} - ${formattedDate} -</strong> ${textChatbox}</div><hr>`;
    messagesDiv.innerHTML += newMessage;

    socket.emit("message", { text: textChatbox, username });
    chatbox.value = "";
  }
});

socket.on("resMessage", (data) => {
  const formattedDate = moment(data.data.timestamp).fromNow();
  const newMessage = `<div class="message-${data.data.timestamp}"><strong>${data.data.username} - ${formattedDate} -</strong> ${data.data.text}</div>`;

  const existingMessage = messagesDiv.querySelector(
    `.message-${data.data.timestamp}`
  );

  if (!existingMessage) {
    messagesDiv.insertAdjacentHTML("beforeend", newMessage);
  }
});

socket.on("updateUserList", (users) => {
  updateConnectedUsersList(users);
});

function updateConnectedUsersList(users) {
  connectedUsersList.innerHTML = "";

  for (let i = users.length - 1; i >= 0; i--) {
    const userItem = document.createElement("li");
    userItem.textContent = users[i];

    connectedUsersList.appendChild(userItem);

    // Ajoutez une ligne horizontale sauf pour le premier élément
    if (i > 0) {
      const hr = document.createElement("hr");
      connectedUsersList.appendChild(hr);
    }
  }
}