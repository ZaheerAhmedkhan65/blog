// js/deletePost.js
document.addEventListener('DOMContentLoaded', () => {
    // Select the parent container that holds all post elements
    const postsContainer = document.querySelector('.posts-container');  // Make sure this is the correct container

    // Add event listener to the parent container
    postsContainer.addEventListener('click', async (event) => {
        // Check if the clicked element is a delete button
        if (event.target && event.target.classList.contains('delete-post-btn')) {
            const postId = event.target.dataset.postId;
            const confirmDelete = confirm('Are you sure you want to delete this post?');

            if (confirmDelete) {
                try {
                    const response = await fetch(`/posts/${postId}/delete`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const deletedPost = await response.json();
                        // Remove the post element from the DOM
                        const postElement = document.getElementById(`post-${postId}`);
                        if (postElement) postElement.remove();
                        notification(deletedPost.message, 'success');
                    } else {
                        const data = await response.json();
                        notification(data.message || 'Failed to delete post', "danger");
                    }
                } catch (error) {
                    console.error('Error:', error);
                    notification('An error occurred while deleting the post', "danger");
                }
            }
        }
    });
});
