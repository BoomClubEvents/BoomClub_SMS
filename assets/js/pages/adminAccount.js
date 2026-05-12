import { getAdminPassword, saveAdminPassword } from "../storage.js";

export function initAdminAccountPage() {
  bindAdminAccountEvents();
}

function bindAdminAccountEvents() {
  const form = document.getElementById("adminPasswordForm");
  const forgotBtn = document.getElementById("forgotAdminPasswordBtn");
  const backBtn = document.getElementById("backToAdminAccountBtn");

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    const togglePassword = () => {
      const inputId = button.dataset.togglePassword;
      const input = document.getElementById(inputId);

      if (!input) return;

      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "🙈" : "👁";
      button.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
      );
    };

    button.addEventListener("click", togglePassword);

    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        togglePassword();
      }
    });
  });

  if (form) {
    form.addEventListener("submit", handleAdminPasswordSubmit);
  }

  if (forgotBtn) {
    forgotBtn.addEventListener("click", showForgotPasswordComingSoon);
    forgotBtn.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showForgotPasswordComingSoon();
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", showAdminAccountMainView);
  }
}

function handleAdminPasswordSubmit(event) {
  event.preventDefault();

  const currentPasswordInput = document.getElementById("adminCurrentPassword");
  const newPasswordInput = document.getElementById("adminNewPassword");
  const confirmPasswordInput = document.getElementById("adminConfirmPassword");

  const currentPassword = currentPasswordInput ? currentPasswordInput.value : "";
  const newPassword = newPasswordInput ? newPasswordInput.value : "";
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

  const savedPassword = getAdminPassword();

  if (currentPassword.length === 0) {
    showAdminPasswordMessage("Current password is required.", "error");
    return;
  }

  if (newPassword.length === 0) {
    showAdminPasswordMessage("New password is required.", "error");
    return;
  }

  if (confirmPassword.length === 0) {
    showAdminPasswordMessage("Confirm new password is required.", "error");
    return;
  }

  if (currentPassword !== savedPassword) {
    showAdminPasswordMessage(
      "Current password is incorrect. Password is case-sensitive and space-sensitive.",
      "error"
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    showAdminPasswordMessage(
      "New password and confirm password do not match.",
      "error"
    );
    return;
  }

  saveAdminPassword(newPassword);

  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  confirmPasswordInput.value = "";

  resetAdminPasswordInputsToHidden();

  showAdminPasswordMessage("Admin password updated successfully.", "success");
}

function resetAdminPasswordInputsToHidden() {
  ["adminCurrentPassword", "adminNewPassword", "adminConfirmPassword"].forEach(
    (inputId) => {
      const input = document.getElementById(inputId);
      if (input) input.type = "password";
    }
  );

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.textContent = "👁";
    button.setAttribute("aria-label", "Show password");
  });
}

function showAdminPasswordMessage(message, type = "info") {
  const messageEl = document.getElementById("adminPasswordMessage");
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.className = `admin-password-message show ${type}`;
}

function showForgotPasswordComingSoon() {
  const mainView = document.getElementById("adminAccountMainView");
  const comingSoonView = document.getElementById("forgotPasswordComingSoonView");

  if (mainView) mainView.classList.add("hidden");
  if (comingSoonView) comingSoonView.classList.remove("hidden");
}

function showAdminAccountMainView() {
  const mainView = document.getElementById("adminAccountMainView");
  const comingSoonView = document.getElementById("forgotPasswordComingSoonView");

  if (comingSoonView) comingSoonView.classList.add("hidden");
  if (mainView) mainView.classList.remove("hidden");
}