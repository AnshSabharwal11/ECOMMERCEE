requireLogin();

function loadCart() {
  $.get('/cart', items => {
    $('#cartItems').empty();
    if (!items.length) {
      return $('#cartItems').html('<p>Your cart is empty</p>');
    }

    items.forEach(i => {
      $('#cartItems').append(`
        <div class="card mb-2 p-3">
          <h5>${i.productId.name}</h5>
          <p>Price: ₹${i.productId.price}</p>
          <p>Quantity: ${i.quantity}</p>
          <button class="btn btn-danger btn-sm" onclick="removeFromCart('${i.productId._id}')">Remove</button>
        </div>
      `);
    });
  });
}

function removeFromCart(productId) {
  $.ajax({
    url: `/cart/${productId}`,
    type: 'DELETE',
    success: res => {
      alert(res.message);
      loadCart();
    },
    error: err => {
      alert('Failed to remove item.');
    }
  });
}

$('#orderForm').submit(function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this).entries());

  $.post('/orders', data, res => {
    alert(res.message);
    window.location.href = 'orders.html';
  }).fail(() => {
    alert('Order failed');
  });
});

loadCart();
