/**
 * uploadMode === single 일 때 단일 업로드 진행
 */
export async function uploadSingleFile(uploadUrl, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed for ${file.name}`);
  }

  return response.json();
}

/**
 * uploadMode === multi 일 때 다중 업로드 진행
 */
export async function uploadMultipleFiles(uploadUrl, files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Multi upload failed");
  }

  return response.json();
}
