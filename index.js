/**
 * chat app code
 * based on: https://dzone.com/articles/using-redis-with-nodejs-and-socketio
 */

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
// const http = require('http').Server(app);

const io = require('socket.io')();

const fs = require('fs');
let creds = '';

const redis = require('redis');
let redisClient = '';

// Read credentials from JSON
fs.readFile('creds.json', 'utf-8', (err, data) => {
  if (err) throw err;
  creds = JSON.parse(data);
  redisClient = redis.createClient(`http://${creds.host}:${creds.port}`);
  // redisClient = redis.createClient('redis://' + creds.user + ':' + creds.password + '@' + creds.host + ':' + creds.port);

  // Redis redis client Ready
  redisClient.once('ready',  () => {
    console.log('REDIS CLIENT READY!!');
    // Flush Redis DB
    // redisClient.flushdb();

    // Initialize Chatters
    redisClient.get('users', (err, reply) => {
      if (reply) {
        chatters = JSON.parse(reply);
      }
    });

    // Initialize Messages
    redisClient.get('messages', (err, reply) => {
      if (reply) {
        chat_messages = JSON.parse(reply);
      }
    });
  });
});

const port = process.env.PORT || 8080;
console.log('port: ', port);


// Store people in chat
const users = [];

// Store messages in chat
const messages = [];

// get quotes
let quotes = [];
fs.readFile('quotes.json', 'utf8', function (err, data) {
  if (err) throw err;
  quotes = JSON.parse(data);
});


// Socket Connection
// here you can start emitting events to the client 
io.on('connection', (client) => {
  console.log('User connected :)');
  
  client.on('subscribeToTimer', (interval) => {
    /* 
      * We want the service to start an interval (timer) and emit the current date back to the client.
      * The service should start a timer per client, and the client can pass in the desired interval time.
      * That’s an important point, because it means that clients can send data through to the server socket. 
      */
    console.log('client is subscribing to timer with interval ', interval);
    setInterval(() => {
      const options = {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }
      const date = new Date().toLocaleDateString('en-US', options);
      // console.log('date: ', date);
      client.emit('timer', date);
    }, interval);
  });


  // Fire 'send' event for updating users list
  client.on('get_users', (data) => {
    console.log('RECEIVED: msg sent: ', data)
    messages.push(data);
    io.emit('joined', data);
  });

  // when user joins chat
  client.on('join', (data) => {
    console.log('RECEIVED: request to join chat: ');
    users.push(data);
    redisClient.set('users', JSON.stringify(users));
    io.emit('joined', users);
  });



  // Fire 'send' event for updating Message list in UI
  client.on('message', (data) => {
    console.log('RECEIVED: msg sent: ', data)
    messages.push(data);
    redisClient.set('users', JSON.stringify(messages));
    io.emit('send', data);
  });

  // send all messages back to front-end
  client.on('get_messages', () => {
    console.log('RECEIVED: get_messages request: ');
    io.emit('message_history', messages);
  });

  // Fire 'count_users' for updating user count in UI
  // client.on('update_user_count', data => io.emit('count_users', data));

  // Fire 'count_users' for updating user count in UI
  client.on('get_quote', () => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    io.emit('random_quote', randomQuote);
  });


  // When client disconnects
  client.on('disconnect', () => {
    console.log('User disconnected :(');
  })
});

// tell socket.io to start listening for clients
io.listen(port);
console.log('  >> listening on port ', port);
  
  





/*
// Express Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

// Render Main HTML file
app.get('/', function (req, res) {
    res.sendFile('views/index.html', {
        root: __dirname
    });
});

// API - Join Chat
app.post('/join', function (req, res) {
    var username = req.body.username;
    if (chatters.indexOf(username) === -1) {
        chatters.push(username);
        client.set('chat_users', JSON.stringify(chatters));
        res.send({
            'chatters': chatters,
            'status': 'OK'
        });
    } else {
        res.send({
            'status': 'FAILED'
        });
    }
});

// API - Leave Chat
app.post('/leave', function (req, res) {
    var username = req.body.username;
    chatters.splice(chatters.indexOf(username), 1);
    client.set('chat_users', JSON.stringify(chatters));
    res.send({
        'status': 'OK'
    });
});

// API - Send + Store Message
app.post('/send_message', function (req, res) {
    var username = req.body.username;
    var message = req.body.message;
    chat_messages.push({
        'sender': username,
        'message': message
    });
    client.set('chat_app_messages', JSON.stringify(chat_messages));
    res.send({
        'status': 'OK'
    });
});

// API - Get Messages
app.get('/get_messages', function (req, res) {
    res.send(chat_messages);
});

// API - Get Chatters
app.get('/get_chatters', function (req, res) {
    res.send(chatters);
});

*/