/* eslint-env jquery */
/* global firebase */
(function () {
  const firebaseConfig = window.__FIREBASE_CONFIG__ || {};
  const authModal = document.getElementById("auth-modal");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginError = document.getElementById("login-error");
  const signupError = document.getElementById("signup-error");
  const loginVerifyNote = document.getElementById("login-verify-note");
  const signupVerifyNote = document.getElementById("signup-verify-note");
  const googleSigninButton = document.getElementById("google-signin");
  const googleSignupButton = document.getElementById("signup-google");
  const loginLink = document.getElementById("login-link");
  const logoutLink = document.getElementById("logout-link");
  const accountLink = document.getElementById("account-link");
  const adminLink = document.getElementById("admin-link");
  const showSignupLink = document.getElementById("show-signup");
  const showLoginLink = document.getElementById("show-login");
  const serverKnowsUser = Boolean(window.__SERVER_KNOWS_USER__);
  const serverCurrentUser = window.__SERVER_CURRENT_USER__ || null;
  const serverAuthConfigured = window.__SERVER_AUTH_CONFIGURED__ !== false;

  function readSessionCookie() {
    const cookie = document.cookie || "";
    const segments = cookie.split(";");
    for (let i = 0; i < segments.length; i += 1) {
      const part = segments[i].trim();
      if (part.startsWith("__session=")) {
        return decodeURIComponent(part.split("=")[1] || "");
      }
    }
    return null;
  }

  function attachAjaxAuthorization() {
    if (window.jQuery && typeof window.jQuery.ajaxSetup === "function") {
      window.jQuery.ajaxSetup({
        beforeSend: function (xhr) {
          if (window.__AUTH_TOKEN__) {
            xhr.setRequestHeader("Authorization", "Bearer " + window.__AUTH_TOKEN__);
          }
        },
      });
    }
  }

  function setSessionCookie(token, expirationTime) {
    if (!token) {
      return;
    }
    const attributes = ["__session=" + encodeURIComponent(token), "path=/", "SameSite=Lax"];
    if (expirationTime) {
      const expirationDate = new Date(expirationTime);
      if (!Number.isNaN(expirationDate.getTime())) {
        attributes.push("expires=" + expirationDate.toUTCString());
      }
    }
    if (window.location.protocol === "https:") {
      attributes.push("Secure");
    }
    document.cookie = attributes.join("; ");
  }

  function clearSessionCookie() {
    document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }

  function setAuthToken(token, expirationTime) {
    window.__AUTH_TOKEN__ = token || null;
    if (token) {
      setSessionCookie(token, expirationTime);
    }
    attachAjaxAuthorization();
  }

  function clearAuthToken() {
    window.__AUTH_TOKEN__ = null;
    clearSessionCookie();
    attachAjaxAuthorization();
  }

  function setElementVisible(element, visible) {
    if (!element) {
      return;
    }
    element.style.display = visible ? "inline-block" : "none";
  }

  function updateAuthUI(isAuthenticated) {
    setElementVisible(loginLink, !isAuthenticated);
    setElementVisible(logoutLink, isAuthenticated);
    setElementVisible(accountLink, isAuthenticated);
    setElementVisible(adminLink, isAuthenticated && Boolean(serverCurrentUser && serverCurrentUser.isAdmin));
  }

  function openAuthModal() {
    if (!authModal) {
      return;
    }
    if (window.$ && typeof window.$(authModal).modal === "function") {
      window.$(authModal).modal("open");
    } else {
      authModal.style.display = "flex";
      authModal.setAttribute("aria-hidden", "false");
    }
  }

  function closeAuthModal() {
    if (!authModal) {
      return;
    }
    if (window.$ && typeof window.$(authModal).modal === "function") {
      window.$(authModal).modal("close");
    } else {
      authModal.style.display = "none";
      authModal.setAttribute("aria-hidden", "true");
    }
  }

  function showLoginForm() {
    if (loginForm) {
      loginForm.classList.remove("hide");
    }
    if (signupForm) {
      signupForm.classList.add("hide");
    }
    if (loginError) {loginError.textContent = "";}
    if (signupError) {signupError.textContent = "";}
    if (loginVerifyNote) {loginVerifyNote.textContent = "";}
    if (signupVerifyNote) {signupVerifyNote.textContent = "";}
  }

  function showSignupForm() {
    if (signupForm) {
      signupForm.classList.remove("hide");
    }
    if (loginForm) {
      loginForm.classList.add("hide");
    }
    if (loginError) {loginError.textContent = "";}
    if (signupError) {signupError.textContent = "";}
    if (loginVerifyNote) {loginVerifyNote.textContent = "";}
    if (signupVerifyNote) {signupVerifyNote.textContent = "";}
  }

  async function signInWithGoogle(auth) {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    await auth.signInWithPopup(provider);
    closeAuthModal();
  }

  async function requireVerifiedEmail(user) {
    if (!user || user.emailVerified) {
      return true;
    }
    await user.sendEmailVerification();
    await firebase.auth().signOut();
    if (loginVerifyNote) {
      loginVerifyNote.textContent = "Please verify your email before signing in. We sent a verification link.";
    }
    return false;
  }

  window.openAuthModal = openAuthModal;
  const existingToken = readSessionCookie();
  if (existingToken) {
    window.__AUTH_TOKEN__ = existingToken;
  }
  attachAjaxAuthorization();
  updateAuthUI(serverKnowsUser);

  if (!firebaseConfig.apiKey || !firebaseConfig.appId || !firebaseConfig.authDomain || !window.firebase) {
    console.warn("Firebase authentication is not fully configured.");
    setElementVisible(loginLink, false);
    if (logoutLink) {
      logoutLink.addEventListener("click", function (event) {
        event.preventDefault();
        clearAuthToken();
        if (!handlePostLoginRedirect()) {
          window.location.reload();
        }
      });
    }
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
  } catch (error) {
    if (!/already exists/u.test(error.message)) {
      console.error("Failed to initialise Firebase", error);
    }
  }

  const auth = firebase.auth();
  let reloadHandled = false;

  function handlePostLoginRedirect() {
    if (typeof window.sessionStorage === "undefined") {
      return false;
    }
    const redirect = window.sessionStorage.getItem("postLoginRedirect");
    if (redirect) {
      window.sessionStorage.removeItem("postLoginRedirect");
      window.location.href = redirect;
      return true;
    }
    return false;
  }

  if (showSignupLink) {
    showSignupLink.addEventListener("click", function (event) {
      event.preventDefault();
      showSignupForm();
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener("click", function (event) {
      event.preventDefault();
      showLoginForm();
    });
  }

  if (loginLink) {
    loginLink.addEventListener("click", function (event) {
      event.preventDefault();
      showLoginForm();
      openAuthModal();
    });
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", async function (event) {
      event.preventDefault();
      try {
        await auth.signOut();
      } catch (error) {
        console.error("Failed to sign out", error);
        clearAuthToken();
        if (!handlePostLoginRedirect()) {
          window.location.reload();
        }
      }
    });
  }

  if (googleSigninButton) {
    googleSigninButton.addEventListener("click", async function () {
      try {
        await signInWithGoogle(auth);
      } catch (error) {
        if (loginError) {loginError.textContent = error.message || "Google sign-in failed";}
      }
    });
  }

  if (googleSignupButton) {
    googleSignupButton.addEventListener("click", async function () {
      try {
        await signInWithGoogle(auth);
      } catch (error) {
        if (signupError) {signupError.textContent = error.message || "Google sign-up failed";}
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (loginError) {loginError.textContent = "";}
      if (loginVerifyNote) {loginVerifyNote.textContent = "";}
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      try {
        const credential = await auth.signInWithEmailAndPassword(email, password);
        const allowed = await requireVerifiedEmail(credential.user);
        if (allowed) {
          closeAuthModal();
        }
      } catch (error) {
        if (loginError) {loginError.textContent = error.message || "Unable to sign in";}
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (signupError) {signupError.textContent = "";}
      if (signupVerifyNote) {signupVerifyNote.textContent = "";}
      const displayName = document.getElementById("signup-display-name").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const confirmPassword = document.getElementById("signup-confirm-password").value;

      if (password !== confirmPassword) {
        if (signupError) {signupError.textContent = "Passwords do not match";}
        return;
      }

      try {
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        if (credential && credential.user && displayName) {
          await credential.user.updateProfile({ displayName: displayName });
        }
        if (credential && credential.user) {
          await credential.user.sendEmailVerification();
          await auth.signOut();
        }
        if (signupVerifyNote) {
          signupVerifyNote.textContent = "Verification email sent. Verify your inbox, then sign in.";
        }
        showLoginForm();
      } catch (error) {
        if (signupError) {signupError.textContent = error.message || "Unable to create account";}
      }
    });
  }

  auth.onIdTokenChanged(async function (user) {
    if (user) {
      try {
        const tokenResult = await user.getIdTokenResult();
        setAuthToken(tokenResult.token, tokenResult.expirationTime);
      } catch (error) {
        console.error("Unable to refresh Firebase token", error);
      }
    } else {
      clearAuthToken();
    }
  });

  auth.onAuthStateChanged(function (user) {
    updateAuthUI(Boolean(user));
    window.__CURRENT_USER__ = user
      ? { uid: user.uid, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified }
      : null;

    if (user) {
      if (serverAuthConfigured && !serverKnowsUser && !reloadHandled) {
        reloadHandled = true;
        if (!handlePostLoginRedirect()) {
          window.location.reload();
        }
      }
    } else if (serverAuthConfigured && serverKnowsUser && !reloadHandled) {
      reloadHandled = true;
      window.location.reload();
    }
  });
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("authRequired") === "true") {
    const nextPath = searchParams.get("next");
    if (nextPath && typeof window.sessionStorage !== "undefined") {
      window.sessionStorage.setItem("postLoginRedirect", nextPath);
    }
    showLoginForm();
    openAuthModal();
    if (window.history && window.history.replaceState) {
      searchParams.delete("authRequired");
      searchParams.delete("next");
      const query = searchParams.toString();
      window.history.replaceState({}, document.title, window.location.pathname + (query ? `?${query}` : ""));
    }
  }

})();
