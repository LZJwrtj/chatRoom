"use strict";
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var app = express();
const port = 8081;

app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, '../BE')));
/*app.use(express.urlencoded());//这两句就是用于获取post数据用的
 app.use(express.json());//use要写在所有路由之前，不然该功能就没有被启用*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

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

server.listen(port);

console.log('server runing on ' + port);
console.log('http://127.0.0.1:8081')
