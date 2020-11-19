$(function () {
    moment.tz.setDefault("Asia/Taipei");
    var socket = io.connect();
    var begin = 0;
    var msgVueTemplate = $('#msgVue').html();

    var VchatMessages = new Vue({
        data: {
            msgList: []
        }
    })

    function applyScroll(selector) {
        // will return DOM element of mCustomScrollbar container
        var mcs = $(selector).mCustomScrollbar({
            theme: 'dark-3'
        });
        var mcsContainer = mcs.find('.mCSB_container')[0];
        return mcsContainer;
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
                    VchatMessages.msgList.unshift(
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
            autosize.update($('textarea.type_msg'));
            return false;
        }
        socket.emit('sendMessage', {
            msg: msg.trim()
        });
        $('textarea.type_msg').val(null);
        autosize.update($('textarea.type_msg'));
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
        VchatMessages.msgList.push(
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
    autosize($('[data-autosize="true"]'));
    var scrollContainer = applyScroll('.msg_card_body');
    $(scrollContainer).append(msgVueTemplate);
    VchatMessages.$mount(scrollContainer);
    begin += loadMessages(begin);
});
