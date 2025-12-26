(() => {
  function isModifiedClick(event) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
  }

  function shouldHandleLink(anchor) {
    if (!anchor || anchor.tagName !== "A") return false;
    if (anchor.hasAttribute("download")) return false;
    if (anchor.getAttribute("target")) return false;
    if (anchor.dataset.noNav === "1") return false;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return false;

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return false;
    }

    if (url.origin !== window.location.origin) return false;
    if (url.pathname.startsWith("/api/")) return false;
    if (url.pathname.endsWith(".xml")) return false;
    return true;
  }

  function setLoading(isLoading) {
    document.documentElement.classList.toggle("mdoc-nav-loading", isLoading);
    const main = document.querySelector("main.main");
    if (main) main.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  function updateActiveNav(pathname) {
    document.querySelectorAll(".nav-link.active").forEach((el) => el.classList.remove("active"));
    const normalized = pathname.replace(/^\/+/, "");
    const selector = `.nav-link[href="/${CSS.escape(normalized)}"]`;
    const link = document.querySelector(selector);
    if (link) link.classList.add("active");
  }

  function syncMetaTag(doc, name) {
    const incoming = doc.querySelector(`meta[name="${CSS.escape(name)}"]`);
    if (!incoming) return;
    let current = document.querySelector(`meta[name="${CSS.escape(name)}"]`);
    if (!current) {
      current = document.createElement("meta");
      current.setAttribute("name", name);
      document.head.appendChild(current);
    }
    current.setAttribute("content", incoming.getAttribute("content") || "");
  }

  const state = {
    controller: null,
    inflightUrl: null,
  };

  async function navigateTo(url, { replaceState = false } = {}) {
    const targetUrl = typeof url === "string" ? new URL(url, window.location.href) : url;
    if (state.inflightUrl === targetUrl.href) return;

    if (state.controller) state.controller.abort();
    state.controller = new AbortController();
    state.inflightUrl = targetUrl.href;

    setLoading(true);
    try {
      const res = await fetch(targetUrl.href, {
        headers: { "X-MDoc-Navigation": "1" },
        signal: state.controller.signal,
      });
      if (!res.ok) {
        window.location.assign(targetUrl.href);
        return;
      }

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const newMain = doc.querySelector("main.main");
      const main = document.querySelector("main.main");
      if (!newMain || !main) {
        window.location.assign(targetUrl.href);
        return;
      }

      main.innerHTML = newMain.innerHTML;
      document.title = doc.title || document.title;
      syncMetaTag(doc, "description");

      if (replaceState) history.replaceState({}, "", targetUrl.href);
      else history.pushState({}, "", targetUrl.href);

      updateActiveNav(targetUrl.pathname);

      window.mdocInitPage?.();
      document.dispatchEvent(new CustomEvent("mdoc:content-updated"));

      if (targetUrl.hash) {
        const el = document.getElementById(targetUrl.hash.slice(1));
        if (el) el.scrollIntoView();
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      window.location.assign(targetUrl.href);
    } finally {
      setLoading(false);
      state.inflightUrl = null;
    }
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target?.closest?.("a");
    if (!shouldHandleLink(anchor)) return;
    if (isModifiedClick(event)) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.pathname === window.location.pathname && url.hash) {
      return;
    }

    event.preventDefault();
    navigateTo(url);
  });

  window.addEventListener("popstate", () => {
    navigateTo(new URL(window.location.href), { replaceState: true });
  });
})();
