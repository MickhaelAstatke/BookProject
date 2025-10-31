/* eslint-env browser */

function showToast(message, isError) {
  if (window.M && typeof window.M.toast === "function") {
    window.M.toast({ html: message, classes: isError ? "red" : "teal" });
  } else {
    if (isError) {
      console.error(message);
    }
    alert(message);
  }
}

function renderPremiumShelf(books) {
  const container = document.getElementById("premium-results");
  if (!container) {
    return;
  }
  if (!books.length) {
    container.innerHTML = "<p class=\"white-text\">No premium titles available yet.</p>";
    return;
  }

  const listItems = books
    .map((book) => {
      const accessType = book.PlanBookAccess ? book.PlanBookAccess.accessType : "full";
      return `
        <li class="collection-item blue-grey darken-2 white-text">
          <span class="title">${book.title}</span>
          <p>${book.bookDescription}</p>
          <span class="badge teal">${accessType}</span>
        </li>
      `;
    })
    .join("");

  container.innerHTML = `<ul class="collection">${listItems}</ul>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const membershipForms = document.querySelectorAll(".membership-action");
  membershipForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const action = form.getAttribute("data-membership-action");
      const planId = form.getAttribute("data-plan-id");
      const subscriptionId = form.getAttribute("data-subscription-id");

      try {
        let response;
        if (action === "start-trial") {
          response = await fetch("/api/trials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId }),
          });
        } else if (action === "activate") {
          response = await fetch("/api/subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId }),
          });
        } else if (action === "renew") {
          response = await fetch(`/api/subscriptions/${subscriptionId}/renew`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
          });
        } else if (action === "cancel") {
          response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!response) {
          return;
        }

        if (!response.ok) {
          const errorBody = await response.json();
          showToast(errorBody.message || "Something went wrong", true);
          return;
        }

        const data = await response.json();
        let successMessage = "Subscription updated";
        if (action === "start-trial") {
          successMessage = "Trial started successfully";
        } else if (action === "activate") {
          successMessage = "Subscription activated";
        } else if (action === "renew") {
          successMessage = "Subscription renewed";
        } else if (action === "cancel") {
          successMessage = "Subscription cancelled";
        }

        showToast(successMessage);

        if (data && data.id) {
          const url = new URL(window.location.href);
          url.searchParams.set("subscriptionId", data.id);
          window.history.replaceState({}, "", url.toString());
        }

        if (action === "cancel") {
          setTimeout(() => window.location.reload(), 600);
        }
      } catch (error) {
        console.error(error);
        showToast("Unable to process request", true);
      }
    });
  });

  const premiumButton = document.getElementById("load-premium");
  if (premiumButton) {
    premiumButton.addEventListener("click", async () => {
      const subscriptionId = premiumButton.getAttribute("data-subscription-id");
      try {
        const response = await fetch(`/api/catalog/premium?subscriptionId=${subscriptionId}`);
        if (!response.ok) {
          const errorBody = await response.json();
          showToast(errorBody.message || "Unable to load premium catalogue", true);
          return;
        }
        const data = await response.json();
        renderPremiumShelf(data.premiumBooks || []);
        showToast("Premium catalogue updated");
      } catch (error) {
        console.error(error);
        showToast("Unable to load premium catalogue", true);
      }
    });
  }
});
