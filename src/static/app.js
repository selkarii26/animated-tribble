document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?ts=${Date.now()}`);
      const activities = await response.json();

      // Clear loading message and reset select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = (details.participants && details.participants.length)
          ? `<div class="participants"><strong>Participants:</strong><ul class="participants-list">${details.participants.map(p => `<li><span class="participant-email">${p}</span><button class="participant-remove" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">✖</button></li>`).join('')}</ul></div>`
          : `<p class="no-participants"><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for participant remove buttons
        activityCard.querySelectorAll('.participant-remove').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const emailToRemove = btn.dataset.email;
            const actName = btn.dataset.activity;
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(actName)}/participants?email=${encodeURIComponent(emailToRemove)}`,
                { method: 'DELETE' }
              );
              const resJson = await resp.json();
              if (resp.ok) {
                messageDiv.textContent = resJson.message;
                messageDiv.className = 'message success';
                await fetchActivities();
              } else {
                messageDiv.textContent = resJson.detail || 'An error occurred';
                messageDiv.className = 'message error';
              }
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            } catch (err) {
              messageDiv.textContent = 'Failed to remove participant.';
              messageDiv.className = 'message error';
              messageDiv.classList.remove('hidden');
              console.error('Error removing participant:', err);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'message success';
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = 'message error';
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
