/**
 * Onshore Hub form handler.
 * Sends the contact form and newsletter sign-ups to Web3Forms
 * (https://web3forms.com), which forwards each submission by email.
 *
 * The access key below is designed to be public: Web3Forms only uses it to
 * know which inbox to deliver to. Do not put any other secrets in this file.
 */
(function () {
  "use strict";

  const ENDPOINT = "https://api.web3forms.com/submit";
  const ACCESS_KEY = "1752d5be-658a-4734-a1c1-7424c194d28a";

  const SUBJECTS = {
    contact: "New billing audit request from onshorehub.co",
    newsletter: "New newsletter sign-up from onshorehub.co"
  };

  function show(el, visible) {
    if (!el) return;
    el.classList.toggle("d-block", visible);
  }

  function buildPayload(form, type) {
    const data = new FormData(form);
    const payload = {
      access_key: ACCESS_KEY,
      subject: SUBJECTS[type] || "New website enquiry from onshorehub.co",
      from_name: "Onshore Hub website",
      form_type: type,
      page: window.location.pathname
    };

    // Group repeated fields (such as the services[] checkboxes) into one line.
    const grouped = {};
    data.forEach(function (value, key) {
      const name = key.replace(/\[\]$/, "");
      if (grouped[name]) {
        grouped[name] += ", " + value;
      } else {
        grouped[name] = value;
      }
    });
    Object.keys(grouped).forEach(function (key) {
      payload[key] = grouped[key];
    });

    if (payload.email && !payload.replyto) {
      payload.replyto = payload.email;
    }
    return payload;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const type = form.getAttribute("data-form-type") || "contact";
    const loading = form.querySelector(".loading");
    const error = form.querySelector(".error-message");
    const sent = form.querySelector(".sent-message");
    const button = form.querySelector('[type="submit"]');

    // Simple spam trap: real visitors never fill in the hidden botcheck field.
    const trap = form.querySelector('input[name="botcheck"]');
    if (trap && trap.checked) return;

    show(error, false);
    show(sent, false);
    show(loading, true);
    if (button) button.disabled = true;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(buildPayload(form, type))
    })
      .then(function (response) {
        return response.json().then(function (json) {
          if (!response.ok || !json.success) {
            throw new Error(json.message || "Something went wrong. Please try again.");
          }
          return json;
        });
      })
      .then(function () {
        show(loading, false);
        show(sent, true);
        form.reset();
      })
      .catch(function (err) {
        show(loading, false);
        if (error) {
          error.textContent =
            (err && err.message ? err.message + " " : "") +
            "If the problem continues, please email info@onshorehub.co.";
          show(error, true);
        }
      })
      .finally(function () {
        if (button) button.disabled = false;
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("form[data-form-type]").forEach(function (form) {
      if (!form.querySelector('input[name="botcheck"]')) {
        const trap = document.createElement("input");
        trap.type = "checkbox";
        trap.name = "botcheck";
        trap.tabIndex = -1;
        trap.autocomplete = "off";
        trap.setAttribute("aria-hidden", "true");
        trap.style.display = "none";
        form.appendChild(trap);
      }
      form.addEventListener("submit", handleSubmit);
    });
  });
})();
