requireLogin();

$.get('/products', products => {
  products.forEach(p => {
    $('#productList').append(`
      <div class="col-md-4 mb-3">
        <div class="card p-3">
          <h5>${p.name}</h5>
          <p>Price: ₹${p.price}</p>
          <button class="btn btn-primary" onclick="addToCart('${p._id}')">Add to Cart</button>
        </div>
      </div>
    `);
  });
});

function addToCart(productId) {
  $.post('/cart', { productId, quantity: 1 }, res => {
    alert(res.message);
  });
}
