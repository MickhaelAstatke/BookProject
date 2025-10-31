/* eslint-env jquery */
$(document).ready(function () {
  $(".modal").modal();
  $(".cart-button").on("click", function (event) {
    event.preventDefault();

    if (!window.__AUTH_TOKEN__ && !(document.cookie && document.cookie.indexOf("__session=") !== -1)) {
      if (window.openAuthModal) {
        window.openAuthModal();
      }
      if (window.M && typeof window.M.toast === "function") {
        window.M.toast({ html: "Please sign in to add books to your cart." });
      }
      return;
    }

    var cart = {
      bookId: Number($(this).attr("value"))
    };

    $.ajax({
      url: "/api/cart",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(cart)
    })
      .done(function () {
        location.reload();
      })
      .fail(function (xhr) {
        if (xhr && xhr.status === 401) {
          if (window.openAuthModal) {
            window.openAuthModal();
          }
          if (window.M && typeof window.M.toast === "function") {
            window.M.toast({ html: "Please sign in to continue." });
          }
        } else {
          console.error("Unable to add book to cart", xhr);
        }
      });
  });

  $(".checkout-button").on("click", () => {
    $.ajax({
      url: "/api/cart",
      type: "DELETE"
    }).always(() => {
      location.reload();
    });
  });

});
