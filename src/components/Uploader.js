import {
  validateFiles,
  mergeWithExistingFiles,
} from "../services/uploaderService.js";

export default class Uploader {
  constructor({
    target,
    options = {},
    callbacks = {},
    uploadMode = "multi",
    uploadUrl,
    existingFiles,
  }) {
    this.target = target; // 업로드 영역
    this.options = {
      maxFiles: Infinity,
      minFiles: 0,
      maxTotalSize: Infinity,
      maxFileSize: Infinity,
      allowedExtensions: [],
      ...options, // 옵션 객체 overriding을 위한 병합
    };
    this.callbacks = {
      beforeUpload: null,
      afterUpload: null,
      onLoad: null,
      ...callbacks, // 콜백 함수 overriding을 위한 병합
    };

    this.files = null; // 선택된 파일
    this.uploadMode = uploadMode; // single: 개별 파일 업로드, multi: 다중 파일 업로드
    this.uploadUrl = uploadUrl; // 파일 업로드 URL
    this.existingFiles = existingFiles; // 기존 파일

    this.init();
  }

  init() {
    this.createFileInput();

    if (
      this.existingFiles !== null &&
      this.existingFiles !== undefined &&
      this.existingFiles.length > 0
    ) {
      this.loadExistingFiles();
    }
  }

  /**
   * uploadInput 생성
   */
  createFileInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.style.opacity = 0; // 보이지 않도록 처리
    input.style.position = "absolute";
    input.style.cursor = "pointer";
    input.style.top = 0;
    input.style.left = 0;
    input.style.zIndex = 1000;

    this.target.addEventListener("click", (event) => {
      input.click();
    });

    this.target.addEventListener("drop", (event) => {
      event.preventDefault();
      this.triggerOnLoad(event.dataTransfer.files);
    });

    input.addEventListener("change", (event) => {
      this.triggerOnLoad(event.target.files);
    });

    this.input = input;
    this.target.appendChild(input);
  }

  /**
   * 기존 파일 로드
   */
  loadExistingFiles() {
    this.existingFiles.forEach((file) => {
      this.triggerOnLoad(file);
    });
  }

  /**
   * 파일 선택 시 onLoad 트리거
   */
  triggerOnLoad(files) {
    // 파일이 선택되지 않았다면 무시
    if (!files || files.length < 0) return;

    // 기존 파일과 새로 선택된 파일 병합
    mergeWithExistingFiles(this.files, files);

    // 파일 로드 콜백 실행
    if (this.callbacks.onLoad && typeof this.callbacks.onLoad === "function") {
      Array.from(this.files).forEach((file) => this.callbacks.onLoad(file));
    }
  }

  /**
   * 파일 업로드
   */
  async upload() {
    if (!this.files || this.files.length === 0) {
      alert("업로드 할 파일이 없습니다.");
      return;
    }

    // 유효성 검사
    validateFile(this.files, this.options);

    // beforeUpload 후크 실행
    if (
      this.callbacks.beforeUpload &&
      typeof this.callbacks.beforeUpload === "function"
    ) {
      const shouldProceed = await this.callbacks.beforeUpload(this.files);
      if (shouldProceed === false) return;
    }

    // 파일 업로드 로직 실행
    let uploadResults = null;
    if (this.uploadMode === "multi") {
      uploadResults = await this.uploadFiles(this.files);
    } else if (this.uploadMode === "single") {
      uploadResults = await Promise.all(
        this.files.map((file) => this.uploadFile(file))
      );
    }

    // afterUpload 후크 실행
    if (this.callbacks.afterUpload) {
      this.callbacks.afterUpload(uploadResults);
    }

    // 업로드 후 파일 초기화
    this.files = null;
  }

  /**
   * uploadMode === single 일 때 단일 업로드 진행
   */
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(this.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed for ${file.name}`);
      }

      const result = await response.json();
      return { file, result, status: "success" };
    } catch (error) {
      console.log("Upload error : " + error);
      return { file, error, status: "error" };
    }
  }

  /**
   * uploadMode === multi 일 때 다중 업로드 진행
   */
  async uploadFiles(files) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(this.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Multi upload failed");
      }

      const results = await response.json();
      return results.map((result, index) => ({
        file: files[index],
        result,
        status: "success",
      }));
    } catch (error) {
      console.error("Upload error : ", error);
      return files.map((file) => ({
        file,
        error,
        status: "error",
      }));
    }
  }

  /**
   * 선택된 파일 반환
   */
  getSelectedFiles() {
    return this.files ? this.files : [];
  }

  /**
   * 목록에서 파일 제거
   */
  removeFile(file) {
    this.files = Array.from(this.files).filter((f) => f !== file);
    console.log(this.files);
  }

  /**
   * 파일 목록 초기화
   */
  resetFiles() {
    this.files = null;
  }

  /**
   * 삭제된 파일 반환
   */
  getDelFiles() {}

  /**
   * 업로드 된 파일 반환
   */
  getUploadFiles() {}
  /**
   *
   */
}
