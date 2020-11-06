$(function () {

    function post_signup(account, password, nick='') {
        var obj = {
            account: account,
            password: password,
            nick: nick
        };
        var data = JSON.stringify(obj);
        $.ajax({
            url: '/signup',
            type: 'POST',
            data: data,
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            success: function (resp) {
                var status = resp['status'];
                if (status == 'OK') {
                    location.assign('login.html');
                } else {
                    console.error(resp['msg'])
                }
            }
        });
    }

    $('#login-button').click(function () {
        // alert('you click #login-button');
    });

    $('#signup-button').click(function () {
        var account = $('#account-input').val();
        var password = $('#password-input').val();
        var name = $('#name-input').val();
        post_signup(account, password, name);
    });

});
