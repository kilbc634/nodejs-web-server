$(document).ready(function () {
    $('#action_menu_btn').click(function () {
        $('.action_menu').toggle();
    });
    autosize(document.querySelectorAll('[data-autosize="true"]'));
});
