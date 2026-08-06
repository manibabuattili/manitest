export type AttachmentInput = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
};

const MAX_BYTES = 800 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/** Convert browser File objects into attachment payloads for Server Actions. */
export async function filesToAttachmentInputs(files: File[]): Promise<AttachmentInput[]> {
  const results: AttachmentInput[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) {
      throw new Error(`${file.name} is larger than 800KB. Please upload a smaller image.`);
    }
    results.push({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      url: await readFileAsDataUrl(file),
    });
  }
  return results;
}
