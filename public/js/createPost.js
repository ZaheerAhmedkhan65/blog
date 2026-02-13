document.addEventListener("DOMContentLoaded", () => {
  const postsContainer = document.querySelector(".posts-container");
  
  // Initialize the PostEditor for creating posts
  const createPostEditor = new PostEditor({
    mode: 'create',
    formId: 'create-post-form',
    onSuccess: (responseData) => {
      // Determine the post object (direct or wrapped)
      const newPost = responseData.post || responseData;
      // Use the message if present, otherwise a default
      const message = responseData.message || 'Post created successfully';

      const bootstrapModal = bootstrap.Modal.getInstance(document.getElementById('newPostModal'));
      bootstrapModal.hide();

      const newPostElement = postTemplate(newPost);
      postsContainer.prepend(newPostElement);

      notification(message, "success");
      resetPostForm();
      setupReactionButtons();
    },
    onError: (error) => {
      console.error("Post creation failed:", error);
      notification("Failed to create post", "error");
    }
  });

  // Helper function to reset the post form
  function resetPostForm() {
    const form = document.getElementById("create-post-form");
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
    
    // Reset editor state
    createPostEditor.setContent("");
    createPostEditor.updateCharCounter(0);
  }
});