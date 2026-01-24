document.addEventListener("DOMContentLoaded", () => {
    const notificationsContainer = document.querySelector("#notifications-container");
    const userId = window.currentUserId; // Assuming you set this globally

    if (!notificationsContainer) return;

    // Show loading state
    notificationsContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading notifications...</p>
        </div>
    `;

    // Build query parameters
    const params = new URLSearchParams({
        limit: 50,
        offset: 0
    });

    fetch(`/notifications?${params}`, {
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        credentials: "include",
    })
        .then(handleResponse)
        .then(displayNotifications)
        .catch(handleError);

    function handleResponse(response) {
        if (!response.ok) {
            // Handle specific error codes
            if (response.status === 401) {
                window.location.href = '/auth/signin';
                throw new Error('Please sign in to view notifications');
            }
            if (response.status === 403) {
                throw new Error('Not authorized to view these notifications');
            }
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    }

    function displayNotifications(response) {
        // Check response structure
        if (!response || response.success === false) {
            throw new Error(response?.error || 'Invalid response from server');
        }

        const data = response.data;
        const notifications = data.notifications || [];
        const pagination = data.pagination || {};

        if (!notifications || !Array.isArray(notifications)) {
            throw new Error('Invalid notifications data received');
        }

        if (notifications.length === 0) {
            notificationsContainer.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-bell"></i> No notifications yet.
                </div>
            `;
            return;
        }

        notificationsContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Notifications</h5>
                ${pagination.unreadCount > 0 ? `
                    <button class="btn btn-sm btn-outline-primary mark-all-read">
                        <i class="bi bi-check-all"></i> Mark all as read
                    </button>
                ` : ''}
            </div>
            <ul class="list-group">
                ${notifications.map(notification => `
                    <li class="list-group-item ${notification.is_read ? '' : 'bg-light'}" data-notification-id="${notification.id}">
                        <div class="d-flex justify-content-between flex-grow-1">
                            <div class="d-flex align-items-center gap-2">
                                <a href="/${notification.actor?.name || 'user'}" class="text-decoration-none text-dark">
                                    <img src="${notification.actor?.avatar || '/images/default-avatar.png'}" 
                                         alt="${notification.actor?.name || 'User'}" 
                                         class="rounded-circle me-2" 
                                         width="40" 
                                         height="40"
                                         onerror="this.src='/images/default-avatar.png'">
                                </a>
                                <div class="d-flex flex-column">
                                    <a href="/${notification.actor?.name || 'user'}" class="text-decoration-none text-dark">
                                        <b class="card-title m-0">${notification.actor?.name || 'User'}</b>
                                    </a>
                                    ${notification.message ? `
                                        <a href="${notification.post_id ? `/${notification.actor?.name || 'user'}/status/${notification.post_id}` : `/${notification.actor?.name || 'user'}`}" 
                                           class="text-decoration-none text-dark">
                                            <p class="card-text m-0">${notification.message}</p>
                                        </a>
                                    ` : `
                                        <p class="card-text m-0">
                                            ${notification.type === 'follow' ? 'started following you' :
                notification.type === 'like' ? 'liked your post' :
                    notification.type === 'repost' ? 'reposted your post' :
                        notification.type === 'new_post' ? 'created a new post' :
                            'sent you a notification'}
                                        </p>
                                    `}
                                </div>
                            </div>
                            <div class="d-flex flex-column align-items-end">
                                <small class="text-muted">${notification.created_at || 'Just now'}</small>
                                ${!notification.is_read ? `
                                    <button class="btn btn-sm btn-link mark-read-btn" data-id="${notification.id}">
                                        <i class="bi bi-check"></i> Mark read
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </li>
                `).join('')}
            </ul>
            ${pagination.hasMore ? `
                <div class="text-center mt-3">
                    <button class="btn btn-outline-secondary load-more-btn" 
                            data-offset="${pagination.offset + pagination.limit}">
                        Load more notifications
                    </button>
                </div>
            ` : ''}
        `;

        // Add event listeners
        setupNotificationListeners();
    }

    function setupNotificationListeners() {
        // Mark single notification as read
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const notificationId = this.dataset.id;
                markAsRead(notificationId, this.closest('.list-group-item'));
            });
        });

        // Mark all as read
        const markAllBtn = document.querySelector('.mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => markAllAsRead());
        }

        // Load more notifications
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function () {
                loadMoreNotifications(parseInt(this.dataset.offset));
            });
        }
    }

    function markAsRead(notificationId, notificationElement) {
        fetch(`/notifications/${notificationId}/mark_as_read`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then(handleResponse)
            .then(response => {
                if (response.success) {
                    notificationElement.classList.remove('bg-light');
                    const btn = notificationElement.querySelector('.mark-read-btn');
                    if (btn) btn.remove();
                    showToast('Notification marked as read', 'success');
                }
            })
            .catch(error => {
                console.error('Error marking notification as read:', error);
                showToast('Failed to mark as read', 'danger');
            });
    }

    function markAllAsRead() {
        fetch('/notifications/mark_all_read', {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then(handleResponse)
            .then(response => {
                if (response.success) {
                    // Remove all bg-light classes and mark read buttons
                    document.querySelectorAll('.list-group-item').forEach(item => {
                        item.classList.remove('bg-light');
                        const btn = item.querySelector('.mark-read-btn');
                        if (btn) btn.remove();
                    });
                    document.querySelector('.mark-all-read')?.remove();
                    showToast('All notifications marked as read', 'success');
                }
            })
            .catch(error => {
                console.error('Error marking all as read:', error);
                showToast('Failed to mark all as read', 'danger');
            });
    }

    function loadMoreNotifications(offset) {
        const params = new URLSearchParams({
            limit: 50,
            offset: offset
        });

        fetch(`/notifications?${params}`, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then(handleResponse)
            .then(response => {
                const newNotifications = response.data.notifications || [];
                const pagination = response.data.pagination || {};

                if (newNotifications.length === 0) {
                    showToast('No more notifications to load', 'info');
                    document.querySelector('.load-more-btn')?.remove();
                    return;
                }

                // Append new notifications
                const notificationsList = notificationsContainer.querySelector('.list-group');
                newNotifications.forEach(notification => {
                    const li = document.createElement('li');
                    li.className = `list-group-item ${notification.is_read ? '' : 'bg-light'}`;
                    li.dataset.notificationId = notification.id;
                    li.innerHTML = `
                    <div class="d-flex justify-content-between flex-grow-1">
                        <div class="d-flex align-items-center gap-2">
                            <a href="/${notification.actor?.name || 'user'}" class="text-decoration-none text-dark">
                                <img src="${notification.actor?.avatar || '/images/default-avatar.png'}" 
                                     alt="${notification.actor?.name || 'User'}" 
                                     class="rounded-circle me-2" 
                                     width="40" 
                                     height="40">
                            </a>
                            <div class="d-flex flex-column">
                                <a href="/${notification.actor?.name || 'user'}" class="text-decoration-none text-dark">
                                    <b class="card-title m-0">${notification.actor?.name || 'User'}</b>
                                </a>
                                <p class="card-text m-0">
                                    ${notification.message ||
                        (notification.type === 'follow' ? 'started following you' :
                            notification.type === 'like' ? 'liked your post' :
                                notification.type === 'repost' ? 'reposted your post' : 'sent you a notification')}
                                </p>
                            </div>
                        </div>
                        <div class="d-flex flex-column align-items-end">
                            <small class="text-muted">${notification.created_at || 'Just now'}</small>
                            ${!notification.is_read ? `
                                <button class="btn btn-sm btn-link mark-read-btn" data-id="${notification.id}">
                                    <i class="bi bi-check"></i> Mark read
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                    notificationsList.appendChild(li);
                });

                // Update load more button
                const loadMoreBtn = notificationsContainer.querySelector('.load-more-btn');
                if (loadMoreBtn) {
                    if (pagination.hasMore) {
                        loadMoreBtn.dataset.offset = pagination.offset + pagination.limit;
                    } else {
                        loadMoreBtn.remove();
                    }
                }

                // Re-setup listeners for new elements
                setupNotificationListeners();
            })
            .catch(handleError);
    }

    function handleError(error) {
        console.error('Error getting notifications:', error);
        notificationsContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle"></i>
                ${error.message || 'Failed to load notifications. Please try again.'}
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">
                    Retry
                </button>
            </div>
        `;
    }

    function showToast(message, type = 'success') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `toast show position-fixed top-0 end-0 m-3 align-items-center text-white bg-${type}`;
        toast.style.zIndex = '1060';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
});