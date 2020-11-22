$(function () {
    moment.tz.setDefault("Asia/Taipei");
    var socket = io.connect();
    var begin = 0;
    var msgVueTemplate = $('#msgVue').html();
    var __loginUser = '';
    var userData = {
        'defaultUserId': {
            'userId': 'defaultUserId',
            'userNick': 'defaultUserNick',
            'userIcon': 'defaultUserIcon'
        }
    };

    var VheaderContent = new Vue({
        el: '.msg_head div',
        data: {
            headerName: '',
            headerStatus: '(Loading....)'
        }
    })

    var VchatMessages = new Vue({
        data: {
            // {text: 'string', userName: 'string', date: 'string', userId: 'string'}
            msgList: []
        },
        methods: {
            updateUserName: function (userId, userName) {
                for (msg of this.msgList) {
                    if (msg['userId'] == userId) {
                        msg.userName = userName;
                    }
                }
            }
        }
    })

    function applyScrollbar(selector) {
        // will return DOM element of mCustomScrollbar container
        var mcs = $(selector).mCustomScrollbar({
            theme: 'dark-3'
        });
        var mcsContainer = mcs.find('.mCSB_container')[0];
        return mcsContainer;
    }

    function updateScrollbar(selector, duration=300) {
        setTimeout(() => {
            $(selector).mCustomScrollbar('update').mCustomScrollbar('scrollTo', 'bottom', {
                scrollEasing: 'easeOut',
                scrollInertia: duration
            }, 15);
        });
    }

    function loadUserData(userId='') {
        var data = null;
        if (userId) {
            data = { userId: userId }
            userData[userId] = 'pending';
        }
        $.ajax({
            url: '/get_userData',
            type: 'GET',
            data: data,
            async: true,
            dataType: 'json',
            success: function (resp) {
                var userId = resp['userId'];
                var userNick = resp['userNick'];
                var userImg = resp['userImg'];
                userData[userId] = {};
                userData[userId]['userId'] = userId;
                userData[userId]['userNick'] = userNick;
                userData[userId]['userImg'] = userImg;
                if ('self' in resp) {
                    __loginUser = userId;
                    VheaderContent.headerName = getUserName(userId);
                    VheaderContent.headerStatus = '(Normal status)'
                }
                VchatMessages.updateUserName(userId, getUserName(userId));
            }
        });
    }

    function getUserName(userId) {
        var displayName = '';
        if (userId in userData) {
            if (userData[userId]['userNick']) {
                displayName = userData[userId]['userNick'];
            } else {
                displayName = userData[userId]['userId'];
            }
        } else {
            loadUserData(userId);
        }
        return displayName;
    }
    
    function loadMessages(begin, amount=20) {
        var data = {
            begin: begin,
            amount: amount
        }
        $.ajax({
            url: '/get_chatMessages',
            type: 'GET',
            data: data,
            async: true,
            dataType: 'json',
            success: function (resp) {
                var dataList = resp['chatMessages'];
                for (data of dataList) {
                    VchatMessages.msgList.unshift({
                            text: data['msg'],
                            userName: getUserName(data['userId']),
                            date: moment.unix(data['timestamp']).format('YYYY-MM-DD HH:mm:ss'),
                            userId: data['userId']
                    });
                }
            },
            complete: function () {
                if (begin == 0) {
                    updateScrollbar('.msg_card_body', 0);
                }
            }
        });
        return amount;
    }

    function sendMessage() {
        var msg = $('textarea.type_msg').val();
        if (msg.trim() == '') {
            $('textarea.type_msg').val(null);
            autosize.update($('textarea.type_msg'));
            return false;
        }
        socket.emit('sendMessage', {
            msg: msg.trim()
        });
        $('textarea.type_msg').val(null);
        autosize.update($('[data-autosize="true"]'));
    }

    $('.send_btn').click(function () {
        sendMessage();
    });

    $('textarea.type_msg').keydown(function (event) {
        if (event.which == 13) {
            if(event.shiftKey) {
                // will add new line
            } else {
                sendMessage();
                event.preventDefault();
            }
        }
    });

    function newMessage(data) {
        var msg = data['msg'];
        var ts = data['timestamp'];
        var userId = data['userId'];
        VchatMessages.msgList.push({
            text: msg,
            userName: getUserName(userId),
            date: moment.unix(ts).format('YYYY-MM-DD HH:mm:ss'),
            userId: userId
        });
        updateScrollbar('.msg_card_body');
    }

    socket.on('newMessage', function (data) {
        newMessage(data);
        begin += 1;
    });

    socket.on('test', function (data) {
        console.log(data);
    });

    // Init zone

    $('#action_menu_btn').click(function () {
        $('.action_menu').toggle();
    });
    autosize($('[data-autosize="true"]'));
    var scrollContainer = applyScrollbar('.msg_card_body');
    $(scrollContainer).append(msgVueTemplate);
    VchatMessages.$mount(scrollContainer);
    loadUserData();
    begin += loadMessages(begin);
});
