"use strict";
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var app = express();
const port = 8081;

/*
 var roomAllGuy = {};

 function setRoomUser(room, data) {
 if (!roomAllGuy[room]) {
 roomAllGuy[room] = [];
 }
 roomAllGuy[room].push(data);
 }
 function removeRoomUser(room, user_id) {
 roomAllGuy[room] = roomAllGuy[room].filter(function (item) {
 return  item.user_id !=  user_id
 });
 }

 function getRoomUser(room) {
 return roomAllGuy[room];
 }
 */

app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '../BE')));
/*app.use(express.urlencoded());//这两句就是用于获取post数据用的
 app.use(express.json());//use要写在所有路由之前，不然该功能就没有被启用*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
// app.use(express.static(__dirname + 'public'));
/*app.get('/',function (req, res) {
 // res.render('/index.html');
 // res.sendFile( __dirname + "/" + "index.html" );
 // res.redirect('.././FE/index.html')
 res.sendfile('views/login.html')
 })
 app.get('/index',function (req, res) {
 res.sendfile('views/index.html')
 })
 app.post('/',function (req, res) {
 console.log(req.body);
 res.cookie("user", req.body.name);
 console.log(res.cookie('user'));
 res.redirect('/index');

 })*/
var users = {};//存储在线用户列表的对象

app.get('/', function (req, res) {
    if (req.cookies.user == null) {
        res.redirect('/login');
    } else {
        res.sendfile('views/index.html');
    }
});
app.get('/login', function (req, res) {
    res.sendfile('views/login.html');
});
app.post('/login', function (req, res) {
    if (users[req.body.name]) {
        //存在，则不允许登陆
        res.redirect('/login');
    } else {
        //不存在，把用户名存入 cookie 并跳转到主页
        /*console.log(req.body);
         console.log(req.body.name);*/
        res.cookie("user", req.body.name, {maxAge: 1000 * 60 * 60 * 24 * 30});
        // console.log( res.cookie['user'])
        res.redirect('/');
    }
});
var server = require('http').createServer(app);
var io = require('socket.io')(server);
io.sockets.on('connection', function (socket) {
    //有人上线
    socket.on('online', function (data) {
        // console.log(data.user);
        socket.name = data.user;
        if (!users[data.user]) {
            users[data.user] = data.user;
        }
        io.sockets.emit('online', {users: users, user: data.user});
        // socket.broadcast.to(users).emit(data.user,data.user)
    })
    /*socket.on('send',function (data) {
     console.log(data);
     //向其他所有用户发送说的信息
     socket.to = data.to;
     if (data.to == 'all') {
     socket.broadcast.emit('send', data);
     }else {
     //向指定的人发送说的信息
     //client为当前所有连接的用户
     io.sockets.socket(socket.to).emit('send', data);
     /!*var client = io.sockets.clients();
     client.forEach(function (socket) {
     console.log(socket.name);
     /!*if (socket.name == data.to) {
     socket.emit('send',{data});
     }*!/
     })*!/
     }
     })*/
    socket.on('send', function (data) {
        if (data.to == 'all') {
            //向其他所有用户广播该用户发话信息
            socket.broadcast.emit('send', data);
        } else {
            //向特定用户发送该用户发话信息
            socket.broadcast.emit('send', data);
        }
    });
    //有人下线
    socket.on('disconnect', function (data) {
        //从房间删除下线的人的信息
        delete users[socket.name];
        //向房间中的其他人广播有人下线了
        socket.broadcast.emit('offline', {users: users, user: socket.name})
    })
})

/*io.on('connection', function(socket) {
 socket.on('newGuy', function(data) {
 var room = 'room_' + data.room_id;
 console.log(room, data);
 socket.join(room, function() {
 data.socket_id = socket.id;
 socket.user_data = data;
 socket.user_room = room;
 socket.user_id = data.user_id;
 setRoomUser(room, data)
 // console.log(socket.rooms); // [ <socket.id>, 'room 237' ]
 // io.to(socket.user_room).emit('newGuy', data);
 // socket.to(socket.user_room).emit('newGuy', data);
 socket.broadcast.to(socket.user_room).emit('newGuy', data); // 除了本人，传递给房间里的其他所有人
 socket.emit('allGuy', getRoomUser(room)); // 传递给本人现在房间里的所有人
 })
 });

 socket.on('msg', function(data) {
 io.to(socket.user_room).emit('msg', data)
 });
 socket.on('disconnect',function (data) {
 removeRoomUser(socket.user_room, socket.user_id);
 // console.log(getRoomUser(socket.user_room));

 })

 });*/

function sendToOther(socket, event, data) {
    socket.broadcast.emit(event, data); // everyone gets it but the sender
}

server.listen(port);

console.log('server runing on ' + port);
console.log('http://127.0.0.1:8081')