"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      messages: [
        {
          content: "你好！我是AI助手，有什么我可以帮助你的吗？",
          isUser: false
        }
      ],
      userInput: "",
      isSending: false,
      models: [],
      currentModel: "",
      newModel: {
        id: "",
        modelId: "",
        name: "",
        type: "chat",
        apiUrl: "",
        apiKey: ""
      },
      editMode: false,
      scrollTop: 0,
      isUserScrolling: false,
      defaultModels: [
        { id: "uuid-gpt-4o", modelId: "gpt-4o", name: "GPT-4o (OpenAI)", type: "chat", apiUrl: "", apiKey: "", value: "uuid-gpt-4o", label: "GPT-4o (OpenAI)" },
        { id: "uuid-gpt-3.5-turbo", modelId: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (OpenAI)", type: "chat", apiUrl: "", apiKey: "", value: "uuid-gpt-3.5-turbo", label: "GPT-3.5 Turbo (OpenAI)" }
      ],
      modelTypeOptions: [
        { value: "chat", text: "聊天" },
        { value: "drawing", text: "画图" }
      ],
      addModelOptions: []
    };
  },
  computed: {
    modelOptions() {
      return this.models.map((model) => ({ value: model.id, text: model.name }));
    }
  },
  onLoad() {
    let statusBarObj = this.getPhoneInfo();
    this.statusBarHeight = statusBarObj.statusBarHeight;
    common_vendor.marked.setOptions({
      breaks: true,
      gfm: true
    });
    this.initializeUI();
  },
  methods: {
    generateUniqueId() {
      return "uuid-" + Math.random().toString(36).substr(2, 9);
    },
    initializeUI() {
      const savedModels = common_vendor.index.getStorageSync("aiChatModels");
      this.models = savedModels ? JSON.parse(savedModels) : this.defaultModels;
      this.currentModel = common_vendor.index.getStorageSync("aiChatCurrentModel") || this.models[0].id;
    },
    markedContent(content) {
      let mdstr = common_vendor.marked.parse(content);
      mdstr = mdstr.replace(/\<img/gi, '<img style="max-width:100%;height:auto" ');
      return mdstr;
    },
    openSettings() {
      this.$refs.settingsDrawer.open();
    },
    closeSettings() {
      this.$refs.settingsDrawer.close();
    },
    onModelChange(event) {
      const index = event.detail.value;
      this.currentModel = this.modelOptions[index].value;
      common_vendor.index.setStorageSync("aiChatCurrentModel", this.currentModel);
    },
    openAddModelModal() {
      this.editMode = false;
      this.newModel = { id: "", modelId: "", name: "", type: "chat", apiUrl: "", apiKey: "" };
      this.$refs.addModelDrawer.open();
    },
    closeAddModelModal() {
      this.$refs.addModelDrawer.close();
    },
    editModel(modelId) {
      const model = this.models.find((m) => m.id === modelId);
      if (model) {
        this.editMode = true;
        this.newModel = { ...model };
        this.$refs.addModelDrawer.open();
      }
    },
    saveModel() {
      if (!this.newModel.modelId || !this.newModel.name) {
        common_vendor.index.showToast({ title: "请输入有效的模型ID和名称", icon: "none" });
        return;
      }
      if (this.editMode) {
        const index = this.models.findIndex((m) => m.id === this.newModel.id);
        if (index !== -1) {
          this.models[index] = { ...this.newModel };
        } else {
          this.newModel.id = this.generateUniqueId();
          this.models.push({ ...this.newModel });
        }
      } else {
        if (this.models.some((m) => m.modelId === this.newModel.modelId && m.id !== this.newModel.id)) {
          common_vendor.index.showToast({ title: "该模型ID已存在", icon: "none" });
          return;
        }
        this.newModel.id = this.generateUniqueId();
        this.models.push({ ...this.newModel });
      }
      common_vendor.index.setStorageSync("aiChatModels", JSON.stringify(this.models));
      this.closeAddModelModal();
    },
    removeModel(modelId) {
      common_vendor.index.showModal({
        title: "确认",
        content: "确定要删除此模型吗？",
        success: (res) => {
          if (res.confirm) {
            this.models = this.models.filter((m) => m.id !== modelId);
            if (this.currentModel === modelId && this.models.length > 0) {
              this.currentModel = this.models[0].id;
              common_vendor.index.setStorageSync("aiChatCurrentModel", this.currentModel);
            }
            common_vendor.index.setStorageSync("aiChatModels", JSON.stringify(this.models));
          }
        }
      });
    },
    saveSettings() {
      common_vendor.index.setStorageSync("aiChatModels", JSON.stringify(this.models));
      common_vendor.index.setStorageSync("aiChatCurrentModel", this.currentModel);
      this.closeSettings();
    },
    async sendMessage() {
      const message = this.userInput.trim();
      if (!message)
        return;
      const model = this.models.find((m) => m.id === this.currentModel);
      if (!model) {
        common_vendor.index.showToast({ title: "请选择一个有效的模型", icon: "none" });
        return;
      }
      if (!model.apiKey) {
        common_vendor.index.showToast({ title: `请为 ${model.name} 设置API密钥`, icon: "none" });
        this.openSettings();
        return;
      }
      this.messages.push({ content: message, isUser: true });
      this.userInput = "";
      this.isSending = true;
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
      try {
        await this.callAiApi(message, model);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:288", "Error:", error);
        this.messages.push({ content: "抱歉，发生了错误。请检查API密钥和网络连接后再试。", isUser: false });
      } finally {
        this.isSending = false;
        this.scrollToBottom();
      }
    },
    async callAiApi(userMessage, model) {
      try {
        if (model.type === "chat") {
          return await this.callChatApi(userMessage, model);
        } else if (model.type === "drawing") {
          return await this.callDrawingApi(userMessage, model);
        } else {
          throw new Error("Unsupported model type");
        }
      } catch (error) {
        this.messages.push({ content: `错误: ${error.message}`, isUser: false });
        this.scrollToBottom();
      }
    },
    async callChatApi(userMessage, model) {
      const apiUrl = model.apiUrl || "https://api.openai.com/v1/chat/completions";
      const apiKey = model.apiKey;
      const messages = this.getChatContext(userMessage);
      this.messages.push({ content: "", isUser: false, isThinking: true });
      const aiMessageIndex = this.messages.length - 1;
      this.scrollToBottom();
      try {
        const contentData = {
          model: model.modelId,
          messages,
          temperature: 1,
          stream: true
        };
        const requestTask = common_vendor.index.request({
          url: apiUrl,
          method: "POST",
          header: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          data: contentData,
          dataType: "json",
          responseType: "text",
          enableChunked: true,
          // 开启流式传输
          success: (res) => {
            this.messages[aiMessageIndex].isThinking = false;
            if (res.data && res.data.choices && res.data.choices[0].message && res.data.choices[0].message.content) {
              this.messages[aiMessageIndex].content = res.data.choices[0].message.content;
              this.scrollToBottom();
            }
          },
          fail: (err) => {
            this.messages[aiMessageIndex].isThinking = false;
            this.messages[aiMessageIndex].content = `API请求失败: ${err.errMsg}`;
            this.scrollToBottom();
          }
        });
        requestTask.onHeadersReceived(function(res) {
        });
        let buffer = "";
        requestTask.onChunkReceived((res) => {
          let decoder = new TextDecoder("utf-8");
          let text = decoder.decode(new Uint8Array(res.data));
          buffer += text;
          const lines = buffer.split("\n");
          buffer = lines.pop();
          for (const line of lines) {
            if (line) {
              const parsedData = this.parseStream(line);
              if (parsedData && parsedData.content) {
                if (!this.messages[aiMessageIndex].content) {
                  this.messages[aiMessageIndex].content = "";
                }
                this.messages[aiMessageIndex].content += parsedData.content;
                this.messages[aiMessageIndex].isThinking = false;
                setTimeout(() => {
                  this.scrollToBottom();
                }, 0);
              }
            }
          }
        });
      } catch (error) {
        this.messages[aiMessageIndex].isThinking = false;
        throw error;
      }
    },
    async callDrawingApi(userMessage, model) {
      const apiUrl = model.apiUrl || "https://api.openai.com/v1/images/generations";
      const apiKey = model.apiKey;
      this.messages.push({ content: "", isUser: false, isThinking: true });
      const aiMessageIndex = this.messages.length - 1;
      this.scrollToBottom();
      try {
        const response = await common_vendor.index.request({
          url: apiUrl,
          method: "POST",
          header: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          data: {
            prompt: userMessage,
            model: model.modelId,
            response_format: "b64_json",
            n: 1
          }
        });
        this.messages[aiMessageIndex].isThinking = false;
        if (response.statusCode === 200) {
          let content = "";
          response.data.data.forEach((item, index) => {
            const imageUrl = item.b64_json;
            const revisedPrompt = item.revised_prompt || "Generated Image";
            content += `![${revisedPrompt}](data:image/png;base64,${imageUrl})

`;
          });
          this.messages[aiMessageIndex].content = content;
          this.scrollToBottom();
        } else {
          this.messages[aiMessageIndex].content = `API请求失败，状态码: ${response.statusCode}, 错误信息: ${response.data.error.message}`;
          this.scrollToBottom();
        }
      } catch (error) {
        this.messages[aiMessageIndex].isThinking = false;
        this.messages[aiMessageIndex].content = `错误: ${error.message}`;
        this.scrollToBottom();
        throw error;
      }
    },
    getChatContext(currentMessage) {
      const contextMessages = [];
      let count = 0;
      for (let i = this.messages.length - 1; i >= 0 && count < 5; i--) {
        const msg = this.messages[i];
        if (msg.isUser && msg.content === currentMessage) {
          continue;
        }
        contextMessages.unshift({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content
        });
        count++;
      }
      contextMessages.push({
        role: "user",
        content: currentMessage
      });
      return contextMessages;
    },
    streamResponse(content) {
      this.messages.push({ content: "", isUser: false });
      const aiMessageIndex = this.messages.length - 1;
      let currentText = "";
      const streamingDelay = 10;
      let index = 0;
      const stream = () => {
        if (index < content.length) {
          currentText += content[index];
          this.messages[aiMessageIndex].content = currentText;
          this.scrollToBottom();
          index++;
          setTimeout(stream, streamingDelay);
        }
      };
      stream();
    },
    scrollToBottom() {
      setTimeout(() => {
        const query = common_vendor.index.createSelectorQuery().in(this);
        query.select(".chat-messages").scrollOffset((data) => {
          if (data) {
            this.scrollTop = data.scrollHeight;
          }
        }).exec();
      }, 50);
    },
    onScroll(event) {
      const { scrollTop, scrollHeight, clientHeight } = event.detail;
      this.isUserScrolling = scrollTop < scrollHeight - clientHeight - 10;
    },
    parseStream(text) {
      try {
        if (text.startsWith("data: ")) {
          const jsonStr = text.substring(6);
          if (jsonStr === "[DONE]") {
            return { content: "" };
          }
          const data = JSON.parse(jsonStr);
          if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
            return { content: data.choices[0].delta.content };
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:587", "Error parsing stream data:", error);
      }
      return { content: "" };
    },
    getPhoneInfo() {
      const phoneInfo = common_vendor.index.getSystemInfoSync();
      let statusBarObj = {
        statusBarHeight: 20
      };
      common_vendor.index.__f__("log", "at pages/index/index.vue:596", phoneInfo);
      statusBarObj.statusBarHeight = phoneInfo.statusBarHeight;
      return statusBarObj;
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  const _easycom_uni_drawer2 = common_vendor.resolveComponent("uni-drawer");
  const _easycom_uni_data_select2 = common_vendor.resolveComponent("uni-data-select");
  (_easycom_uni_icons2 + _easycom_uni_list_item2 + _easycom_uni_list2 + _easycom_uni_drawer2 + _easycom_uni_data_select2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
const _easycom_uni_drawer = () => "../../uni_modules/uni-drawer/components/uni-drawer/uni-drawer.js";
const _easycom_uni_data_select = () => "../../uni_modules/uni-data-select/components/uni-data-select/uni-data-select.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_list_item + _easycom_uni_list + _easycom_uni_drawer + _easycom_uni_data_select)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a;
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.o($options.openSettings),
    c: common_vendor.p({
      type: "gear",
      size: "24",
      color: "white"
    }),
    d: common_vendor.f($data.messages, (message, index, i0) => {
      return common_vendor.e({
        a: message.isUser ? message.content : $options.markedContent(message.content),
        b: message.isThinking
      }, message.isThinking ? {} : {}, {
        c: index,
        d: common_vendor.n(message.isUser ? "user-message" : "ai-message")
      });
    }),
    e: $data.scrollTop,
    f: common_vendor.o((...args) => $options.onScroll && $options.onScroll(...args)),
    g: common_vendor.t(((_a = $options.modelOptions.find((opt) => opt.value === $data.currentModel)) == null ? void 0 : _a.text) || "请选择模型"),
    h: $options.modelOptions.findIndex((opt) => opt.value === $data.currentModel),
    i: $options.modelOptions,
    j: common_vendor.o((...args) => $options.onModelChange && $options.onModelChange(...args)),
    k: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    l: $data.userInput,
    m: common_vendor.o(($event) => $data.userInput = $event.detail.value),
    n: $data.isSending,
    o: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    p: $data.statusBarHeight + "px",
    q: common_vendor.o($options.openAddModelModal),
    r: common_vendor.p({
      type: "plus",
      size: "24",
      color: "#4a5568"
    }),
    s: common_vendor.o($options.closeSettings),
    t: common_vendor.p({
      type: "close",
      size: "24",
      color: "#4a5568"
    }),
    v: common_vendor.f($data.models, (model, index, i0) => {
      return {
        a: common_vendor.t(model.name),
        b: common_vendor.t(model.type),
        c: common_vendor.o(($event) => $options.editModel(model.id), index),
        d: common_vendor.o(($event) => $options.removeModel(model.id), index),
        e: index,
        f: "1cf27b2a-5-" + i0 + ",1cf27b2a-4"
      };
    }),
    w: common_vendor.p({
      direction: "column",
      ["show-arrow"]: false
    }),
    x: common_vendor.sr("settingsDrawer", "1cf27b2a-1"),
    y: common_vendor.p({
      mode: "left",
      width: 300,
      ["mask-click"]: true
    }),
    z: $data.statusBarHeight + "px",
    A: common_vendor.t($data.editMode ? "编辑模型" : "添加模型"),
    B: common_vendor.o($options.closeAddModelModal),
    C: common_vendor.p({
      type: "close",
      size: "24",
      color: "#4a5568"
    }),
    D: $data.newModel.name,
    E: common_vendor.o(($event) => $data.newModel.name = $event.detail.value),
    F: $data.newModel.modelId,
    G: common_vendor.o(($event) => $data.newModel.modelId = $event.detail.value),
    H: common_vendor.o(($event) => $data.newModel.type = $event),
    I: common_vendor.p({
      localdata: $data.modelTypeOptions,
      placeholder: "请选择模型类型",
      modelValue: $data.newModel.type
    }),
    J: $data.newModel.apiUrl,
    K: common_vendor.o(($event) => $data.newModel.apiUrl = $event.detail.value),
    L: $data.newModel.apiKey,
    M: common_vendor.o(($event) => $data.newModel.apiKey = $event.detail.value),
    N: common_vendor.o((...args) => $options.saveModel && $options.saveModel(...args)),
    O: common_vendor.sr("addModelDrawer", "1cf27b2a-6"),
    P: common_vendor.p({
      mode: "left",
      width: 300,
      ["mask-click"]: true
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
