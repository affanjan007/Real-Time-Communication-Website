const socket = io('http://localhost:8000');

const form = document.getElementById('send-cont');
const messageInput = document.getElementById('messageint');
const messageContainer = document.querySelector('.container');
const userContainer = document.getElementById('user-list');
const typingIndicator = document.getElementById('typing-indicator');
var audio = new Audio('ting.mp3');

const append = (message, position, timestamp, id = null) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `
        <span class="timestamp">${timestamp}</span> 
        <span class="message-content">${message}</span>
        ${position === 'right' ? `
        <button onclick="deleteMessage('${id}')">Delete</button>` : ''}
    `;
    messageElement.classList.add('msg');
    messageElement.classList.add(position);
    messageElement.setAttribute('data-id', id);
    messageContainer.append(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    if (position === 'left'){
        audio.play();
    }
};

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    const timestamp = new Date().toLocaleTimeString();
    const id = Date.now().toString();
    append(`You: ${message}`, 'right', timestamp, id);
    socket.emit('send', { message, timestamp });
    messageInput.value = '';
    socket.emit('typing', false);
});

let name;
do {
    name = prompt("Enter your name to join");
} while (!name);

socket.emit('new-user-joined', name);

socket.on('user-joined', name => {
    append(`${name} joined the chat`, 'left', new Date().toLocaleTimeString());
    updateUserList();
});

socket.on('receive', data => {
    append(`${data.name}: ${data.message}`, 'left', data.timestamp, data.id);
});

socket.on('user-left', name => {
    append(`${name} left the chat`, 'left', new Date().toLocaleTimeString());
    updateUserList();
});

socket.on('user-list', users => {
    userContainer.innerHTML = `<strong>Users Online:</strong> ${users.join(', ')}`;
});

messageInput.addEventListener('input', () => {
    socket.emit('typing', messageInput.value.length > 0);
});

socket.on('typing', (data) => {
    typingIndicator.innerText = data ? `${data.name} is typing...` : '';
});

socket.on('message-deleted', messageId => {
    const messageElement = document.querySelector(`.msg[data-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
});

function updateUserList() {
    socket.emit('get-users');
}

function deleteMessage(id) {
    if (confirm("Are you sure you want to delete this for me?")) {
        socket.emit('delete-message', id);
    }
}
