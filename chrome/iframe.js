// Request URL from parent window
window.parent.postMessage("requestURL", "*");

// Forward Esc to the parent so the overlay can be dismissed even when
// focus is on this (same-origin) iframe document instead of the host page.
window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape") {
      window.parent.postMessage({ type: "peekyKey", key: e.key }, "*");
    }
  },
  true
);

function createIframe(url) {
  const iframe = document.createElement("iframe");
  let hasLoaded = false;

  // Detect if iframe fails to load (timeout)
  const timeout = setTimeout(function () {
    if (!hasLoaded) {
      if (iframe.contentWindow) {
        return;
      }
      showError(url);
      iframe.remove();
      window.parent.postMessage({ type: "iframeLoaded", success: false }, "*");
    }
  }, 5000);

  iframe.onload = function () {
    hasLoaded = true;
    clearTimeout(timeout);
    window.parent.postMessage({ type: "iframeLoaded", success: true }, "*");
  };

  iframe.onerror = function () {
    clearTimeout(timeout);
    showError(url);
    iframe.remove();
    window.parent.postMessage({ type: "iframeLoaded", success: false }, "*");
  };

  iframe.src = url;
  document.body.appendChild(iframe);
}

// Receive URL and create iframe
window.addEventListener("message", function (event) {
  if (typeof event.data === "string" && event.data.startsWith("http")) {
    createIframe(event.data);
  }
});

// Show error message when iframe is blocked
function showError(url) {
  const errorContainer = document.createElement("div");
  errorContainer.className = "iframe-error";

  const icon = document.createElement("div");
  icon.className = "iframe-error-icon";
  icon.textContent = "🔒";

  const title = document.createElement("h2");
  title.className = "iframe-error-title";
  title.textContent = "Cannot Preview This Page";

  const message = document.createElement("p");
  message.className = "iframe-error-message";
  message.textContent =
    "This page failed to load in the preview. It may have additional protection or network issues.";

  const urlDisplay = document.createElement("div");
  urlDisplay.className = "iframe-error-url";
  urlDisplay.textContent = url;

  const button = document.createElement("button");
  button.className = "iframe-error-button";
  button.textContent = "Open in New Tab";
  button.onclick = () => {
    window.parent.postMessage({ type: "openInNewTab", url: url }, "*");
  };

  errorContainer.appendChild(icon);
  errorContainer.appendChild(title);
  errorContainer.appendChild(message);
  errorContainer.appendChild(urlDisplay);
  errorContainer.appendChild(button);

  document.body.appendChild(errorContainer);
}
