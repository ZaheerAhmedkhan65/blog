document.addEventListener('DOMContentLoaded', () => {
    const editPostModal = document.getElementById('editPostModal');
    let editPostEditor;

    editPostModal.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const postId = button.getAttribute('data-id');
        // Set the post ID in the hidden input
        document.getElementById('edit-post-id').value = postId;
        const postContent = button.getAttribute('data-content');
        const postPublishedAt = button.getAttribute('data-published_at');
        const postMediaUrl = button.getAttribute('data-media_url');
        const postIsDraft = button.getAttribute('data-is_draft') === 'true';

        // Initialize or reinitialize editor
        editPostEditor = new PostEditor({
            mode: 'edit',
            formId: 'edit-post-form',
            editorId: 'edit-content-editor',
            contentInputId: 'edit-content',
            charCounterId: 'edit-char-counter-circle',
            charCountId: 'edit-char-count',
            submitBtnId: 'edit-post-btn',
            spinnerId: 'edit-post-spinner',
            imageInputId: 'edit-image-input',
            previewId: 'edit-preview',
            editImageBtnId: 'edit-image-btn',
            removeImageBtnId: 'edit-remove-image-btn',
            cropperContainerId: 'edit-cropper-container',
            cropperImageId: 'edit-cropper-image',
            mediaUrlId: 'edit-media-url',
            cancelCropBtnId: 'edit-cancel-crop-btn',
            uploadEditedImageBtnId: 'edit-upload-edited-image-btn',
            schedulePostBtnId: 'edit-schedule-post-btn',
            scheduleContainerId: 'edit-schedule-container',
            confirmScheduleBtnId: 'edit-confirm-schedule-btn',
            cancelScheduleBtnId: 'edit-cancel-schedule-btn',
            scheduledAtInputId: 'edit-scheduled-at-input',
            scheduledDisplayId: 'edit-scheduled-display',
            scheduledTimeTextId: 'edit-scheduled-time-text',
            isDraftId: 'edit-is-draft',
            onSuccess: (responseData) => {
                const updatedPost = responseData.post;
                const postElement = document.getElementById(`post-${updatedPost.id}`);
                
                if (postElement) {
                    postElement.querySelector('.post-content').innerHTML = formatPostContent(updatedPost.content);
                    postElement.querySelector('.post-status').innerHTML = updatedPost.published_at ? 
                        '' : updatedPost.scheduled_at ? `<span class="badge bg-info">Scheduled</span>` : 
                        updatedPost.is_draft ? `<span class="badge bg-secondary">Draft</span>` : '';
                    
                    // Update image if changed
                    const imgElement = postElement.querySelector('.post-image');
                    if (updatedPost.media_url) {
                        if (imgElement) {
                            imgElement.src = updatedPost.media_url;
                        } else {
                            const contentElement = postElement.querySelector('.post-content');
                            contentElement.insertAdjacentHTML('afterend', 
                                `<img src="${updatedPost.media_url}" alt="Post Image" class="img-fluid rounded-3 post-image">`);
                        }
                    } else if (imgElement) {
                        imgElement.remove();
                    }

                    // Update edit button attributes
                    const editButton = postElement.querySelector(`#edit-post-btn-${updatedPost.id}`);
                    if (editButton) {
                        editButton.setAttribute('data-content', updatedPost.content);
                        editButton.setAttribute('data-published_at', updatedPost.published_at || '');
                        editButton.setAttribute('data-media_url', updatedPost.media_url || '');
                        editButton.setAttribute('data-is_draft', updatedPost.is_draft);
                    }
                }

                const bootstrapModal = bootstrap.Modal.getInstance(editPostModal);
                bootstrapModal.hide();
                notification(responseData.message || 'Post updated successfully', "success");
            },
            onError: (message) => {
                notification(message, 'error');
            }
        });

        // Set initial values
        document.getElementById('edit-post-id').value = postId;
        editPostEditor.setContent(postContent);
        editPostEditor.setImage(postMediaUrl);
        editPostEditor.setSchedule(postPublishedAt);
        document.getElementById('edit-is-draft').checked = postIsDraft;
    });
});