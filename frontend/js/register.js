$('#registerForm').submit(function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this).entries());
    $.post('/register', data, res => {
      $('#message').text(res.message).css('color', 'green');
      setTimeout(() => window.location.href = "index.html", 1500);
    }).fail(err => {
      $('#message').text(err.responseJSON.message).css('color', 'red');
    });
  });
  