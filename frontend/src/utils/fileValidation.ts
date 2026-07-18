export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const validateFileSize = (file: File | Blob): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
};
