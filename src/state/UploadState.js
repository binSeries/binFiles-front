export const FileState = {
  state: {
    existingFiles: [], // 기존에 저장되어 있던 파일
    displayFiles: [], // 화면에 표시할 파일
    needUploadFiles: [], // 업로드할 파일
    needDeleteFiles: [], // 삭제할 파일
    uploadedFiles: [], // 업로드된 파일
    deletedFiles: [], // 삭제된 파일
  },

  get(key) {
    if (!this.state.hasOwnProperty(key)) {
      throw new Error(`Invalid key: ${key}`);
    }
    return this.state[key];
  },

  set(key, value) {
    if (!this.state.hasOwnProperty(key)) {
      throw new Error(`Invalid key: ${key}`);
    }
    this.state[key] = value;
  },

  addTo(key, items) {
    if (!this.state.hasOwnProperty(key)) {
      throw new Error(`Invalid key: ${key}`);
    }
    this.state[key] = [...this.state[key], ...items];
  },

  reset() {
    Object.keys(this.state).forEach((key) => {
      this.state[key] = [];
    });
  },

  reset(key) {
    if (!this.state.hasOwnProperty(key)) {
      throw new Error(`Invalid key: ${key}`);
    }
    this.state[key] = [];
  },
};
