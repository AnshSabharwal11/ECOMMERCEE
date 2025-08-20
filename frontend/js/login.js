$('#loginForm').submit(function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this).entries());
    $.post('/login', data, res => {
      localStorage.setItem('token', 'loggedin');
      localStorage.setItem('user', JSON.stringify(res.user || {}));
      window.location.href = "products.html";
    }).fail(err => {
      $('#message').text(err.responseJSON.message).css('color', 'red');
    });
  });
  