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

    const onMessage = (event) => {
      if (event.source !== iframe.contentWindow) return;
      if (event.data === "requestURL") {
        iframe.contentWindow.postMessage(url, "*");
      } else if (event.data && event.data.type === "openInNewTab") {
        window.open(event.data.url, "_blank");
        closePeekWindow();
      }
    };
    window.addEventListener("message", onMessage);

    const keyHandler = (e) => {
      if (e.key === "Escape") {
        closePeekWindow();
      } else if (e.key === "Enter") {
        e.preventDefault();
        window.open(url, "_blank");
        closePeekWindow();
      }
    };
    document.addEventListener("keydown", keyHandler);

    shadowRoot.appendChild(overlay);
    document.body.appendChild(shadowHost);

    currentPeekWindow = { shadowHost, keyHandler, messageHandler: onMessage };
  }

  function closePeekWindow() {
    if (!currentPeekWindow) return;
    currentPeekWindow.shadowHost.remove();
    document.removeEventListener("keydown", currentPeekWindow.keyHandler);
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
