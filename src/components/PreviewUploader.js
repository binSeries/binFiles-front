import Uploader from "./Uploader.js";

export default class PreviewUploader extends Uploader {
  constructor(uploaderSettings) {
    super(uploaderSettings);
    this.previewContainer = null; // 미리보기 영역
    this.createPreviewContainer(); // 미리보기 영역 초기화
  }

  /**
   * 미리보기 영역 생성
   */
  createPreviewContainer() {
    this.previewContainer = document.createElement("div");
    this.previewContainer.className = "preview-container";

    this.target.after(this.previewContainer);
  }

  /**
   * 초기화 시 미리보기 영역 업데이트 로직 추가
   */
  init() {
    super.init();

    // input change 시 미리보기 영역 업데이트
    this.input.addEventListener("change", () => {
      this.updatePreview();
    });
  }

  /**
   * 미리보기 영역 업데이트
   */
  updatePreview() {
    // 기존 미리보기 초기화
    this.previewContainer.innerHTML = "";

    // 파일이 선택되지 않았다면 무시
    if (!this.files || this.files.length === 0) return;

    const filePreview = document.createElement("div");
    Array.from(this.files).forEach((file, index) => {
      let element = null;
      if (file.type.startsWith("image/")) {
        element = this.createImagePreviewElement(file);
      } else {
        element = this.createDefaultPreviewElement(file);
      }

      filePreview.appendChild(element);
    });

    this.previewContainer.appendChild(filePreview);
  }

  /**
   * 이미지 파일 미리보기 엘리먼트 생성
   * @param {File} file
   * @returns {HTMLElement}
   */
  createImagePreviewElement(file) {
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.style.width = "100px";

    return image;
  }

  /**
   * 일반 파일 미리보기 엘리먼트 생성
   * @param {File} file
   * @returns {HTMLElement}
   */
  createDefaultPreviewElement(file) {
    const p = document.createElement("p");
    p.textContent = file.name + "." + file.type.split("/")[1];

    return p;
  }
}
