const io = require('socket.io')(8000, { cors: { origin: "*" } });

const users = {};
let messageHistory = [];

io.on('connection', socket => {
    socket.on('new-user-joined', name => {
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name);
        io.emit('user-list', Object.values(users));
    });

    socket.on('send', data => {
        const messageId = Date.now().toString();
        const messageData = { id: messageId, message: data.message, name: users[socket.id], timestamp: data.timestamp };
        messageHistory.push(messageData);
        socket.broadcast.emit('receive', messageData);
    });

    socket.on('delete-message', messageId => {
        messageHistory = messageHistory.filter(msg => msg.id !== messageId);
        io.emit('message-deleted', messageId);
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('user-left', users[socket.id]);
        delete users[socket.id];
        io.emit('user-list', Object.values(users));
    });

    socket.on('get-users', () => {
        socket.emit('user-list', Object.values(users));
    });

    socket.on('typing', (isTyping) => {
        if (isTyping) {
            socket.broadcast.emit('typing', { name: users[socket.id] });
        } else {
            socket.broadcast.emit('typing', null);
        }
    });
});
