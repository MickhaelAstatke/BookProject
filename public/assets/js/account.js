/* eslint-env jquery */
(function () {
  const root = document.getElementById("account-root");
  if (!root) {
    return;
  }

  const billingForm = document.getElementById("billing-form");
  const billingFeedback = document.getElementById("billing-feedback");
  const childProfileForm = document.getElementById("child-profile-form");
  const childFeedback = document.getElementById("child-feedback");
  const childList = document.getElementById("child-profile-list");
  const progressTable = document.getElementById("reading-progress-table");
  const progressForm = document.getElementById("reading-progress-form");
  const progressFeedback = document.getElementById("progress-feedback");

  const planLabel = document.getElementById("account-plan");
  const statusLabel = document.getElementById("account-status");
  const renewalLabel = document.getElementById("account-renewal");
  const renewalInput = document.getElementById("subscription-renewal-date");
  const paymentMethodInput = document.getElementById("payment-method");
  const billingReferenceInput = document.getElementById("billing-reference");

  const state = {
    user: null,
    children: [],
    progress: [],
    subscription: null,
  };

  function authHeaders() {
    if (typeof window.getAuthHeaders === "function") {
      return window.getAuthHeaders();
    }
    if (window.__AUTH_TOKEN__) {
      return { Authorization: `Bearer ${window.__AUTH_TOKEN__}` };
    }
    return {};
  }

  function showToast(message) {
    if (window.M && typeof window.M.toast === "function") {
      window.M.toast({ html: message });
    } else if (billingFeedback) {
      billingFeedback.textContent = message;
    }
  }

  function formatDate(input) {
    if (!input) {
      return "—";
    }
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleDateString();
  }

  function formatDateForInput(input) {
    if (!input) {
      return "";
    }
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function updatePlanDetails() {
    if (!state.user) {
      return;
    }

    const subscription = state.subscription;
    if (planLabel) {
      planLabel.textContent = subscription ? subscription.planName : state.user.subscriptionPlan || "free";
    }
    if (statusLabel) {
      statusLabel.textContent = subscription ? subscription.status : state.user.subscriptionStatus || "trial";
    }
    if (renewalLabel) {
      const source = subscription ? subscription.renewalDate : state.user.subscriptionRenewalDate;
      renewalLabel.textContent = formatDate(source);
    }
    if (renewalInput) {
      const source = subscription ? subscription.renewalDate : state.user.subscriptionRenewalDate;
      renewalInput.value = formatDateForInput(source);
    }
    if (paymentMethodInput) {
      paymentMethodInput.value = subscription && subscription.paymentMethod ? subscription.paymentMethod : "";
    }
    if (billingReferenceInput) {
      billingReferenceInput.value = subscription && subscription.billingReference ? subscription.billingReference : "";
    }

    if (window.M && typeof window.M.updateTextFields === "function") {
      window.M.updateTextFields();
    }
  }

  function renderChildren() {
    if (!childList) {
      return;
    }
    childList.innerHTML = "";
    if (!state.children.length) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "collection-item";
      emptyItem.textContent = "No child profiles yet.";
      childList.appendChild(emptyItem);
      return;
    }

    state.children.forEach((child) => {
      const item = document.createElement("li");
      item.className = "collection-item";
      item.setAttribute("data-child-id", child.id);
      const name = child.lastName ? `${child.firstName} ${child.lastName}` : child.firstName;
      const readingLevel = child.readingLevel ? ` • Reading level: ${child.readingLevel}` : "";
      item.innerHTML = `
        <div>
          <span>${name}</span>
          <span class="grey-text"> (ID: ${child.id}${readingLevel})</span>
          <a href="#" class="secondary-content red-text" data-action="delete-child">Remove</a>
        </div>
      `;
      childList.appendChild(item);
    });
  }

  function renderProgress() {
    if (!progressTable) {
      return;
    }
    progressTable.innerHTML = "";
    if (!state.progress.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.setAttribute("colspan", "4");
      cell.textContent = "No reading progress recorded yet.";
      row.appendChild(cell);
      progressTable.appendChild(row);
      return;
    }

    state.progress.forEach((progress) => {
      const row = document.createElement("tr");
      const bookTitle = progress.book ? progress.book.title : `Book #${progress.BookId}`;
      const childName = progress.childProfile
        ? `${progress.childProfile.firstName}${progress.childProfile.lastName ? " " + progress.childProfile.lastName : ""}`
        : "Shared";
      row.innerHTML = `
        <td>${bookTitle}</td>
        <td>${childName}</td>
        <td>${progress.progressPercent || 0}%</td>
        <td>${formatDate(progress.lastReadAt)}</td>
      `;
      progressTable.appendChild(row);
    });
  }

  function updateStateFromResponse(user) {
    state.user = user;
    state.children = user.children || [];
    state.progress = user.readingProgress || [];
    state.subscription = (user.subscriptions && user.subscriptions.length && user.subscriptions[0]) || null;
    updatePlanDetails();
    renderChildren();
    renderProgress();
  }

  async function fetchAccount() {
    try {
      const response = await fetch("/api/account", {
        headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
      });
      if (response.status === 401) {
        window.location.href = "/?authRequired=true";
        return;
      }
      const payload = await response.json();
      if (payload && payload.user) {
        updateStateFromResponse(payload.user);
      }
    } catch (error) {
      console.error("Unable to load account", error);
      showToast("Unable to load account details");
    }
  }

  if (billingForm) {
    billingForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (billingFeedback) {
        billingFeedback.textContent = "";
      }

      const body = {
        guardianName: document.getElementById("guardian-name").value,
        billingEmail: document.getElementById("billing-email").value,
        billingPhone: document.getElementById("billing-phone").value,
        subscriptionPlan: document.getElementById("subscription-plan").value,
        subscriptionStatus: document.getElementById("subscription-status").value,
        subscriptionRenewalDate: renewalInput ? renewalInput.value : null,
        paymentMethod: paymentMethodInput ? paymentMethodInput.value : null,
        billingReference: billingReferenceInput ? billingReferenceInput.value : null,
      };

      try {
        const response = await fetch("/api/account", {
          method: "PUT",
          headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const error = await response.json();
          const message = error && error.error ? error.error : "Unable to update account";
          if (billingFeedback) {
            billingFeedback.textContent = message;
          }
          showToast(message);
          return;
        }
        const payload = await response.json();
        if (payload && payload.user) {
          updateStateFromResponse(payload.user);
        }
        if (billingFeedback) {
          billingFeedback.textContent = "Billing details saved";
        }
        showToast("Billing details updated");
      } catch (error) {
        console.error("Unable to save billing details", error);
        const message = "Unable to save billing details";
        if (billingFeedback) {
          billingFeedback.textContent = message;
        }
        showToast(message);
      }
    });
  }

  if (childProfileForm) {
    childProfileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (childFeedback) {
        childFeedback.textContent = "";
      }

      const body = {
        firstName: document.getElementById("child-first-name").value,
        lastName: document.getElementById("child-last-name").value,
        birthdate: document.getElementById("child-birthdate").value,
        readingLevel: document.getElementById("child-reading-level").value,
        interests: document.getElementById("child-interests").value,
      };

      try {
        const response = await fetch("/api/account/children", {
          method: "POST",
          headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const error = await response.json();
          const message = error && error.error ? error.error : "Unable to create child profile";
          if (childFeedback) {
            childFeedback.textContent = message;
          }
          showToast(message);
          return;
        }
        const payload = await response.json();
        if (payload && payload.child) {
          state.children.push(payload.child);
          renderChildren();
        }
        childProfileForm.reset();
        if (window.M && typeof window.M.updateTextFields === "function") {
          window.M.updateTextFields();
        }
        if (childFeedback) {
          childFeedback.textContent = "Child profile added";
        }
        showToast("Child profile added");
      } catch (error) {
        console.error("Unable to create child profile", error);
        const message = "Unable to create child profile";
        if (childFeedback) {
          childFeedback.textContent = message;
        }
        showToast(message);
      }
    });
  }

  if (childList) {
    childList.addEventListener("click", async (event) => {
      const target = event.target;
      if (!target || target.getAttribute("data-action") !== "delete-child") {
        return;
      }
      event.preventDefault();
      const parent = target.closest(".collection-item");
      const childId = parent ? parent.getAttribute("data-child-id") : null;
      if (!childId) {
        return;
      }

      try {
        const response = await fetch(`/api/account/children/${childId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (!response.ok && response.status !== 204) {
          throw new Error("Unable to remove child profile");
        }
        state.children = state.children.filter((child) => `${child.id}` !== `${childId}`);
        state.progress = state.progress.filter((progress) => `${progress.ChildProfileId}` !== `${childId}`);
        renderChildren();
        renderProgress();
        showToast("Child profile removed");
      } catch (error) {
        console.error("Unable to delete child profile", error);
        showToast("Unable to remove child profile");
      }
    });
  }

  if (progressForm) {
    progressForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (progressFeedback) {
        progressFeedback.textContent = "";
      }

      const body = {
        bookId: document.getElementById("progress-book-id").value,
        childProfileId: document.getElementById("progress-child-id").value,
        progressPercent: document.getElementById("progress-percent").value,
      };

      try {
        const response = await fetch("/api/account/progress", {
          method: "PUT",
          headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const error = await response.json();
          const message = error && error.error ? error.error : "Unable to update reading progress";
          if (progressFeedback) {
            progressFeedback.textContent = message;
          }
          showToast(message);
          return;
        }
        const payload = await response.json();
        if (payload && payload.progress) {
          const existingIndex = state.progress.findIndex((entry) => entry.id === payload.progress.id);
          if (existingIndex >= 0) {
            state.progress[existingIndex] = payload.progress;
          } else {
            state.progress.push(payload.progress);
          }
          renderProgress();
        }
        if (progressFeedback) {
          progressFeedback.textContent = "Reading progress saved";
        }
        showToast("Reading progress updated");
      } catch (error) {
        console.error("Unable to update progress", error);
        const message = "Unable to update reading progress";
        if (progressFeedback) {
          progressFeedback.textContent = message;
        }
        showToast(message);
      }
    });
  }

  fetchAccount();
})();
