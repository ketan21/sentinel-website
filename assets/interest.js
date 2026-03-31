(function () {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.body.classList.add("is-ready");

    const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
    if (prefersReducedMotion.matches) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    } else if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.16,
                rootMargin: "0px 0px -8% 0px",
            },
        );

        revealElements.forEach((element) => observer.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    }

    const form = document.getElementById("interest-form");
    const status = document.getElementById("form-status");
    const submitButton = document.getElementById("submit-button");

    if (!form || !status || !submitButton) {
        return;
    }

    const setStatus = (message, tone) => {
        status.textContent = message;
        status.classList.remove("is-error", "is-success");
        if (tone === "error") {
            status.classList.add("is-error");
        } else if (tone === "success") {
            status.classList.add("is-success");
        }
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = Object.fromEntries(
            Array.from(formData.entries(), ([key, value]) => [key, String(value).trim()]),
        );

        if (!payload.name || !payload.email || !payload.address) {
            setStatus("Name, email, and address are required.", "error");
            return;
        }

        if (!payload.website && !payload.message) {
            setStatus("Add either a business website or a message so we have enough context.", "error");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        setStatus("Submitting your request...", null);

        try {
            const response = await fetch("/api/interest", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setStatus(
                    data.error || "The request could not be submitted right now. Please try again shortly.",
                    "error",
                );
                return;
            }

            form.reset();
            setStatus("Request received. We will review it and follow up with the right demo path.", "success");
        } catch (_error) {
            setStatus("Network error. Please retry in a moment.", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Send request";
        }
    });
})();
