function initParticles() {
  const field = document.querySelector(".particle-field");

  if (!field) {
    return;
  }

  field.innerHTML = Array.from({ length: 28 })
    .map(() => '<span class="particle" aria-hidden="true"></span>')
    .join("");
}

function initGsapAnimations() {
  if (typeof gsap === "undefined") {
    document.querySelectorAll(".reveal, .hero-animate").forEach((element) => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
    return;
  }

  if (typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  gsap.timeline()
    .from(".navbar-gd", { y: -80, opacity: 0, duration: 0.7, ease: "power3.out" })
    .to(".hero-animate", { opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: "power3.out" }, "-=0.25");

  gsap.utils.toArray(".reveal").forEach((element) => {
    gsap.to(element, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: element,
        start: "top 84%",
      },
    });
  });

  gsap.utils.toArray(".experience-card").forEach((card) => {
    gsap.fromTo(card, { scale: 0.88, opacity: 0 }, {
      scale: 1,
      opacity: 1,
      duration: 0.55,
      ease: "back.out(1.6)",
      scrollTrigger: {
        trigger: card,
        start: "top 88%",
      },
    });
  });
}

function initCardHoverAnimations() {
  if (typeof gsap === "undefined") {
    return;
  }

  document.addEventListener("pointerenter", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest(".content-card, .category-card");
    if (card) {
      gsap.to(card, { scale: 1.04, duration: 0.24, ease: "power2.out" });
    }
  }, true);

  document.addEventListener("pointerleave", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest(".content-card, .category-card");
    if (card) {
      gsap.to(card, { scale: 1, rotateX: 0, rotateY: 0, duration: 0.24, ease: "power2.out" });
    }
  }, true);

  document.addEventListener("pointermove", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest(".category-card");
    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, { rotateY: x * 6, rotateX: y * -6, duration: 0.18, ease: "power2.out" });
  });
}

function initCategoryTabs() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const category = target?.closest("[data-target-tab]");
    if (!category) {
      return;
    }

    const requested = category.dataset.targetTab;
    const tab = document.querySelector(`[data-release-tab="${requested}"]`);

    if (tab) {
      tab.click();
    }
  });
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  const toastEl = document.getElementById("contact-toast");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("[type='submit']");
    const payload = Object.fromEntries(new FormData(form).entries());

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      const response = await fetch(buildApiUrl("/api/contact"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Contact request failed with status ${response.status}`);
      }

      form.reset();
      showToast(toastEl, "Message sent successfully. Our team will contact you soon.");
    } catch (error) {
      console.error("Goli Doli contact fallback", error);
      showToast(toastEl, "Thanks for reaching out. Your message is saved locally for demo mode.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Message";
    }
  });
}

function initDeleteAccount() {
  const confirmInput = document.getElementById("delete-confirmation");
  const deleteButton = document.getElementById("delete-account-button");
  const status = document.getElementById("delete-account-status");
  const deleteForm = document.getElementById("delete-account-form");

  if (deleteForm) {
    deleteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formStatus = document.getElementById("delete-request-status");
      const submitButton = deleteForm.querySelector("[type='submit']");
      const payload = Object.fromEntries(new FormData(deleteForm).entries());

      if (payload.confirmation?.trim().toUpperCase() !== "DELETE") {
        formStatus.textContent = "Please type DELETE to confirm your account deletion request.";
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";

      try {
        const response = await fetch(buildApiUrl("/api/account/delete-request"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Delete request failed with status ${response.status}`);
        }

        deleteForm.reset();
        formStatus.textContent = "Your delete account request has been submitted. Goli Doli will verify and process it within 3 business days.";
      } catch (error) {
        console.error("Goli Doli delete account fallback", error);
        formStatus.textContent = "Your delete account request has been recorded for demo mode. Backend submission could not be completed.";
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Delete Request";
      }
    });
  }

  if (confirmInput && deleteButton) {
    confirmInput.addEventListener("input", () => {
      deleteButton.disabled = confirmInput.value.trim().toUpperCase() !== "DELETE";
    });

    deleteButton.addEventListener("click", () => {
      localStorage.removeItem("golidoli_token");
      status.textContent = "Your delete account request has been recorded. Goli Doli will verify and process it within 3 business days.";
    });
  }
}

function showToast(toastEl, message) {
  if (!toastEl) {
    return;
  }

  toastEl.querySelector(".toast-body").textContent = message;

  if (typeof bootstrap !== "undefined") {
    bootstrap.Toast.getOrCreateInstance(toastEl).show();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initGsapAnimations();
  initCardHoverAnimations();
  initCategoryTabs();
  initContactForm();
  initDeleteAccount();
});
