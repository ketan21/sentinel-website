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
                threshold: 0.18,
                rootMargin: "0px 0px -8% 0px",
            },
        );

        revealElements.forEach((element) => observer.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    }

    /* ── Active nav section tracking ── */
    const navLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
    const sections = navLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    if (sections.length && "IntersectionObserver" in window) {
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        navLinks.forEach((link) => link.classList.remove("is-active"));
                        const match = navLinks.find(
                            (link) => link.getAttribute("href") === `#${entry.target.id}`,
                        );
                        if (match) match.classList.add("is-active");
                    }
                });
            },
            { rootMargin: "-30% 0px -60% 0px" },
        );

        sections.forEach((section) => sectionObserver.observe(section));
    }

    if (prefersReducedMotion.matches) {
        return;
    }

    const stage = document.querySelector("[data-tilt]");
    if (!stage) {
        return;
    }

    const clearTilt = () => {
        stage.style.setProperty("--tilt-x", "0deg");
        stage.style.setProperty("--tilt-y", "0deg");
    };

    stage.addEventListener("pointermove", (event) => {
        const rect = stage.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const tiltX = (0.5 - py) * 8;
        const tiltY = (px - 0.5) * 10;

        stage.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        stage.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    });

    stage.addEventListener("pointerleave", clearTilt);
    stage.addEventListener("pointercancel", clearTilt);
})();
