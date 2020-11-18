$(function () {
    moment.tz.setDefault("Asia/Taipei");
    var socket = io.connect();
    var begin = 0;

    var msg_card_body = new Vue({
        el: '.msg_card_body',
        data: {
            msgList: []
        }
    })

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
                    msg_card_body.msgList.unshift(
                        {text: data['text'], date: moment.unix(data['timestamp']).format('YYYY-MM-DD HH:mm:ss')}
                    )
                }
            }
        });
        return amount;
    }

    function sendMessage() {
        var msg = $('textarea.type_msg').val();
        if (msg.trim() == '') {
            $('textarea.type_msg').val(null);
            return false;
        }
        socket.emit('sendMessage', {
            msg: msg.trim()
        });
        $('textarea.type_msg').val(null);
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
        msg_card_body.msgList.push(
            {text: msg, date: moment.unix(ts).format('YYYY-MM-DD HH:mm:ss')}
        )
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
    $('.msg_card_body').mCustomScrollbar();
    autosize(document.querySelectorAll('[data-autosize="true"]'));
    begin += loadMessages(begin);

});
