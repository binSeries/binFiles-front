export default class Uploader {
  constructor({
    target,
    options = {},
    callbacks = {},
    trigger = { start: false },
    uploadMode = "multi",
    uploadUrl,
  }) {
    this.target = target; // 업로드 버튼이 표시될 대상
    this.options = {
      maxFiles: Infinity,
      minFiles: 1,
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

    this.trigger = trigger; // 외부 제어용 trigger 변수
    this.files = null; // 선택된 파일
    this.uploadMode = uploadMode; // single: 개별 파일 업로드, multi: 다중 파일 업로드
    this.uploadUrl = uploadUrl;

    this.init();
    this.setupTriggerObserver();
  }

  init() {
    // 파일 uploadInput 생성
    const input = document.createElement("input");
    input.type = "file";
    input.style.opacity = 0; // 보이지 않도록 처리
    input.style.position = "absolute";
    input.style.width = "100%";
    input.style.height = "100%";
    input.style.cursor = "pointer";
    input.style.top = 0;
    input.style.left = 0;
    input.style.zIndex = 1000;

    input.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    input.addEventListener("drop", (event) => {
      event.preventDefault();
      this.triggerOnLoad(event);
    });

    input.addEventListener("click", (event) => {
      console.log("hello world");
    });

    input.addEventListener("change", (event) => {
      this.triggerOnLoad(event);
    });

    this.input = input;
    this.target.appendChild(input);
  }

  /**
   * 파일 선택 시 onLoad 트리거
   */
  triggerOnLoad(event) {
    this.files = event.target.files;

    // 파일이 선택되지 않았다면 무시
    if (!this.files || this.files.length === 0) return;

    // 파일 로드 콜백 실행
    if (this.callbacks.onLoad && typeof this.callbacks.onLoad === "function") {
      Array.from(this.files).forEach((file) => this.callbacks.onLoad(file));
    }
  }
  /**
   * trigger 변수를 Proxy로 감싸 상태 변화 감지
   */
  setupTriggerObserver() {
    const proxyTrigger = new Proxy(this.trigger, {
      set: async (target, key, value) => {
        if (key === "start" && value === true) {
          // trigger.start가 true로 변경되면 업로드 시작
          await this.triggerUpload();
          // 업로드 완료 후 false로 리셋
          target[key] = false;
        } else {
          target[key] = value;
        }
        // 프록시 성공 처리
        return true;
      },
    });

    this.trigger = proxyTrigger;
  }

  /**
   * trigger 변경 시 처리
   */
  async triggerUpload() {
    if (!this.files || this.files.length === 0) {
      alert("업로드 할 파일이 없습니다.");
      return;
    }

    // 유효성 검사
    this.validateFile();

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
   * 파일 유효성 검사
   */
  validateFile() {
    // 파일 확장자
    if (
      this.options.allowedExtensions.length > 0 &&
      Array.from(this.files).some(
        (file) =>
          !this.options.allowedExtensions.includes(file.name.split(".").pop())
      )
    ) {
      throw new Error(`허용되지 않은 파일 확장자가 포함되어 있습니다.`);
    }

    // 파일 최대값
    if (
      this.options.maxFiles !== Infinity &&
      this.files.length > this.options.maxFiles
    ) {
      throw new Error(`파일 최대 개수를 초과하였습니다.`);
    }

    // 파일 최소값
    if (
      this.options.minFiles !== 0 &&
      this.files.length < this.options.minFiles
    ) {
      throw new Error(`파일 최소 개수를 충족하지 않았습니다.`);
    }

    // total파일 사이즈
    const totalSize = Array.from(this.files).reduce(
      (acc, file) => acc + file.size,
      0
    );

    if (totalSize > this.options.maxTotalSize) {
      throw new Error(`파일 총 업로드 가능 크기를 초과하였습니다.`);
    }

    // 개별 최대 파일 사이즈
    if (
      this.options.maxFileSize !== Infinity &&
      Array.from(this.files).some(
        (file) => file.size > this.options.maxFileSize
      )
    ) {
      throw new Error(`파일 최대 크기를 초과하였습니다.`);
    }
  }

  /**
   * 선택된 파일 반환
   */
  getFiles() {
    return this.files ? Array.from(this.files) : [];
  }
}
