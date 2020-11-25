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
            'userMug': 'defaultUserMug'
        }
    };

    var VheaderContent = new Vue({
        el: '.msg_head div',
        data: {
            headerName: '',
            headerStatus: '(Loading....)',
            headerMug: 'static/image/userImage/default.jpg'
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

    var VsetNick = new Vue({
        el: '#modal_setNick .modal-content',
        data: {
            userNick: ''
        },
        methods: {
            clear: function () {
                this.userNick = '';
            },
            reset: function () {
                this.userNick = userData[__loginUser]['userNick'];
            }
        }
    })

    var VsetImage = new Vue({
        el: '#modal_setImage .modal-content',
        data: {
            mugShotRaw: null,
            imageInput: true,
            imageArea: false,
            abortBtn: false,
            saveBtn: false
        },
        methods: {
            afterLoadView: function () {
                this.imageInput = false;
                this.imageArea = true;
                this.abortBtn = true;
                this.saveBtn = true;
            },
            beforeLoadView: function () {
                this.imageInput = true;
                this.imageArea = false;
                this.abortBtn = false;
                this.saveBtn = false;
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
                var userMug = resp['userImg'];
                userData[userId] = {};
                userData[userId]['userId'] = userId;
                userData[userId]['userNick'] = userNick;
                userData[userId]['userMug'] = userMug;
                if ('self' in resp) {
                    __loginUser = userId;
                    VheaderContent.headerName = getUserName(userId);
                    if (userData[userId]['userMug']) {
                        VheaderContent.headerMug = userData[userId]['userMug'];
                    }
                    VheaderContent.headerStatus = '(Normal status)';
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

    function closeModalByPath(selector) {
        if ($(selector).hasClass('show')) {
            $(selector).modal('toggle');
        }
    }

    function postUserNick(nick) {
        var data = {
            userNick: nick
        }
        $.ajax({
            url: '/post_userNick',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            async: true,
            dataType: 'json',
            success: function (resp) {
                if (resp['status'] == 'OK') {
                    var userId = resp['userId'];
                    var userNick = resp['userNick'];
                    userData[userId]['userNick'] = userNick;
                    VheaderContent.headerName = getUserName(userId);
                    VchatMessages.updateUserName(userId, getUserName(userId));
                }
            }
        });
    }

    $('#modal_setNick .modal-footer button.setNick_save').click(function () {
        var inputUserNick = VsetNick.userNick;
        postUserNick(inputUserNick);
        closeModalByPath('#modal_setNick');
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

    $("#modal_setNick").on("show.bs.modal", function (event) {
        VsetNick.userNick = userData[__loginUser]['userNick'];
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

    var croppieObj = $('.croppie_area').croppie({
        viewport: {
            type: 'circle',
            width: 200,
            height: 200,
        },
        mouseWheelZoom: false,
        enforceBoundary: true
    });
    VsetImage.beforeLoadView();

    function loadCroppieArea () {
        VsetImage.afterLoadView();
        croppieObj.croppie('bind', {
            url: VsetImage.mugShotRaw
        })
    }

    function readMugShotRaw(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                VsetImage.mugShotRaw = e.target.result;
                loadCroppieArea();
            }
            reader.readAsDataURL(input.files[0]);
        }
        else {
            swal("Sorry - you're browser doesn't support the FileReader API");
        }
    }

    $('.croppie_input input').on('change', function () {
        readMugShotRaw(this);
    });

    $('#modal_setImage .modal-footer button.setImage_abort').click( function () {
        VsetImage.mugShotRaw = null;
        VsetImage.beforeLoadView();
    });

    $('#modal_setImage .modal-footer button.setImage_save').click( function () {
        croppieObj.croppie('result', {
            type: 'base64',
            format: 'png',
            circle: false
        }).then(function (result) {
            var data = {
                userImage: result
            }
            $.ajax({
                url: '/post_userImage',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                async: true,
                dataType: 'json',
                success: function (resp) {
                    if (resp['status'] == 'OK') {
                        var userId = resp['userId'];
                        var imageUrl = resp['imageUrl'];
                        userData[userId]['userMug'] = imageUrl;
                        if (userData[userId]['userMug']) {
                            VheaderContent.headerMug = userData[userId]['userMug'];
                            // update all userMug for chat massage by userId
                        }
                    }
                }
            });
        });
        closeModalByPath('#modal_setImage');
    });

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
