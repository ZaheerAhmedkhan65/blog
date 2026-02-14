// public/js/postEditor.js
class PostEditor {
    constructor(config) {
        // Configuration options
        this.config = {
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
            ...config
        };

        // State
        this.cropper = null;
        this.croppedImageBlob = null;
        this.selectedImageFile = null;
        this.MAX_CHARS = 200;
        this.WARNING_THRESHOLD = 180;

        // Initialize
        this.initEditor();
        this.initImageHandling();
        this.initScheduleHandling();
        this.initFormSubmission();
    }

    initEditor() {
        const editor = document.getElementById(this.config.editorId);
        const hiddenInput = document.getElementById(this.config.contentInputId);
        const charCounter = document.getElementById(this.config.charCounterId);
        const charCountDisplay = document.getElementById(this.config.charCountId);
        const submitBtn = document.getElementById(this.config.submitBtnId);

        charCountDisplay.textContent = this.MAX_CHARS;

        this.editorInputListener = () => {
            const text = editor.innerText;
            const charCount = text.length;
            const remainingChars = this.MAX_CHARS - charCount;

            charCountDisplay.textContent = remainingChars;
            const percentage = Math.min(100, (charCount / this.MAX_CHARS) * 100);
            charCounter.style.strokeDashoffset = 100 - percentage;

            if (remainingChars < 0) {
                charCounter.style.stroke = '#f4212e';
                charCountDisplay.style.color = '#f4212e';
            } else if (charCount >= this.WARNING_THRESHOLD) {
                charCounter.style.stroke = '#ffd400';
                charCountDisplay.style.color = '#ffd400';
            } else {
                charCounter.style.stroke = '#1d9bf0';
                charCountDisplay.style.color = '#1d9bf0';
            }

            if (text.trim().length > 0 && remainingChars >= 0) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = 1;
            } else {
                submitBtn.disabled = true;
                submitBtn.style.opacity = 0.5;
            }

            this.styleContentInEditor(editor, charCount);
            hiddenInput.value = editor.innerHTML;
        };
        editor.addEventListener('input', this.editorInputListener);
    }

    styleContentInEditor(editorElement, charCount) {
        const remainingChars = this.MAX_CHARS - charCount;
        const text = editorElement.innerHTML;

        editorElement.removeEventListener('input', this.editorInputListener);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        const excessSpans = tempDiv.querySelectorAll('span.excess-text');
        excessSpans.forEach(span => {
            const textNode = document.createTextNode(span.textContent);
            span.parentNode.replaceChild(textNode, span);
        });

        if (remainingChars < 0) {
            const textNodes = [];
            const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }

            let charsProcessed = 0;
            let excessStarted = false;

            textNodes.forEach(textNode => {
                const textContent = textNode.nodeValue;
                const parent = textNode.parentNode;

                if (excessStarted) {
                    const span = document.createElement('span');
                    span.className = 'excess-text';
                    span.style.color = '#f4212e';
                    span.appendChild(document.createTextNode(textContent));
                    parent.replaceChild(span, textNode);
                } else {
                    const allowedLength = this.MAX_CHARS - charsProcessed;
                    if (allowedLength < textContent.length) {
                        const allowedText = textContent.substring(0, allowedLength);
                        const excessText = textContent.substring(allowedLength);

                        parent.insertBefore(document.createTextNode(allowedText), textNode);
                        const span = document.createElement('span');
                        span.className = 'excess-text';
                        span.style.background = '#f4212e';
                        span.style.color = '#fff';
                        span.style.opacity = '0.8';
                        span.appendChild(document.createTextNode(excessText));
                        parent.insertBefore(span, textNode);
                        parent.removeChild(textNode);

                        charsProcessed += allowedLength;
                        excessStarted = true;
                    } else {
                        charsProcessed += textContent.length;
                    }
                }
            });
        }

        const urlRegex = /(https?:\/\/[^\s]+)(?![^<]*<\/span>)/g;
        const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
        let node;
        const textNodes = [];

        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            if (parent.nodeName === 'SPAN' && (parent.style.color === 'rgb(29, 155, 240)' || parent.classList.contains('excess-text'))) {
                return;
            }

            const textContent = textNode.nodeValue;
            const nodes = [];
            let lastIndex = 0;

            textContent.replace(urlRegex, (match, offset) => {
                if (offset > lastIndex) {
                    nodes.push(document.createTextNode(textContent.substring(lastIndex, offset)));
                }
                const span = document.createElement('span');
                span.style.color = '#1d9bf0';
                span.appendChild(document.createTextNode(match));
                nodes.push(span);
                lastIndex = offset + match.length;
            });

            if (lastIndex < textContent.length) {
                nodes.push(document.createTextNode(textContent.substring(lastIndex)));
            }

            if (nodes.length > 0) {
                nodes.forEach(newNode => {
                    parent.insertBefore(newNode, textNode);
                });
                parent.removeChild(textNode);
            }
        });

        editorElement.innerHTML = tempDiv.innerHTML;

        const range = document.createRange();
        range.selectNodeContents(editorElement);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        editorElement.addEventListener('input', this.editorInputListener);
    }

    initImageHandling() {
        const imageInput = document.getElementById(this.config.imageInputId);
        const preview = document.getElementById(this.config.previewId);
        const editImageBtn = document.getElementById(this.config.editImageBtnId);
        const removeImageBtn = document.getElementById(this.config.removeImageBtnId);
        const cropperContainer = document.getElementById(this.config.cropperContainerId);
        const cropperImage = document.getElementById(this.config.cropperImageId);
        const mediaUrlInput = document.getElementById(this.config.mediaUrlId);
        const cancelCropBtn = document.getElementById(this.config.cancelCropBtnId);
        const uploadEditedImageBtn = document.getElementById(this.config.uploadEditedImageBtnId);

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = () => {
                preview.src = reader.result;
                preview.style.display = 'block';
                editImageBtn.style.display = 'block';
                removeImageBtn.style.display = 'block';
                cropperContainer.style.display = 'none';
                cropperImage.src = reader.result;
            };
            reader.readAsDataURL(file);
        });

        editImageBtn.addEventListener('click', () => {
            cropperContainer.style.display = 'block';
            preview.style.display = 'none';
            editImageBtn.style.display = 'none';
            removeImageBtn.style.display = 'none';
            cropperImage.src = preview.src;
            if (this.cropper) this.cropper.destroy();
            this.cropper = new Cropper(cropperImage, {
                aspectRatio: 1,
                viewMode: 1,
                zoomable: true,
                scalable: true
            });
        });

        cancelCropBtn.addEventListener('click', () => {
            cropperContainer.style.display = 'none';
            preview.style.display = 'block';
            editImageBtn.style.display = 'block';
            removeImageBtn.style.display = 'block';
            if (this.cropper) {
                this.cropper.destroy();
                this.cropper = null;
            }
        });

        uploadEditedImageBtn.addEventListener('click', async () => {
            if (!this.cropper) return;

            const canvas = this.cropper.getCroppedCanvas({ width: 500, height: 500 });
            this.croppedImageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

            preview.src = canvas.toDataURL();
            preview.style.display = 'block';
            cropperContainer.style.display = 'none';
            editImageBtn.style.display = 'block';
            removeImageBtn.style.display = 'block';

            if (this.cropper) {
                this.cropper.destroy();
                this.cropper = null;
            }
        });

        removeImageBtn.addEventListener('click', () => {
            preview.src = '';
            preview.style.display = 'none';
            editImageBtn.style.display = 'none';
            removeImageBtn.style.display = 'none';
            imageInput.value = '';
            mediaUrlInput.value = '';
            if (this.cropper) {
                this.cropper.destroy();
                this.cropper = null;
            }
        });
    }

    initScheduleHandling() {
        const schedulePostBtn = document.getElementById(this.config.schedulePostBtnId);
        const scheduleContainer = document.getElementById(this.config.scheduleContainerId);
        const confirmScheduleBtn = document.getElementById(this.config.confirmScheduleBtnId);
        const cancelScheduleBtn = document.getElementById(this.config.cancelScheduleBtnId);
        const scheduledAtInput = document.getElementById(this.config.scheduledAtInputId);
        const scheduledDisplay = document.getElementById(this.config.scheduledDisplayId);
        const scheduledTimeText = document.getElementById(this.config.scheduledTimeTextId);

        schedulePostBtn.addEventListener('click', () => {
            scheduleContainer.style.display = 'block';
            schedulePostBtn.style.display = 'none';
            confirmScheduleBtn.disabled = true;
            scheduledAtInput.value = '';
        });

        scheduledAtInput.addEventListener('input', () => {
            confirmScheduleBtn.disabled = !scheduledAtInput.value;
        });

        confirmScheduleBtn.addEventListener('click', () => {
            const timeValue = scheduledAtInput.value;
            if (!timeValue) return;

            const formatted = new Date(timeValue).toLocaleString();
            scheduledTimeText.textContent = formatted;
            scheduledDisplay.style.display = 'block';
            scheduleContainer.style.display = 'none';
            schedulePostBtn.style.display = 'inline-block';
        });

        cancelScheduleBtn.addEventListener('click', () => {
            scheduledAtInput.value = '';
            scheduleContainer.style.display = 'none';
            schedulePostBtn.style.display = 'inline-block';
        });
    }

    initFormSubmission() {
        const form = document.getElementById(this.config.formId);
        const spinner = document.getElementById(this.config.spinnerId);
        const submitBtn = document.getElementById(this.config.submitBtnId);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            spinner.classList.remove('d-none');

            const formData = new FormData(form);
            const data = {};

            for (let [key, value] of formData.entries()) {
                if (key === 'is_draft') {
                    data[key] = value === 'on';
                } else if (key === 'parent_post_id' && value) {
                    data[key] = parseInt(value, 10);
                } else if (key === 'scheduled_at' && value) {
                    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
                        data[key] = value + ':00';
                    } else {
                        data[key] = value;
                    }
                } else if (value !== '') {
                    data[key] = value;
                }
            }

            // Upload image first if selected
            if (this.croppedImageBlob || this.selectedImageFile) {
                const uploadForm = new FormData();
                if (this.croppedImageBlob) {
                    uploadForm.append('image', this.croppedImageBlob, 'cropped.jpg');
                } else {
                    uploadForm.append('image', this.selectedImageFile);
                }

                try {
                    const uploadRes = await fetch("/media/upload", {
                        method: "POST",
                        body: uploadForm,
                    });

                    const uploadData = await uploadRes.json();
                    if (uploadData.url) {
                        data.media_url = uploadData.url;
                    } else {
                        alert("Image upload failed");
                        return;
                    }
                } catch (uploadErr) {
                    console.error("Image upload error:", uploadErr);
                    return;
                }
            }

            try {
                // Determine endpoint and method based on presence of post ID
                const postId = data.id || document.getElementById('post-id')?.value;
                const endpoint = postId ? `/posts/${postId}/update` : "/posts/create";
                const method = postId ? 'PUT' : 'POST';

                const response = await fetch(endpoint, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    const responseData = await response.json();
                    const post = responseData.data || responseData;
                    console.log("Post saved:", post);
                    if (typeof this.config.onSuccess === 'function') {
                        this.config.onSuccess(post);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("Server error:", response.status, errorData);
                    if (typeof this.config.onError === 'function') {
                        this.config.onError(errorData.error || 'Failed to process post');
                    }
                }
            } catch (error) {
                console.error("Error:", error);
                if (typeof this.config.onError === 'function') {
                    this.config.onError('An error occurred');
                }
            } finally {
                spinner.classList.add('d-none');
                submitBtn.disabled = false;
            }
        });
    }

    setContent(content) {
        const editor = document.getElementById(this.config.editorId);
        const hiddenInput = document.getElementById(this.config.contentInputId);
        editor.innerHTML = content;
        hiddenInput.value = content;
        this.updateCharCounter(content.length);
    }

    setImage(url) {
        const preview = document.getElementById(this.config.previewId);
        const editImageBtn = document.getElementById(this.config.editImageBtnId);
        const removeImageBtn = document.getElementById(this.config.removeImageBtnId);
        const mediaUrlInput = document.getElementById(this.config.mediaUrlId);
        const cropperImage = document.getElementById(this.config.cropperImageId);

        if (url) {
            preview.src = url;
            cropperImage.src = url;
            preview.style.display = 'block';
            editImageBtn.style.display = 'block';
            removeImageBtn.style.display = 'block';
            mediaUrlInput.value = url;
        }
    }

    setSchedule(dateString) {
        if (!dateString) return;

        const scheduledAtInput = document.getElementById(this.config.scheduledAtInputId);
        const scheduledTimeText = document.getElementById(this.config.scheduledTimeTextId);
        const scheduledDisplay = document.getElementById(this.config.scheduledDisplayId);

        const date = new Date(dateString);
        const formattedDate = date.toISOString().slice(0, 16);
        scheduledAtInput.value = formattedDate;
        scheduledTimeText.textContent = date.toLocaleString();
        scheduledDisplay.style.display = 'block';
    }

    updateCharCounter(charCount) {
        const remainingChars = this.MAX_CHARS - charCount;
        const charCountDisplay = document.getElementById(this.config.charCountId);
        const charCounter = document.getElementById(this.config.charCounterId);
        const submitBtn = document.getElementById(this.config.submitBtnId);

        charCountDisplay.textContent = remainingChars;
        const percentage = Math.min(100, (charCount / this.MAX_CHARS) * 100);
        charCounter.style.strokeDashoffset = 100 - percentage;

        if (remainingChars < 0) {
            charCounter.style.stroke = '#f4212e';
            charCountDisplay.style.color = '#f4212e';
        } else if (charCount >= this.WARNING_THRESHOLD) {
            charCounter.style.stroke = '#ffd400';
            charCountDisplay.style.color = '#ffd400';
        } else {
            charCounter.style.stroke = '#1d9bf0';
            charCountDisplay.style.color = '#1d9bf0';
        }

        if (charCount > 0 && remainingChars >= 0) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = 1;
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = 0.5;
        }
    }
}