(() => {
  function initShellOnce() {
    if (window.__mdocShellInitialized) return;
    window.__mdocShellInitialized = true;

    const themeToggle = document.getElementById("theme-toggle");
    const html = document.documentElement;
    const moonIcon = document.querySelector(".theme-icon-moon");
    const sunIcon = document.querySelector(".theme-icon-sun");

    function updateThemeIcon() {
      if (!moonIcon || !sunIcon) return;
      if (html.classList.contains("light-theme")) {
        moonIcon.style.display = "none";
        sunIcon.style.display = "block";
      } else {
        moonIcon.style.display = "block";
        sunIcon.style.display = "none";
      }
    }
    updateThemeIcon();

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        html.classList.toggle("light-theme");
        const isLight = html.classList.contains("light-theme");
        localStorage.setItem("theme", isLight ? "light" : "dark");
        updateThemeIcon();
      });
    }

    const mobileToggle = document.getElementById("mobile-toggle");
    const sidebar = document.getElementById("sidebar");

    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener("click", (e) => {
        sidebar.classList.toggle("open");
        e.stopPropagation();
      });

      document.addEventListener("click", (e) => {
        if (
          window.innerWidth <= 1024 &&
          sidebar.classList.contains("open") &&
          !sidebar.contains(e.target) &&
          !mobileToggle.contains(e.target)
        ) {
          sidebar.classList.remove("open");
        }
      });
    }
  }

  function enhanceCodeBlocks() {
    if (!window.hljs) return;

    document.querySelectorAll("pre code").forEach((codeEl) => {
      const pre = codeEl.parentElement;
      if (!pre) return;

      window.hljs.highlightElement(codeEl);

      if (pre.closest(".mdoc-hint")) return;

      const lang = codeEl.className.match(/language-(\w+)/)?.[1];
      if (lang && !pre.querySelector(":scope > .code-header")) {
        const header = document.createElement("div");
        header.className = "code-header";
        header.innerHTML = `<span class="code-lang">${lang}</span>`;
        pre.insertBefore(header, codeEl);
      }
    });

    document.querySelectorAll("pre").forEach((pre) => {
      if (pre.closest(".mdoc-hint")) return;
      if (pre.querySelector(":scope > .copy-btn")) return;

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = (code ? code.innerText : pre.innerText) || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "Copied!";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 2000);
        } catch {
          btn.textContent = "Failed";
          setTimeout(() => (btn.textContent = "Copy"), 900);
        }
      });
      pre.appendChild(btn);
    });
  }

  function buildApiCards() {
    const headings = document.querySelectorAll(".md-content h3");
    headings.forEach((heading) => {
      if (heading.dataset.mdocApiProcessed === "1") return;
      const next = heading.nextElementSibling;
      if (!next || next.tagName !== "UL" || !next.querySelector("li")) return;

      const items = Array.from(next.querySelectorAll("li"));
      if (items.length === 0) return;

      const details = document.createElement("details");
      details.className = "api-card";
      details.setAttribute("open", "");

      const slug =
        heading.id || heading.innerText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      heading.id = slug;

      const summary = document.createElement("summary");
      summary.innerText = heading.innerText;
      details.appendChild(summary);

      const contentDiv = document.createElement("div");
      contentDiv.className = "api-content";

      const propListDiv = document.createElement("div");
      propListDiv.className = "api-prop-list";

      items.forEach((li) => {
        const strong = li.querySelector("strong, b");
        if (!strong) {
          const div = document.createElement("div");
          div.className = "api-prop-row";
          div.innerHTML = `<div class="api-prop-value" style="grid-column: 1 / -1">${li.innerHTML}</div>`;
          propListDiv.appendChild(div);
          return;
        }

        const label = strong.innerText.replace(":", "").trim();
        strong.remove();
        const value = li.innerHTML.trim();

        if (label.toLowerCase() === "signature") {
          const sigBox = document.createElement("div");
          sigBox.className = "api-signature-box";
          sigBox.innerHTML = `<span class="api-signature-label">func</span> <span>${value}</span>`;
          contentDiv.prepend(sigBox);
        } else {
          const row = document.createElement("div");
          row.className = "api-prop-row";

          const labelDiv = document.createElement("div");
          labelDiv.className = "api-prop-label";
          labelDiv.textContent = label;

          const valueDiv = document.createElement("div");
          valueDiv.className = "api-prop-value";
          valueDiv.innerHTML = value;

          row.appendChild(labelDiv);
          row.appendChild(valueDiv);
          propListDiv.appendChild(row);
        }
      });

      contentDiv.appendChild(propListDiv);
      details.appendChild(contentDiv);

      next.replaceWith(details);
      heading.style.display = "none";
      heading.dataset.mdocApiProcessed = "1";
    });
  }

  function buildToc() {
    const tocList = document.getElementById("toc-list");
    if (!tocList) return;

    tocList.innerHTML = "";
    if (window.__mdocTocObserver) {
      window.__mdocTocObserver.disconnect();
      window.__mdocTocObserver = null;
    }

    const headings = document.querySelectorAll(".md-content h2, .md-content h3");
    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id = heading.innerText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + heading.id;
      a.className = "toc-link";
      a.textContent = heading.innerText;

      if (heading.tagName === "H3") a.style.paddingLeft = "35px";

      li.appendChild(a);
      tocList.appendChild(li);
    });

    const tocContainer = document.querySelector(".toc");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          document
            .querySelectorAll(".toc-link")
            .forEach((link) => link.classList.remove("active"));
          const activeLink = document.querySelector(
            `.toc-link[href="#${entry.target.id}"]`,
          );
          if (!activeLink) return;
          activeLink.classList.add("active");
          if (tocContainer) {
            activeLink.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px" },
    );

    headings.forEach((h) => observer.observe(h));
    window.__mdocTocObserver = observer;
  }

  function scrollSidebarToActive() {
    const sidebarEl = document.getElementById("sidebar");
    const activeNavLink = document.querySelector(".nav-link.active");
    if (!activeNavLink || !sidebarEl) return;

    const rect = activeNavLink.getBoundingClientRect();
    const sidebarRect = sidebarEl.getBoundingClientRect();
    const offset =
      rect.top -
      sidebarRect.top -
      sidebarEl.clientHeight / 2 +
      sidebarEl.scrollTop;
    sidebarEl.scrollTop = offset;
  }

  function initContent() {
    enhanceCodeBlocks();
    buildApiCards();
    buildToc();

    if (window.lucide?.createIcons) window.lucide.createIcons();
    scrollSidebarToActive();
  }

  window.mdocInitShellOnce = initShellOnce;
  window.mdocInitContent = initContent;
  window.mdocInitPage = () => {
    initShellOnce();
    initContent();
  };
})();
