var express = require('express');
var fs = require('fs');
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', "html");
//app.use(require("body-parser")());
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').__express);


var port = 3700;
var io = require('socket.io').listen(app.listen(port));
var messages = [];
var usernames = {};
var agents = [];
var customers =[];
var rooms = [];
var room;


var fs = require('fs');

var readStream = fs.createReadStream('./file.json');
readStream.on('data', function(contents){
    messages = JSON.parse(contents.toString());
});

app.get('/',function(req, res){
    res.render('index.html');
});

app.get('/agent',function(req, res){
    res.render('agent.html');
});


io.sockets.on('connection', function(socket){
    console.log('There\'s a connection');

    socket.on('agent',function(name){
        console.log('Agent Timi has created a room',name);
        room = name;
        socket.username = name;
        socket.room = name;
        agents.push(name);
        usernames[name] = name;
        socket.join(room);
        rooms.push(room);
    });

    socket.on('new_customer',function(username){
        var roomsizearr = [];
        for(var i =0; i < rooms.length; i++)
        {
            roomsizearr.push(Object.keys(socket.adapter.rooms[rooms[i]]).length);
        }
        Array.min = function( array ){
            return Math.min.apply( Math, array );
        };
        console.log(roomsizearr);
        var roomtojoin = roomsizearr.indexOf(Array.min(roomsizearr));
        socket.join(rooms[roomtojoin]);
        ///console.log(rooms[roomtojoin])
        socket.username = username;
        socket.room = rooms[roomtojoin];
        customers.push(socket);
        socket.broadcast.to(rooms[roomtojoin]).emit('updatelist',username);
    });

    socket.on('message',function(data){
        messages.push({sender: socket.username, message: data});
        fs.writeFile('./file.json',JSON.stringify(messages),function(err){
            if(err){throw err;}
        });
        io.sockets.in(socket.room).emit('updatechat', socket.username, data, room);
    });

    socket.on('deliver',function(msg, receiver){
        messages.push({sender: socket.username, message: msg, receiver: receiver});
        fs.writeFile('./file.json',JSON.stringify(messages),function(err){
            if(err){throw err;}
        });
        io.sockets.in(socket.room).emit('updatechat', socket.username, msg, receiver);
    });

    socket.on('get_chat', function(cust_username){
        console.log(cust_username);
        var prev_msg = [];
        for(var i=0; i <messages.length; i++)
        {
            if((messages[i].sender == socket.username && messages[i].receiver == cust_username) || messages[i].sender == cust_username)
            {
                prev_msg.push(messages[i]);
            }
        }
        console.log(prev_msg);
        socket.emit('prev_msg',prev_msg);
    });

    socket.on('disconnect',function(){
        //usernames
        console.log('Someone has left the Room');
    });
});

console.log('Listening to port',port);
