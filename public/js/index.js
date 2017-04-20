$(function () {
    var from = $.cookie('user');//从 cookie 中读取用户名，存于变量 from
    var to = 'all';
    var socket = io.connect('http://localhost:8081');
    socket.emit('online', {user: from});
    socket.on('online', function (data) {
        if (data.user != from) {
            var sys = '<div style="color: #d60f05;">系统' + now() + ':用户 ' + data.user + '上线了</div>'
        } else {
            var sys = '<div style="color: #d60f05;">系统' + now() + ':你进入了聊天室!</div>'
        }
        $('.content').append(sys + '<br>');
        //刷新用户列表
        flushUsers(data.users);
        sayingTo()
    })
    socket.on('send',function (data) {
        console.log(data)
        console.log(data.to);
        if (data.to == 'all') {
            $('.content').append('<div>'+ data.from + now() + '对所有人说：<br>' + data.msg + '</div>')
        }
        if (data.to == from) {
            $('.content').append('<div style="color: #0642f4;">' + data.from + now() + '对你说：<br>' + data.msg + '</div>')
        }
    })
    //发送信息
    $('.send').click(function () {
        var msg = $('.input').html();
        if (msg == '') return;
        if (to == 'all') {
            $('.content').append('<div>你' + now() + ')对所有人说：<br>' + msg + '</div>')
        } else {
            $('.content').append('<div style="color: #0642f4;">你' + now() + ')对' + to + '说：<br>' + msg + '</div>')
        }
        //发送
        socket.emit('send', {from, to, msg});
        $('.input').html('').focus();
    })
    //有人下线
    socket.on('offline',function (data) {
        console.log(data);
        $('.content').append('<div>系统' + now() + ':用户 ' + data.user+ '下线了</div>')
        flushUsers(data.users);
        if (data.user == to) {
            to = 'all';
            sayingTo();
        }
    })
    //服务器关闭
    socket.on('disconnect',function () {
        $('.content').append('<div style="color: red;">系统：服务器连接失败...</div>');
        $('.list').empty();
    })
    //服务器重启
    socket.on('reconnect',function () {
        $('.content').append('<div style="color: red;">系统：服务器重新连接!!!</div>');
        socket.emit('online', {user: from});
    })
    //刷新当前在线人员
    function flushUsers(users) {
        $('.list').empty().append('<li class="active" alt="all" title="双击聊天" onselectstart="return false">所有用户</li>');
        for (var i in users) {
            $('.list').append('<li alt="' + users[i] + '" onselectstart="return false">' + users[i] + '</li>');
        }
        //双击聊天
        $('.list li').dblclick(function () {
            //如果双击不是自己
            if ($(this).attr('alt') != from) {
                //设置被双击的聊天的对象
                to = $(this).attr('alt');
                //移除默认选中样式
                $('.list li').removeClass('active');
                //添加选中样式
                $(this).addClass('active');
                //显示正在对谁说话
                sayingTo();
            }
        })
    }

    //对谁说话
    function sayingTo() {
        $('#from').html(from);
        $('#to').html(to == 'all' ? '所有人' : to);
    }

    //获取当前时间
    function now() {
        var date = new Date();
        var time = '(' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ')';
        return time;
    }
});
