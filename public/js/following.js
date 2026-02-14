document.addEventListener("DOMContentLoaded", () => {
    const followingsContainer = document.querySelector("#following-container");

    // Show loading state
    followingsContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading followings...</p>
        </div>
    `;

    const followingForm = document.querySelector("#following-form");
    if (followingForm) {
        followingForm.addEventListener("submit", (event) => {
            event.preventDefault();
            fetch(followingForm.action, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
            })
                .then(handleResponse)
                .then(displayFollowings)
                .catch(handleError);
        })

    }


    function handleResponse(response) {
        if (!response.ok) {
            // Handle specific error codes
            if (response.status === 401) {
                window.location.href = '/auth/signin';
                return;
            }
            throw new Error(`Server returned ${response.status}`);
        }
        return response.json();
    }

    function displayFollowings(result) {

        if (!result.success || !result.data || !Array.isArray(result.data.following)) {
            throw new Error('Invalid followings data received');
        }

        const followings = result.data.following;


        if (followings.length === 0) {
            followingsContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-people fs-1 text-muted"></i>
                    <p class="mt-3 text-muted">No followings yet.</p>
                </div>
            `;
            return;
        }

        followingsContainer.innerHTML = ''; // Clear loading state

        followings.forEach((following) => {
            
            const followerCard = document.createElement("div");
            followerCard.classList.add("card", "mb-3");
            followerCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <img src="${following.user.avatar || '/images/default-avatar.png'}" 
                             alt="${following.user.name}" 
                             class="rounded-circle me-3" 
                             width="64" 
                             height="64"
                             onerror="this.src='/images/default-avatar.png'">
                        <div class="flex-grow-1">
                            <h5 class="card-title mb-1">
                                <a href="/${following.user.name}" class="text-decoration-none">
                                    ${following.user.name}
                                </a>
                            </h5>
                            <p class="text-muted mb-1">@${following.user.email.split('@')[0]}</p>
                            ${following.user.bio ? `<p class="card-text mt-2">${following.user.bio}</p>` : ''}
                        </div>
                        <div class="d-flex flex-column">
                            <p class="text-muted">${following.followed_at}</p>
                            <button class="btn btn-sm btn-outline-primary rounded-pill follow-btn" 
                                data-user-id="${following.user.id}"
                                style="min-width: 80px">
                                Unfollow
                            </button>
                        </div>
                    </div>
                </div>
            `;
            followingsContainer.appendChild(followerCard);
        });
    }

    function handleError(error) {
        console.error('Error loading followings:', error);
        followingsContainer.innerHTML = `
            <div class="alert alert-danger">
                Failed to load followings. 
                <button class="btn btn-link p-0" onclick="window.location.reload()">Try again</button>
            </div>
        `;
    }
});