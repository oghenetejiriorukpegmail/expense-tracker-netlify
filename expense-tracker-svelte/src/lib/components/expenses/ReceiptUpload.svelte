<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  
  export let multiple = false;
  export let maxSize = 10 * 1024 * 1024; // 10MB
  export let accept = 'image/jpeg,image/png,image/tiff,application/pdf';
  
  const dispatch = createEventDispatcher();
  
  let dragActive = false;
  let fileInput: HTMLInputElement;
  let files: File[] = [];
  let previews: string[] = [];
  let uploadProgress = 0;
  let error = '';
  let uploading = false;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
  
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragActive = false;
    
    if (!e.dataTransfer) return;
    handleFiles(Array.from(e.dataTransfer.files));
  }
  
  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    handleFiles(Array.from(input.files));
  }
  
  async function handleFiles(newFiles: File[]) {
    error = '';
    const validFiles = newFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        error = `Invalid file type: ${file.type}. Only JPEG, PNG, TIFF, and PDF files are allowed.`;
        return false;
      }
      if (file.size > maxSize) {
        error = `File too large: ${file.name}. Maximum size is ${maxSize / 1024 / 1024}MB.`;
        return false;
      }
      return true;
    });
    
    if (!validFiles.length) return;
    
    if (!multiple) {
      files = [validFiles[0]];
      previews = [];
      await createPreview(validFiles[0]);
    } else {
      files = [...files, ...validFiles];
      await Promise.all(validFiles.map(createPreview));
    }
    
    dispatch('filesSelected', { files });
  }
  
  async function createPreview(file: File) {
    if (!file.type.startsWith('image/')) {
      // For PDFs, show a generic PDF icon or first page preview
      previews = [...previews, '/pdf-icon.png'];
      return;
    }
    
    try {
      const reader = new FileReader();
      const preview = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      previews = [...previews, preview];
    } catch (err) {
      console.error('Error creating preview:', err);
      previews = [...previews, '/error-preview.png'];
    }
  }
  
  async function uploadFiles() {
    if (!files.length || uploading) return;
    
    uploading = true;
    uploadProgress = 0;
    error = '';
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append(multiple ? 'receipts' : 'receipt', file);
      });
      
      const response = await fetch('/api/ocr/' + (multiple ? 'batch' : 'receipt'), {
        method: 'POST',
        body: formData,
        // Assuming you have a way to track upload progress
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      dispatch('uploadComplete', result);
      
      // Clear files after successful upload if not multiple
      if (!multiple) {
        files = [];
        previews = [];
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      error = err instanceof Error ? err.message : 'Upload failed';
      dispatch('uploadError', { error });
    } finally {
      uploading = false;
    }
  }
  
  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
    previews = previews.filter((_, i) => i !== index);
    dispatch('filesSelected', { files });
  }
</script>

<div
  class="receipt-upload"
  class:drag-active={dragActive}
  on:dragenter={handleDragEnter}
  on:dragover|preventDefault
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  <input
    type="file"
    bind:this={fileInput}
    {accept}
    {multiple}
    on:change={handleFileSelect}
    class="hidden"
  />
  
  <div class="upload-area" on:click={() => fileInput.click()}>
    {#if files.length === 0}
      <div class="upload-prompt">
        <i class="fas fa-cloud-upload-alt text-4xl mb-2"></i>
        <p>Drag & drop receipt{multiple ? 's' : ''} here</p>
        <p class="text-sm text-gray-500">or click to select</p>
        <p class="text-xs text-gray-400 mt-2">
          Supported formats: JPEG, PNG, TIFF, PDF (max {maxSize / 1024 / 1024}MB)
        </p>
      </div>
    {:else}
      <div class="preview-grid">
        {#each previews as preview, i}
          <div class="preview-item" transition:fade>
            <img
              src={preview}
              alt="Receipt preview"
              class="preview-image"
            />
            <button
              class="remove-button"
              on:click|stopPropagation={() => removeFile(i)}
              title="Remove file"
            >
              ×
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  {#if error}
    <div class="error-message" transition:fade>
      {error}
    </div>
  {/if}
  
  {#if files.length > 0}
    <div class="actions">
      <button
        class="upload-button"
        disabled={uploading}
        on:click={uploadFiles}
      >
        {#if uploading}
          <div class="progress-bar">
            <div
              class="progress-fill"
              style="width: {uploadProgress}%"
            ></div>
          </div>
          Uploading... {uploadProgress}%
        {:else}
          Upload {files.length} file{files.length > 1 ? 's' : ''}
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .receipt-upload {
    @apply w-full border-2 border-dashed border-gray-300 rounded-lg p-4;
  }
  
  .drag-active {
    @apply border-blue-500 bg-blue-50;
  }
  
  .upload-area {
    @apply min-h-[200px] flex items-center justify-center cursor-pointer;
  }
  
  .upload-prompt {
    @apply text-center text-gray-600;
  }
  
  .preview-grid {
    @apply grid grid-cols-2 md:grid-cols-3 gap-4 w-full;
  }
  
  .preview-item {
    @apply relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden;
  }
  
  .preview-image {
    @apply w-full h-full object-cover;
  }
  
  .remove-button {
    @apply absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white
           flex items-center justify-center text-lg font-bold
           hover:bg-red-600 transition-colors;
  }
  
  .error-message {
    @apply mt-2 text-sm text-red-500;
  }
  
  .actions {
    @apply mt-4 flex justify-end;
  }
  
  .upload-button {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg
           hover:bg-blue-600 transition-colors
           disabled:bg-gray-400 disabled:cursor-not-allowed;
  }
  
  .progress-bar {
    @apply w-full h-1 bg-blue-200 rounded-full overflow-hidden mt-2;
  }
  
  .progress-fill {
    @apply h-full bg-blue-500 transition-all duration-300;
  }
  
  .hidden {
    @apply sr-only;
  }
</style>