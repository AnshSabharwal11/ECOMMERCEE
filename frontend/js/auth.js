function requireLogin() {
    $.get("/auth-check")
      .done(function(data) {
        // User is authenticated; do nothing
      })
      .fail(function() {
        alert("Login first");
        window.location.href = "index.html";
      });
  }
  function logout() {
    fetch('/logout', { method: 'POST' })
      .then(() => {
        window.location.href = "index.html";
      })
      .catch(err => {
        console.error("Logout failed:", err);
      });
  }
  