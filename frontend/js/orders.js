requireLogin();

$.get('/orders', orders => {
  if (!orders.length) return $('#orderList').html('<p>No orders found</p>');
  orders.forEach(order => {
    const itemsHtml = order.items.map(i =>
      `<li>${i.name} (x${i.quantity}) - ₹${i.price}</li>`
    ).join('');

    $('#orderList').append(`
      <div class="card p-3 mb-3">
        <h5>Status: ${order.status}</h5>
        <p>Total: ₹${order.total}</p>
        <p>Date: ${order.date}</p>
        <p>Address: ${order.shippingAddress}</p>
        <ul>${itemsHtml}</ul>
      </div>
    `);
  });
});
