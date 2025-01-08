import {
  validateFiles,
  mergeWithExistingFiles,
  uploadMultipleFiles,
  uploadSingleFile,
} from "../services/uploaderService.js";
import { FileState } from "../state/UploadState.js";
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

    this.uploadMode = uploadMode; // single: 개별 파일 업로드, multi: 다중 파일 업로드
    this.uploadUrl = uploadUrl; // 파일 업로드 URL

    FileState.set("existingFiles", existingFiles);
    this.init();
  }

  init() {
    this.createFileInput();

    const existingFiles = FileState.get("existingFiles");
    if (existingFiles.length > 0) {
      this.loadExistingFiles(existingFiles);
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
      this.handleFileDrop(event.dataTransfer.files);
    });

    input.addEventListener("change", (event) => {
      this.handleFileDrop(event.target.files);
    });

    this.input = input;
    this.target.appendChild(input);
  }

  /**
   * 기존 파일 로드
   */
  loadExistingFiles(existingFiles) {
    FileState.addTo("displayFiles", files);
    if (this.callbacks.onLoad && typeof this.callbacks.onLoad === "function") {
      Array.from(existingFiles).forEach((file) => this.callbacks.onLoad(file));
    }
  }

  /**
   * 파일 선택 시 onLoad 트리거
   */
  handleFileDrop(files) {
    // 파일이 선택되지 않았다면 무시
    if (!files || files.length < 0) return;

    // 기존 파일과 새로 선택된 파일 병합
    FileState.addTo("displayFiles", Array.from(files));

    // 파일 로드 콜백 실행
    if (this.callbacks.onLoad && typeof this.callbacks.onLoad === "function") {
      Array.from(files).forEach((file) => this.callbacks.onLoad(file));
    }
  }

  /**
   * 파일 업로드
   */
  async upload() {
    const filesToUpload = FileState.get("displayFiles");
    if (!filesToUpload || filesToUpload.length === 0) {
      alert("업로드 할 파일이 없습니다.");
      return;
    }

    // 유효성 검사
    validateFiles(filesToUpload, this.options);

    // beforeUpload 후크 실행
    if (
      this.callbacks.beforeUpload &&
      typeof this.callbacks.beforeUpload === "function"
    ) {
      const shouldProceed = await this.callbacks.beforeUpload(filesToUpload);
      if (shouldProceed === false) return;
    }

    // 파일 업로드 로직 실행
    let uploadedFiles = [];
    if (this.uploadMode === "multi") {
      uploadedFiles = await uploadMultipleFiles(this.uploadUrl, this.files);
    } else if (this.uploadMode === "single") {
      uploadedFiles = await Promise.all(
        this.files.map((file) => uploadSingleFile(this.uploadUrl, file))
      );
    }

    FileState.addTo("uploadedFiles", uploadedFiles);

    // afterUpload 후크 실행
    if (this.callbacks.afterUpload) {
      this.callbacks.afterUpload(uploadedFiles);
    }

    // 업로드 후 파일 초기화
    FileState.reset("displayFiles");
  }

  /**
   * 화면에 표시된 파일 반환
   */
  getDisplayFiles() {
    return FileState.get("displayFiles");
  }

  /**
   * 업로드할 파일 반환
   */
  getNeedUploadFiles() {
    return FileState.get("needUploadFiles");
  }

  /**
   * 삭제할 파일 반환
   */
  getNeedDeleteFiles() {
    return FileState.get("needDeleteFiles");
  }

  /**
   * 업로드 된 파일 반환
   */
  getUploadedFiles() {
    return FileState.get("uploadedFiles");
  }

  /**
   * 삭제 된 파일 반환
   */
  getDeletedFiles() {
    return FileState.get("deletedFiles");
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
}
