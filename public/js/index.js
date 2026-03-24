// js/index.js
document.addEventListener('DOMContentLoaded', async () => {
    const postsContainer = document.querySelector('.posts-container');
    const feedFilters = document.querySelectorAll('.feed-filter');

    const FEED_LIMIT = 10;
    let feedOffset = 0;
    let feedHasMore = true;
    let isLoading = false;
    let currentFeedType = 'for-you'; // values: for-you, following

    // Cache for already loaded posts by feed type
    const feedCache = new Map();

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

    const renderPosts = (posts, replace = false) => {
        if (replace) {
            postsContainer.innerHTML = '';
        }

        if (posts.length === 0 && feedOffset === 0) {
            postsContainer.innerHTML = `
                <div class="alert alert-info animate__animated animate__fadeIn">
                    No posts in your feed yet. Follow users to see more content.
                </div>
            `;
            return;
        }

        posts.forEach((post, index) => {
            const postElement = postTemplate(post);
            // Add staggered animation delay for each post
            const delay = index * 0.1; // 0.1s delay between each post
            postElement.style.animationDelay = `${delay}s`;
            postsContainer.appendChild(postElement);
        });

        setupReactionButtons();
    };

    const loadFeedPosts = async (feedType = 'for-you') => {
        if (isLoading || !feedHasMore || currentFeedType !== feedType) return;

        isLoading = true;

        if (feedOffset === 0) {
            postsContainer.innerHTML = `
                <div class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        } else {
            const loadMoreSpinner = document.createElement('div');
            loadMoreSpinner.className = 'text-center my-3';
            loadMoreSpinner.id = 'feed-load-more-spinner';
            loadMoreSpinner.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
            postsContainer.appendChild(loadMoreSpinner);
        }

        try {
            const excludeSelf = feedType === 'following' ? 'true' : 'false';
            const response = await fetch(`/posts/feed?limit=${FEED_LIMIT}&offset=${feedOffset}&excludeSelf=${excludeSelf}`);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();
            if (!result.success || !result.data || !Array.isArray(result.data.posts)) {
                throw new Error('Invalid feed response');
            }

            const posts = result.data.posts;

            if (document.getElementById('feed-load-more-spinner')) {
                document.getElementById('feed-load-more-spinner').remove();
            }

            renderPosts(posts, feedOffset === 0);

            feedOffset += posts.length;
            feedHasMore = Boolean(result.data.pagination && result.data.pagination.hasMore);
            if (!feedHasMore && posts.length === 0 && feedOffset === 0) {
                // If feed is empty and fallback may have loaded trending
                postsContainer.innerHTML = `
                    <div class="alert alert-info">
                        No posts found in your feed yet.
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error loading feed posts:', error);
            postsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load feed posts. ${error.message}
                </div>
            `;
        } finally {
            isLoading = false;
        }
    };

    // Feed filter event listeners
    feedFilters.forEach(filter => {
        filter.addEventListener('click', function () {
            const feedType = this.dataset.feedType;
            if (currentFeedType === feedType) return;

            // Update active state
            feedFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');

            // Reset feed state
            currentFeedType = feedType;
            feedOffset = 0;
            feedHasMore = true;
            isLoading = false;

            // Load new feed
            loadFeedPosts(feedType);
        });
    });

    // Infinite scroll for feed
    window.addEventListener('scroll', () => {
        if (isLoading || !feedHasMore) return;

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
            loadFeedPosts(currentFeedType);
        }
    });

    // Initial load of feed
    loadFeedPosts('for-you');
});