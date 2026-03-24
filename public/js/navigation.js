document.addEventListener("click", async (e) => {
    // Ensure clicks on links with data-link behave as SPA nav.
    const anchor = e.target.closest("[data-link]");
    if (!anchor) return;

    e.preventDefault();

    const url = anchor.href;
    const response = await fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    if (!response.ok) {
        window.location.href = url; // fallback to full load
        return;
    }

    const html = await response.text();
    const content = document.getElementById("content");

    if (!content) {
        window.location.href = url;
        return;
    }

    let parsed = null;
    if (html.trim().startsWith('<')) {
        const parser = new DOMParser();
        parsed = parser.parseFromString(html, 'text/html');
    }

    if (parsed) {
        const newContent = parsed.getElementById('content') || parsed.body;
        if (newContent) {
            content.innerHTML = newContent.innerHTML;
        } else {
            content.innerHTML = html;
        }

        const newTitle = parsed.querySelector('title')?.textContent;
        if (newTitle) {
            document.title = newTitle;
        }
    } else {
        content.innerHTML = html;
    }

    // Execute scripts that were added via AJAX
    content.querySelectorAll('script').forEach((script) => {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
        document.body.removeChild(newScript);
    });

    window.history.pushState({}, "", url);
    window.dispatchEvent(new CustomEvent('page:changed'));
});

window.addEventListener("popstate", async () => {
    const url = window.location.pathname;
    const response = await fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    if (!response.ok) {
        window.location.reload();
        return;
    }

    const html = await response.text();
    const content = document.getElementById("content");

    if (!content) {
        window.location.reload();
        return;
    }

    let parsed = null;
    if (html.trim().startsWith('<')) {
        const parser = new DOMParser();
        parsed = parser.parseFromString(html, 'text/html');
    }

    if (parsed) {
        const newContent = parsed.getElementById('content') || parsed.body;
        if (newContent) {
            content.innerHTML = newContent.innerHTML;
        } else {
            content.innerHTML = html;
        }

        const newTitle = parsed.querySelector('title')?.textContent;
        if (newTitle) {
            document.title = newTitle;
        }
    } else {
        content.innerHTML = html;
    }

    content.querySelectorAll('script').forEach((script) => {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
        document.body.removeChild(newScript);
    });

    window.dispatchEvent(new CustomEvent('page:changed'));
});

window.addEventListener("popstate", async () => {
    const url = window.location.pathname;
    const response = await fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    if (!response.ok) {
        window.location.reload();
        return;
    }
    const html = await response.text();
    const content = document.getElementById("content");
    if (!content) {
        window.location.reload();
        return;
    }
    content.innerHTML = html;
    window.dispatchEvent(new CustomEvent('page:changed'));
});

window.addEventListener("popstate", async () => {
    const url = window.location.pathname;
    const response = await fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    const html = await response.text();
    document.getElementById("content").innerHTML = html;
});