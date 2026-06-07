import Swal from 'sweetalert2';

// Custom mixin representing the dark glassmorphic design system
const GlassSwal = Swal.mixin({
  customClass: {
    popup: 'glass-swal-popup',
    title: 'glass-swal-title',
    htmlContainer: 'glass-swal-html',
    confirmButton: 'glass-swal-confirm-btn',
    cancelButton: 'glass-swal-cancel-btn',
    actions: 'glass-swal-actions',
  },
  buttonsStyling: false,
  background: 'transparent',
  showClass: {
    popup: 'animate-fade-in',
  },
  hideClass: {
    popup: 'animate-fade-out',
  }
});

// Toast mixin — small, non-blocking, top-right corner notification
const GlassSwalToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'glass-swal-toast',
    title: 'glass-swal-toast-title',
    timerProgressBar: 'glass-swal-toast-progress',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate-toast-in',
  },
  hideClass: {
    popup: 'animate-toast-out',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

// A red confirm button variant for destructive operations
const GlassSwalDanger = Swal.mixin({
  customClass: {
    popup: 'glass-swal-popup',
    title: 'glass-swal-title',
    htmlContainer: 'glass-swal-html',
    confirmButton: 'glass-swal-confirm-danger-btn',
    cancelButton: 'glass-swal-cancel-btn',
    actions: 'glass-swal-actions',
  },
  buttonsStyling: false,
  background: 'transparent',
  showClass: {
    popup: 'animate-fade-in',
  }
});

/**
 * Trigger a modern delete confirmation modal
 */
export const confirmDelete = async (title = 'Delete Item?', text = 'This action cannot be undone.') => {
  const result = await GlassSwalDanger.fire({
    title: `🗑 ${title}`,
    html: text,
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    focusCancel: true
  });
  return result.isConfirmed;
};

/**
 * Trigger a result publication confirmation modal
 */
export const confirmPublish = async () => {
  const result = await GlassSwal.fire({
    title: '📢 Publish Result?',
    html: 'This result will become visible to the public.',
    showCancelButton: true,
    confirmButtonText: 'Publish',
    cancelButtonText: 'Cancel',
    focusCancel: true
  });
  return result.isConfirmed;
};

/**
 * Trigger a bulk import confirmation modal
 */
export const confirmBulkImport = async (count) => {
  const result = await GlassSwal.fire({
    title: '📥 Import Participants?',
    html: `${count} participants will be added.`,
    showCancelButton: true,
    confirmButtonText: 'Import',
    cancelButtonText: 'Cancel',
    focusCancel: true
  });
  return result.isConfirmed;
};

/**
 * Trigger a backup generation confirmation modal
 */
export const confirmBackup = async () => {
  const result = await GlassSwal.fire({
    title: '💾 Create Database Backup?',
    html: 'A backup file will be generated and downloaded.',
    showCancelButton: true,
    confirmButtonText: 'Create Backup',
    cancelButtonText: 'Cancel',
    focusCancel: true
  });
  return result.isConfirmed;
};

/**
 * Trigger a database restore confirmation modal
 */
export const confirmRestore = async () => {
  const result = await GlassSwalDanger.fire({
    title: '⚠️ Restore Database?',
    html: 'Current data may be overwritten.',
    showCancelButton: true,
    confirmButtonText: 'Restore',
    cancelButtonText: 'Cancel',
    focusCancel: true
  });
  return result.isConfirmed;
};

/**
 * Trigger a warning confirmation when leaving a page with unsaved changes
 */
export const confirmLeavePage = async () => {
  const result = await GlassSwal.fire({
    title: '⚠️ Unsaved Changes',
    html: 'You have unsaved changes. Do you want to leave this page?',
    showCancelButton: true,
    confirmButtonText: 'Leave',
    cancelButtonText: 'Stay',
    focusCancel: true
  });
  return result.isConfirmed;
};

/**
 * Trigger a small top-right toast notification (auto-closes after 3 seconds)
 */
export const showSuccess = (message) => {
  return GlassSwalToast.fire({
    title: `✅ ${message}`,
  });
};

/**
 * Trigger a general error alert modal
 */
export const showError = (message = 'Failed to Save Data', subtext = 'Please try again.') => {
  return GlassSwal.fire({
    title: `❌ ${message}`,
    html: subtext,
    confirmButtonText: 'Ok'
  });
};

/**
 * Custom wrapper for arbitrary confirm messages
 */
export const confirmCustom = async (title, text, confirmText = 'Confirm', isDanger = false) => {
  const swalInstance = isDanger ? GlassSwalDanger : GlassSwal;
  const result = await swalInstance.fire({
    title,
    html: text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    focusCancel: true
  });
  return result.isConfirmed;
};
