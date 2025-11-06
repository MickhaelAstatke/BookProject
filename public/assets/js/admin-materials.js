(function () {
  "use strict";

  const adminContainer = document.querySelector("[data-admin-materials]");
  if (!adminContainer) {
    return;
  }

  const initialState = window.__ADMIN_MATERIALS__ || {};
  let materials = Array.isArray(initialState.materials) ? [...initialState.materials] : [];
  const authors = Array.isArray(initialState.authors) ? initialState.authors : [];

  const form = adminContainer.querySelector("#material-form");
  const formTitle = adminContainer.querySelector("[data-form-title]");
  const feedback = form.querySelector("[data-feedback]");
  const submitButton = form.querySelector("[data-submit]");
  const cancelButton = form.querySelector("[data-cancel]");
  const tableBody = adminContainer.querySelector("[data-materials-list]");

  let editingId = null;

  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setFeedback(type, message) {
    if (!feedback) {
      return;
    }
    feedback.textContent = message || "";
    feedback.classList.remove("is-success", "is-error");
    if (type === "success") {
      feedback.classList.add("is-success");
    } else if (type === "error") {
      feedback.classList.add("is-error");
    }
  }

  function resetForm() {
    form.reset();
    editingId = null;
    formTitle.textContent = "Upload a new material";
    submitButton.textContent = "Create material";
    cancelButton.hidden = true;
    form.classList.remove("is-editing");
    setFeedback(null, "");
  }

  function getAuthorName(material) {
    if (material.Author) {
      return `${material.Author.firstName} ${material.Author.lastName}`;
    }
    const matching = authors.find((author) => author.id === material.AuthorId);
    if (matching) {
      return matching.fullName || `${matching.firstName} ${matching.lastName}`;
    }
    return "—";
  }

  function getUploaderLabel(material) {
    if (material.uploader) {
      return material.uploader.displayName || material.uploader.email || "—";
    }
    return "—";
  }

  function renderMaterials() {
    if (!tableBody) {
      return;
    }

    if (!materials.length) {
      tableBody.innerHTML =
        '<tr><td colspan="8" class="admin-table__empty">No materials have been uploaded yet.</td></tr>';
      return;
    }

    const rows = materials
      .map((material) => {
        const authorName = getAuthorName(material);
        const uploaderLabel = getUploaderLabel(material);
        const assetLink = material.assetUrl
          ? `<a href="${escapeHtml(material.assetUrl)}" target="_blank" rel="noopener">Open</a>`
          : "—";
        const thumbnailLink = material.thumbnailUrl
          ? `<a href="${escapeHtml(material.thumbnailUrl)}" target="_blank" rel="noopener">View</a>`
          : "—";
        const premiumLabel = material.isPremium ? "Yes" : "No";

        return `
          <tr data-material-id="${escapeHtml(material.id)}">
            <td data-cell="title">${escapeHtml(material.title)}</td>
            <td data-cell="type">${escapeHtml(material.type)}</td>
            <td data-cell="author" data-author-id="${escapeHtml(material.AuthorId)}">${escapeHtml(authorName)}</td>
            <td data-cell="premium">${premiumLabel}</td>
            <td data-cell="uploader">${escapeHtml(uploaderLabel)}</td>
            <td data-cell="asset">${assetLink}</td>
            <td data-cell="thumbnail">${thumbnailLink}</td>
            <td class="admin-table__actions">
              <button type="button" class="btn btn--small" data-edit>Edit</button>
              <button type="button" class="btn btn--small btn--danger" data-delete>Delete</button>
            </td>
          </tr>
        `;
      })
      .join("\n");

    tableBody.innerHTML = rows;
  }

  function findMaterialById(id) {
    return materials.find((material) => String(material.id) === String(id));
  }

  function populateForm(material) {
    form.elements.title.value = material.title || "";
    form.elements.type.value = material.type || "";
    form.elements.AuthorId.value = material.AuthorId != null ? String(material.AuthorId) : "";
    form.elements.description.value = material.description || "";
    form.elements.isPremium.checked = Boolean(material.isPremium);
    form.elements.thumbnailUrl.value = material.thumbnailUrl || "";
    form.elements.assetUrl.value = material.assetUrl || "";

    formTitle.textContent = "Edit material";
    submitButton.textContent = "Save changes";
    cancelButton.hidden = false;
    form.classList.add("is-editing");
    setFeedback(null, "");
  }

  function updateState(updatedMaterial) {
    const index = materials.findIndex((material) => String(material.id) === String(updatedMaterial.id));
    if (index === -1) {
      materials.unshift(updatedMaterial);
    } else {
      materials.splice(index, 1, updatedMaterial);
    }
    window.__ADMIN_MATERIALS__ = {
      authors,
      materials,
    };
    renderMaterials();
  }

  function removeFromState(id) {
    materials = materials.filter((material) => String(material.id) !== String(id));
    window.__ADMIN_MATERIALS__ = {
      authors,
      materials,
    };
    renderMaterials();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(form);
    formData.set("isPremium", form.elements.isPremium.checked ? "true" : "false");

    const url = editingId ? `/api/admin/materials/${editingId}` : "/api/admin/materials";
    const method = editingId ? "PUT" : "POST";

    submitButton.disabled = true;
    submitButton.dataset.loading = "true";
    setFeedback(null, "");

    try {
      const response = await fetch(url, {
        method,
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save material");
      }

      updateState(payload.material);
      setFeedback("success", editingId ? "Material updated" : "Material created");
      resetForm();
    } catch (error) {
      console.error(error);
      setFeedback("error", error.message || "Unable to save material");
    } finally {
      submitButton.disabled = false;
      delete submitButton.dataset.loading;
    }
  }

  async function handleDelete(id) {
    const material = findMaterialById(id);
    if (!material) {
      return;
    }
    const confirmed = window.confirm(`Delete \"${material.title}\"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/materials/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete material");
      }
      removeFromState(id);
      setFeedback("success", "Material deleted");
      if (editingId && String(editingId) === String(id)) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      setFeedback("error", error.message || "Failed to delete material");
    }
  }

  function handleTableClick(event) {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");
    const row = event.target.closest("[data-material-id]");
    if (!row) {
      return;
    }
    const id = row.getAttribute("data-material-id");

    if (editButton) {
      const material = findMaterialById(id);
      if (material) {
        editingId = id;
        populateForm(material);
      }
      return;
    }

    if (deleteButton) {
      handleDelete(id);
    }
  }

  function handleCancel() {
    resetForm();
  }

  form.addEventListener("submit", handleSubmit);
  cancelButton.addEventListener("click", handleCancel);
  tableBody.addEventListener("click", handleTableClick);

  renderMaterials();
})();
