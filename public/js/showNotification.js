function notification(message,type){
    const alertBox = document.createElement("div");
    alertBox.classList.add("alert", "position-absolute", "top-0", "end-0", "m-3", "alert-" + type);
    alertBox.innerHTML = `<div class="p-2">${message}</div>`;

    document.body.appendChild(alertBox);
    setTimeout(()=>{
        alertBox.remove();
    },3000)
}

function formatPostContent(content) {
  if (!content) return '';

  // Convert fenced code blocks (e.g., ```js\ncode\n```)
  content = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Convert inline code (`code`)
  content = content.replace(/`([^`\n]+)`/g, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Convert URLs into clickable links
  content = content.replace(/(https?:\/\/[^\s]+)/g, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

  // Convert line breaks to <br> for HTML rendering
  content = content.replace(/\n/g, '<br>');

  return content;
}
// Helper to escape HTML characters
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}