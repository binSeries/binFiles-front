/**
 * 파일 유효성 검사
 * @param {*} files
 * @param {*} options
 */
export function validateFile(files, options) {
  // 파일 확장자
  if (
    options.allowedExtensions.length > 0 &&
    Array.from(files).some(
      (file) => !options.allowedExtensions.includes(file.name.split(".").pop())
    )
  ) {
    throw new Error(`허용되지 않은 파일 확장자가 포함되어 있습니다.`);
  }

  // 파일 최대값
  if (options.maxFiles !== Infinity && files.length > options.maxFiles) {
    throw new Error(`파일 최대 개수를 초과하였습니다.`);
  }

  // 파일 최소값
  if (options.minFiles !== 0 && files.length < options.minFiles) {
    throw new Error(`파일 최소 개수를 충족하지 않았습니다.`);
  }

  // total파일 사이즈
  // total파일 사이즈를 여러 형태로 정의할 수 있어야 한다.
  const totalSize = Array.from(files).reduce(
    (totalSize, file) => totalSize + file.size,
    0
  );

  if (totalSize > options.maxTotalSize) {
    throw new Error(`파일 총 업로드 가능 크기를 초과하였습니다.`);
  }

  // 개별 최대 파일 사이즈
  if (
    options.maxFileSize !== Infinity &&
    Array.from(files).some((file) => file.size > options.maxFileSize)
  ) {
    throw new Error(`파일 최대 크기를 초과하였습니다.`);
  }
}

/**
 * 기존 파일과 새로 업로드를 위해 올라온 파일 병합
 * @param {*} existingFiles
 * @param {*} newFiles
 */
export function mergeWithExistingFiles(existingFiles, newFiles) {
  return existingFiles ? [...existingFiles, ...Array.from(newFiles)] : newFiles;
}
