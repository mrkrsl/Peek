(function () {
  let currentPeekWindow = null;

  // Find nearest <a> ancestor of an element
  function findLinkElement(element) {
    while (element && element !== document.body) {
      if (element.tagName?.toLowerCase() === "a") return element;
      element = element.parentElement;
    }
    return null;
  }

  // Build and show the peek overlay for a URL
  function createPeekWindow(url) {
    if (currentPeekWindow) closePeekWindow();

    const shadowHost = document.createElement("div");
    shadowHost.id = "peeky-shadow-host";
    shadowHost.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
    `;

    const shadowRoot = shadowHost.attachShadow({ mode: "open" });

    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = chrome.runtime.getURL("content.css");
    shadowRoot.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "peeky-overlay";
    overlay.tabIndex = -1;

    const container = document.createElement("div");
    container.id = "peeky-container";

    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("iframe.html");
    container.appendChild(iframe);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "peeky-buttons";

    const openButton = document.createElement("button");
    openButton.className = "peeky-button peeky-button-open";
    openButton.title = "Open in new tab (Enter)";
    const openIcon = document.createElement("img");
    openIcon.src = chrome.runtime.getURL("static/open.svg");
    openIcon.alt = "Open";
    openButton.appendChild(openIcon);
    openButton.onclick = (e) => {
      e.stopPropagation();
      window.open(url, "_blank");
      closePeekWindow();
    };

    const closeButton = document.createElement("button");
    closeButton.className = "peeky-button peeky-button-close";
    closeButton.title = "Close (Esc)";
    const closeIcon = document.createElement("img");
    closeIcon.src = chrome.runtime.getURL("static/close.svg");
    closeIcon.alt = "Close";
    closeButton.appendChild(closeIcon);
    closeButton.onclick = (e) => {
      e.stopPropagation();
      closePeekWindow();
    };

    buttonContainer.appendChild(openButton);
    buttonContainer.appendChild(closeButton);

    overlay.appendChild(container);
    overlay.appendChild(buttonContainer);

    overlay.onclick = (e) => {
      if (e.target === overlay) closePeekWindow();
    };

    // When the mouse re-enters the dim backdrop or hovers our buttons (after
    // the user clicked into the cross-origin iframe and stole focus),
    // reclaim focus so Esc works again. Cross-origin focus can't be observed
    // directly, so we use mouse re-entry as the trigger.
    const reclaimFocus = () => overlay.focus({ preventScroll: true });
    overlay.addEventListener("mouseenter", reclaimFocus);
    buttonContainer.addEventListener("mouseenter", reclaimFocus);

    const openInTab = () => {
      window.open(url, "_blank");
      closePeekWindow();
    };

    const handleKey = (key) => {
      if (key === "Escape") {
        closePeekWindow();
      } else if (key === "Enter") {
        openInTab();
      }
    };

    const onMessage = (event) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (data === "requestURL") {
        iframe.contentWindow.postMessage(url, "*");
      } else if (data && data.type === "openInNewTab") {
        window.open(data.url, "_blank");
        closePeekWindow();
      } else if (data && data.type === "peekyKey") {
        handleKey(data.key);
      }
    };
    window.addEventListener("message", onMessage);

    const keyHandler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closePeekWindow();
      } else if (e.key === "Enter") {
        // Only treat Enter as "open in tab" when our overlay/buttons are
        // focused, not when the user is typing in a host-page form.
        const ae = document.activeElement;
        if (ae === shadowHost || ae === document.body || ae === null) {
          e.preventDefault();
          e.stopPropagation();
          openInTab();
        }
      }
    };
    // Capture phase on window catches keys before host page handlers, and
    // works whether focus is on the host page document or the shadow root.
    window.addEventListener("keydown", keyHandler, true);

    shadowRoot.appendChild(overlay);
    document.body.appendChild(shadowHost);

    // Take initial keyboard focus so Esc/Enter work immediately, before the
    // iframe finishes loading and tries to steal focus.
    overlay.focus({ preventScroll: true });

    currentPeekWindow = { shadowHost, keyHandler, messageHandler: onMessage };
  }

  function closePeekWindow() {
    if (!currentPeekWindow) return;
    currentPeekWindow.shadowHost.remove();
    window.removeEventListener("keydown", currentPeekWindow.keyHandler, true);
    window.removeEventListener("message", currentPeekWindow.messageHandler);
    currentPeekWindow = null;
  }

  // Render the overlay immediately and run the frame-restriction check in parallel
  function peek(url) {
    createPeekWindow(url);
    chrome.runtime.sendMessage(
      {
        type: "checkFrameRestriction",
        url: url,
        parentUrl: window.location.href,
      },
      (response) => {
        if (response && response.blocked) {
          closePeekWindow();
          window.open(url, "_blank");
        }
      }
    );
  }

  function handleLinkClick(e) {
    if (!e.shiftKey) return;
    if (e.button === 2) return;
    const link = findLinkElement(e.target);
    if (!link?.href) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    peek(link.href);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "showPeek" && message.url) {
      peek(message.url);
    }
  });

  document.addEventListener("click", handleLinkClick, true);
  document.addEventListener("auxclick", handleLinkClick, true);
})();
