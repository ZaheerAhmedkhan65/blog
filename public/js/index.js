// js/index.js
document.addEventListener('DOMContentLoaded', async () => {
    const postsContainer = document.querySelector('.posts-container');
    const timeFilters = document.querySelectorAll('.time-filter');

    // Cache for already loaded posts
    const postsCache = new Map();

    // Setup reaction buttons
    const setupReactionButtons = () => {
        const reactionButtons = document.querySelectorAll('.reaction-btn');
        reactionButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = button.dataset.postId;
                const type = button.dataset.type;

                // Add loading state
                const originalHTML = button.innerHTML;
                button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
                button.disabled = true;

                try {
                    const response = await fetch('/api/posts/react', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            postId,
                            type
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        // Update the count
                        const countSpan = button.querySelector('span');
                        const currentCount = parseInt(countSpan.textContent) || 0;
                        countSpan.textContent = currentCount + 1;
                    }
                } catch (error) {
                    console.error('Error reacting to post:', error);
                } finally {
                    // Restore button state
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }
            });
        });
    };

    // Function to load posts
    const loadTrendingPosts = async (period = '24 HOUR') => {
        try {
            // Show cached content immediately if available
            if (postsCache.has(period)) {
                postsContainer.innerHTML = postsCache.get(period);
                setupReactionButtons();
                return;
            }

            // Show loading state
            postsContainer.innerHTML = `
                <div class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;

            // Fetch data with cache-busting
            const response = await fetch(`/posts/trending?period=${encodeURIComponent(period)}&_=${Date.now()}`);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();

            if (!result.success || !result.data || !Array.isArray(result.data.posts)) {
                throw new Error('Invalid posts data received');
            }

            const posts = result.data.posts;

            postsContainer.innerHTML = '';

            // Check if there are posts
            if (posts.length === 0) {
                postsContainer.innerHTML = `
                    <div class="alert alert-info">
                        No trending posts found for this period.
                    </div>
                `;
                postsCache.set(period, postsContainer.innerHTML);
                return;
            }

            // Render posts
            posts.forEach((post) => {
                postsContainer.appendChild(postTemplate(post));
            });

            // Cache the rendered HTML
            postsCache.set(period, postsContainer.innerHTML);

            // Initialize event listeners
            setupReactionButtons();

        } catch (error) {
            console.error('Error loading trending posts:', error);
            postsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load trending posts. ${error.message}
                </div>
            `;
        }
    };

    // Time filter event listeners with debounce
    let debounceTimer;
    timeFilters.forEach(filter => {
        filter.addEventListener('click', function () {
            clearTimeout(debounceTimer);
            timeFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');

            // Debounce to prevent rapid clicks
            debounceTimer = setTimeout(() => {
                loadTrendingPosts(this.dataset.period);
            }, 200);
        });
    });

    // Initial load - use the active filter's period
    const activeFilter = document.querySelector('.time-filter.active');
    const initialPeriod = activeFilter ? activeFilter.dataset.period : '24 HOUR';
    loadTrendingPosts(initialPeriod);
});