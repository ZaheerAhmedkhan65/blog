// public/js/postInteractions.js
(function () {
    let postEditorInstance = null;
    const modal = document.getElementById('postModal');
    const bootstrapModal = modal ? new bootstrap.Modal(modal) : null;
    const form = document.getElementById('post-form');
    const submitBtnText = document.getElementById('submit-btn-text');
    const postIdInput = document.getElementById('post-id');

    // Initialize PostEditor once (mode‑agnostic)
    function initEditor() {
        if (!postEditorInstance && form) {
            postEditorInstance = new PostEditor({
                formId: 'post-form',
                editorId: 'content-editor',
                contentInputId: 'content',
                charCounterId: 'char-counter-circle',
                charCountId: 'char-count',
                submitBtnId: 'submit-post-btn',
                spinnerId: 'postSpinner',
                imageInputId: 'imageInput',
                previewId: 'preview',
                editImageBtnId: 'editImageBtn',
                removeImageBtnId: 'removeImageBtn',
                cropperContainerId: 'cropper-container',
                cropperImageId: 'cropper-image',
                mediaUrlId: 'media_url',
                cancelCropBtnId: 'cancelCropBtn',
                uploadEditedImageBtnId: 'uploadEditedImageBtn',
                schedulePostBtnId: 'schedulePostBtn',
                scheduleContainerId: 'scheduleContainer',
                confirmScheduleBtnId: 'confirmScheduleBtn',
                cancelScheduleBtnId: 'cancelScheduleBtn',
                scheduledAtInputId: 'scheduled_at_input',
                scheduledDisplayId: 'scheduledDisplay',
                scheduledTimeTextId: 'scheduledTimeText',
                isDraftId: 'is_draft',
                onSuccess: handlePostSuccess,
                onError: (msg) => notification(msg, "danger")
            });
        }
    }

    function handlePostSuccess(responseData) {
        const newPost = responseData.post || responseData;
        const message = responseData.message || (postIdInput.value ? 'Post updated' : 'Post created');
        bootstrapModal.hide();

        if (postIdInput.value) {
            // Edit mode: update existing post card
            const oldCard = document.getElementById(`post-${newPost.id}`);
            if (oldCard) {
                const newCard = postTemplate(newPost);
                oldCard.replaceWith(newCard);
            }
        } else {
            // Create mode: try to prepend to the feed if we are on a page that has one
            const postsContainer = document.querySelector('.posts-container');
            if (postsContainer) {
                const newCard = postTemplate(newPost);
                postsContainer.prepend(newCard);
            }
            // If no container (e.g., single post page), just show success – user can navigate to home
        }

        notification(message, "success");
        resetForm();
    }

    function resetForm() {
        form.reset();
        document.getElementById("content-editor").innerText = "";
        document.getElementById("media_url").value = "";
        document.getElementById("preview").src = "";
        document.getElementById("preview").style.display = "none";
        document.getElementById("editImageBtn").style.display = "none";
        document.getElementById("removeImageBtn").style.display = "none";
        document.getElementById("scheduled_at_input").value = "";
        document.getElementById("scheduledTimeText").textContent = "";
        document.getElementById("scheduledDisplay").style.display = "none";
        document.getElementById("scheduleContainer").style.display = "none";
        document.getElementById("schedulePostBtn").style.display = "inline-block";
        postIdInput.value = '';
        if (postEditorInstance) {
            postEditorInstance.setContent("");
            postEditorInstance.updateCharCounter(0);
        }
        submitBtnText.textContent = 'Post';
    }

    function openCreateModal() {
        resetForm();
        bootstrapModal.show();
    }

    function openEditModal(postData) {
        resetForm();
        postIdInput.value = postData.id;
        postEditorInstance.setContent(postData.content);
        postEditorInstance.setImage(postData.media_url);
        postEditorInstance.setSchedule(postData.published_at);
        document.getElementById('is_draft').checked = postData.is_draft;
        submitBtnText.textContent = 'Update';
        bootstrapModal.show();
    }

    // Event delegation for all post interactions (using document)
    document.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const postId = target.dataset.postId;
        const postElement = document.getElementById(`post-${postId}`);

        // Like
        if (target.classList.contains('like-btn')) {
            e.preventDefault();
            await handleReaction(postId, 'like', postElement);
        }
        // Dislike
        else if (target.classList.contains('dislike-btn')) {
            e.preventDefault();
            await handleReaction(postId, 'dislike', postElement);
        }
        // Repost
        else if (target.classList.contains('repost-btn')) {
            e.preventDefault();
            await handleRepost(postId, target);
        }
        // Delete
        else if (target.classList.contains('delete-post-btn')) {
            e.preventDefault();
            await handleDelete(postId, postElement);
        }
        // Edit (opens modal)
        else if (target.classList.contains('edit-post-btn')) {
            e.preventDefault();
            const postData = {
                id: target.dataset.id,
                content: target.dataset.content,
                media_url: target.dataset.media_url,
                published_at: target.dataset.published_at,
                is_draft: target.dataset.is_draft === 'true'
            };
            openEditModal(postData);
        }
    });

    async function handleReaction(postId, type, postElement) {
        try {
            const response = await fetch(`/posts/${postId}/react`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ type: type })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const responseData = await response.json();
            const data = responseData.data;
            postElement.querySelector('.like-count').textContent = data.reactions.likes;
            postElement.querySelector('.dislike-count').textContent = data.reactions.dislikes;

            const likeBtn = postElement.querySelector('.like-btn');
            const dislikeBtn = postElement.querySelector('.dislike-btn');
            if (data.userReaction === 'like') {
                likeBtn.classList.add('text-primary');
                likeBtn.classList.remove('text-dark');
                dislikeBtn.classList.add('text-dark');
                dislikeBtn.classList.remove('text-primary');
            } else if (data.userReaction === 'dislike') {
                dislikeBtn.classList.add('text-primary');
                dislikeBtn.classList.remove('text-dark');
                likeBtn.classList.add('text-dark');
                likeBtn.classList.remove('text-primary');
            } else {
                likeBtn.classList.add('text-dark');
                likeBtn.classList.remove('text-primary');
                dislikeBtn.classList.add('text-dark');
                dislikeBtn.classList.remove('text-primary');
            }
        } catch (error) {
            console.error('Reaction error:', error);
            notification('Failed to react', "danger");
        }
    }

    async function handleRepost(postId, button) {
        const postElement = document.getElementById(`post-${postId}`);
        const repostCountSpan = postElement.querySelector('.repost-count');
        try {
            button.disabled = true;
            const originalHTML = button.innerHTML;
            button.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

            const response = await fetch(`/posts/${postId}/repost`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Repost failed');
            const responseData = await response.json();
            const data = responseData.data;
            repostCountSpan.textContent = data.repostCount;
            if (data.hasReposted) {
                button.classList.add('text-primary');
                button.classList.remove('text-dark');
            } else {
                button.classList.add('text-dark');
                button.classList.remove('text-primary');
            }
        } catch (error) {
            console.error('Repost error:', error);
            notification('Failed to repost', "danger");
        } finally {
            button.disabled = false;
            button.innerHTML = `<i class="bi bi-arrow-repeat"></i> <span class="repost-count">${repostCountSpan.textContent}</span>`;
        }
    }

    async function handleDelete(postId, postElement) {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            const response = await fetch(`/posts/${postId}/delete`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json' 
                }
            });
            if (response.ok) {
                const data = await response.json();
                postElement.remove();
                notification(data.message || 'Post deleted', 'success');
            } else {
                const data = await response.json();
                notification(data.message || 'Failed to delete', "danger");
            }
        } catch (error) {
            console.error('Delete error:', error);
            notification('An error occurred', "danger");
        }
    }

    // Expose functions globally
    window.openCreateModal = openCreateModal;
    window.openEditModal = openEditModal;

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        initEditor();

        // Attach click handler for the "Post" button in sidebar
        const postButton = document.querySelector('[data-bs-target="#postModal"]');
        if (postButton) {
            postButton.addEventListener('click', (e) => {
                e.preventDefault();
                openCreateModal();
            });
        }
    });
})();