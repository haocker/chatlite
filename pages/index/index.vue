<template>
	
  <view class="chat-container">
	  <view class="status_bar" :style="{height:statusBarHeight+'px'}">
	              <!-- 这里是状态栏 -->
	          </view>
    <view class="chat-header">
      <view class="header-icons">
        <uni-icons type="bars" size="24" color="white" @click="openConversations"></uni-icons>
        <uni-icons type="gear" size="24" color="white" @click="openSettings"></uni-icons>
      </view>
      <view class="header-title">ChatLite</view>
    </view>
    <scroll-view class="chat-messages" ref="chatMessages" scroll-y="true" :scroll-top="scrollTop" @scroll="onScroll">
      <view class="message" 
        v-for="(message, index) in messages" 
        :key="index" 
        :class="[
          message.isUser ? 'user-message' : 'ai-message',
          {'message--clickable': message.isUser}
        ]"
        @click="message.isUser && fillMessage(message.content)"
      >
        <view class="message-content" 
          v-html="message.isUser ? message.content : markedContent(message.content)"
        ></view>
        <view 
          v-if="!message.isUser && !message.isThinking && message.isComplete" 
          class="copy-button" 
          @click.stop="copyMessage(message.content)"
        >
          复制
        </view>
        <view v-if="message.isThinking" class="thinking-animation">
          <view class="dot"></view>
          <view class="dot"></view>
          <view class="dot"></view>
        </view>
      </view>
    </scroll-view>
    <view class="model-selector">
      <text>模型:</text>
      <picker
        :value="modelOptions.findIndex(opt => opt.value === currentModel)"
        :range="modelOptions"
        range-key="text"
        @change="onModelChange"
      >
        <view class="uni-input">{{ modelOptions.find(opt => opt.value === currentModel)?.text || '请选择模型' }}</view>
      </picker>
    </view>
    <view class="chat-input" :class="{'chat-input--fullscreen': isFullscreen}">
      <view v-if="isFullscreen" :style="{height:statusBarHeight+'px'}">
                  <!-- 这里是状态栏 -->
              </view>
	  <view class="textarea-tools">
        <uni-icons 
          :type="isFullscreen ? 'bottom' : 'top'" 
          size="20" 
          color="#666"
          @click="toggleFullscreen"
        ></uni-icons>
      </view>
      <view class="input-container">
        <view class="agent-button-container" v-if="!isFullscreen">
          <button class="agent-button" @click="openAgentsDrawer">
            <uni-icons type="staff" size="20" color="#666"></uni-icons>
          </button>
        </view>
        <view class="textarea-container">
          <textarea
            v-model="userInput"
            placeholder="输入消息..."
            :auto-height="true"
            :show-confirm-bar="false"
            :maxlength="-1"
            :cursor-spacing="20"
            class="chat-textarea"
            :style="{
              maxHeight: isFullscreen ? 'calc(100vh - 180px)' : '84px',
              minHeight: '36px',
              height: 'auto',
              width: isFullscreen ? '100%' : '100%'
            }"
            @confirm="sendMessage"
          />
        </view>
        <button
          v-if="!isFullscreen"
          :disabled="isSending"
          @click="sendMessage"
          class="send-button"
        >
          <uni-icons type="paperplane" size="20" color="white"></uni-icons>
        </button>
      </view>
    </view>
    
    <!-- Settings Drawer -->
    <uni-drawer ref="settingsDrawer" mode="left" :width="300" :mask-click="true">
      <view class="drawer-content">
		  <view :style="{height:statusBarHeight+'px'}">
		              <!-- 这里是状态栏 -->
		          </view>
        <view class="modal-header">
          <view class="modal-title">设置</view>
          <view class="header-actions">
            <uni-icons type="plus" size="24" color="#4a5568" @click="openAddModelModal" style="margin-right: 10px;"></uni-icons>
            <uni-icons type="close" size="24" color="#4a5568" @click="closeSettings"></uni-icons>
          </view>
        </view>
        <view class="settings-form">
          <view class="form-group">
            <text>模型列表</text>
            <uni-list>
              <uni-list-item v-for="(model, index) in models" direction="column"  :key="index"  :show-arrow="false" >
               <template v-slot:header>
                 <text style="margin-bottom: 8px;">{{model.name}}( {{model.type}})</text>
                </template>
			   
			   <template v-slot:footer>
				  <view class="button-sp-area">
				  				<button class="mini-btn" type="primary" size="mini" @click="editModel(model.id)">编辑</button>
				  				<button class="mini-btn" type="warn" size="mini"  @click="removeModel(model.id)">删除</button>
				  			</view>
                </template>
              </uni-list-item>
            </uni-list>
          </view>
          <!-- Removed Save Settings button as per request -->
        </view>
      </view>
    </uni-drawer>
    
    <!-- Conversations Drawer -->
    <uni-drawer ref="conversationsDrawer" mode="left" :width="300" :mask-click="true">
      <view class="drawer-content">
        <view :style="{height:statusBarHeight+'px'}">
          <!-- 这里是状态栏 -->
        </view>
        <view class="modal-header">
          <view class="modal-title">会话列表</view>
          <view class="header-actions">
            <uni-icons type="plus" size="24" color="#4a5568" @click="addNewConversation" style="margin-right: 10px;"></uni-icons>
            <uni-icons type="close" size="24" color="#4a5568" @click="closeConversations"></uni-icons>
          </view>
        </view>
        <view class="settings-form">
          <view class="form-group">
            <uni-list>
              <uni-list-item v-for="(conv, index) in conversations" :key="index" :show-arrow="false">
                <template v-slot:header>
                  <view class="conversation-item" @click="selectConversation(conv.id)">
                    <text :style="{ color: conv.id === currentConversationId ? '#3b82f6' : '#000' }">{{ conv.name }}</text>
                  </view>
                </template>
                <template v-slot:footer>
                  <view class="button-sp-area">
                    <uni-icons type="trash" size="20" color="#ef4444" @click="removeConversation(conv.id)"></uni-icons>
                  </view>
                </template>
              </uni-list-item>
            </uni-list>
          </view>
        </view>
      </view>
    </uni-drawer>
    
    <!-- Add/Edit Model Drawer -->
    <uni-drawer ref="addModelDrawer" mode="left" :width="300" :mask-click="true">
      
	  <view class="drawer-content">
		  <view :style="{height:statusBarHeight+'px'}">
		              <!-- 这里是状态栏 -->
		          </view>
        <view class="modal-header">
          <view class="modal-title">{{ editMode ? '编辑模型' : '添加模型' }}</view>
          <uni-icons type="close" size="24" color="#4a5568" @click="closeAddModelModal"></uni-icons>
        </view>
        <view class="settings-form">
          <view class="form-group">
            <text>模型名称</text>
            <input v-model="newModel.name" placeholder="输入模型名称" />
          </view>
          <view class="form-group">
            <text>模型ID</text>
            <input v-model="newModel.modelId" placeholder="输入模型ID" />
          </view>
          <view class="form-group">
            <text>模型类型</text>
            <uni-data-select
              v-model="newModel.type"
              :localdata="modelTypeOptions"
              placeholder="请选择模型类型"
            ></uni-data-select>
          </view>
          <view class="form-group">
            <text>API URL</text>
            <input v-model="newModel.apiUrl" placeholder="输入API URL" />
          </view>
          <view class="form-group">
            <text>API密钥</text>
            <input type="password" v-model="newModel.apiKey" placeholder="输入API密钥" />
          </view>
          <button @click="saveModel" class="save-button">保存</button>
        </view>
      </view>
    </uni-drawer>
      <!-- Agents Drawer -->
  <uni-popup ref="agentsDrawer" type="left" :mask-click="true" :style="{zIndex:9999}">
    <view class="drawer-content" style="width: 260px; height: 100vh;">
      <view :style="{height:statusBarHeight+'px'}">
        <!-- 这里是状态栏 -->
      </view>
      <view class="modal-header">
        <view class="modal-title">智能体列表</view>
        <view class="header-actions">
          <uni-icons type="plus" size="24" color="#4a5568" @click="openAddAgentModal" style="margin-right: 10px;"></uni-icons>
          <uni-icons type="close" size="24" color="#4a5568" @click="closeAgentsDrawer"></uni-icons>
        </view>
      </view>
      <view class="settings-form">
        <view class="form-group">
          <uni-list>
            <uni-list-item v-for="(agent, index) in agents" :key="index" :show-arrow="false">
              <template v-slot:header>
                <view class="agent-item" @click="selectAgent(agent.id)">
                  <text :style="{ color: agent.id === currentAgentId ? '#3b82f6' : '#000' }">{{ agent.name }}</text>
                </view>
              </template>
              <template v-slot:footer>
                <view class="button-sp-area" v-if="agent.id !== 'default'">
                  <uni-icons type="compose" size="20" color="#3b82f6" @click="editAgent(agent.id)" style="margin-right: 10px;"></uni-icons>
                  <uni-icons type="trash" size="20" color="#ef4444" @click="removeAgent(agent.id)"></uni-icons>
                </view>
              </template>
            </uni-list-item>
          </uni-list>
        </view>
      </view>
    </view>
  </uni-popup>

  <!-- Add/Edit Agent Drawer -->
  <uni-popup ref="addAgentDrawer" type="left" :mask-click="true" :style="{zIndex:9999}">
    <view class="drawer-content" style="width: 260px; height: 100vh;">
      <view :style="{height:statusBarHeight+'px'}">
        <!-- 这里是状态栏 -->
      </view>
      <view class="modal-header">
        <view class="modal-title">{{ editAgentMode ? '编辑智能体' : '新增智能体' }}</view>
        <uni-icons type="close" size="24" color="#4a5568" @click="closeAddAgentModal"></uni-icons>
      </view>
      <view class="settings-form">
        <view class="form-group">
          <text>名称</text>
          <input v-model="newAgent.name" placeholder="输入智能体名称" />
        </view>
        <view class="form-group">
          <text>提示词</text>
          <view class="prompt-label" @click="openFullScreenPromptEditor">
            <text v-if="newAgent.prompt">{{ newAgent.prompt }}</text>
            <text v-else class="placeholder-text">点击输入提示词...</text>
          </view>
        </view>
        <button @click="saveAgent" class="save-button">保存</button>
      </view>
    </view>
  </uni-popup>
  
  <!-- Full Screen Prompt Editor -->
  <uni-popup ref="fullScreenPromptEditor" type="center" :mask-click="false" :style="{zIndex:9999}">
    <view class="full-screen-editor">
      <view :style="{height:statusBarHeight+'px'}">
        <!-- 这里是状态栏 -->
      </view>
      <view class="editor-header">
        <view class="editor-title">编辑提示词</view>
      </view>
      <view class="editor-content">
        <textarea
          v-model="newAgent.prompt"
          placeholder="输入提示词..."
          :auto-height="true"
          :show-confirm-bar="false"
          :maxlength="-1"
          :cursor-spacing="20"
          :adjust-position="true"
          :hold-keyboard="true"
          class="chat-textarea full-screen-textarea"
          style="height: calc(100vh - 120px); width: 100%;"
        />
      </view>
      <view class="editor-footer">
        <button @click="closeFullScreenPromptEditor" class="save-button large-close-button">完成</button>
      </view>
    </view>
  </uni-popup>
  </view>


</template>

<script>
import { marked } from 'marked';

export default {
  data() {
    return {
	  statusBarHeight:0,
      messages: [
        {
          content: '你好！我是AI助手，有什么我可以帮助你的吗？',
          isUser: false
        }
      ],
      userInput: '',
      isSending: false,
      models: [],
      currentModel: '',
      newModel: {
        id: '',
        modelId: '',
        name: '',
        type: 'chat',
        apiUrl: '',
        apiKey: ''
      },
      editMode: false,
      scrollTop: 0,
      isUserScrolling: false,
      defaultModels: [
        { id: 'uuid-deepseek', modelId: 'deepseek', name: 'Deepseek (免费)', type: 'chat', apiUrl: '', apiKey: 'null'},
        { id: 'uuid-gemini', modelId: 'gemini', name: 'Gemini (免费)', type: 'chat', apiUrl: '', apiKey: 'null'},
        { id: 'uuid-gpt-4o', modelId: 'openai-large', name: 'GPT-4o (免费)', type: 'chat', apiUrl: '', apiKey: 'null'},
      ],
      modelTypeOptions: [
        { value: 'chat', text: '聊天' },
        { value: 'drawing', text: '画图' }
      ],
      addModelOptions: [],
      isFullscreen: false,
      previousHeight: null,
      conversations: [],
      currentConversationId: null,
      agents: [],
      currentAgentId: 'default',
      newAgent: {
        id: '',
        name: '',
        prompt: ''
      },
      editAgentMode: false
    };
  },
  computed: {
    modelOptions() {
      return this.models.map(model => ({ value: model.id, text: model.name }));
    }
  },
  watch: {
    // 监听每条消息的完成状态
    'messages': {
      deep: true,
      handler(newMessages) {
        // 找到最后一条消息
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && !lastMessage.isUser && !lastMessage.isThinking && lastMessage.isComplete) {
          // 消息完成后自动滚动
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      }
    }
  },
  onLoad() {
	  let statusBarObj = this.getPhoneInfo()
	  this.statusBarHeight = statusBarObj.statusBarHeight
    // #ifdef H5
	if(typeof window.acjsapi != "undefined"){
		acjsapi.getStatusBarHeight().then(r=>{
			this.statusBarHeight = r;
		})
	}
	// #endif
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    this.initializeUI();
  },
  methods: {
    generateUniqueId() {
      return 'uuid-' + Math.random().toString(36).substr(2, 9);
    },
    initializeUI() {
      const savedModels = uni.getStorageSync('aiChatModels');
      this.models = savedModels ? JSON.parse(savedModels) : this.defaultModels;
      this.currentModel = uni.getStorageSync('aiChatCurrentModel') || this.models[0].id;
      this.loadConversations();
    },
    loadConversations() {
      const savedConversations = uni.getStorageSync('aiChatConversations');
      this.conversations = savedConversations ? JSON.parse(savedConversations) : [];
      if (this.conversations.length === 0) {
        // 自动创建一个名为“默认会话”的会话
        const newConvId = this.generateUniqueId();
        const newConv = {
          id: newConvId,
          name: '默认会话',
          createdAt: new Date().toISOString()
        };
        this.conversations.push(newConv);
        this.saveConversations();
      }
      this.currentConversationId = uni.getStorageSync('aiChatCurrentConversation') || this.conversations[0]?.id;
      this.loadMessages();
      this.loadAgents();
    },
    loadMessages() {
      if (this.currentConversationId) {
        const savedMessages = uni.getStorageSync(`aiChatMessages_${this.currentConversationId}`);
        this.messages = savedMessages ? JSON.parse(savedMessages) : [
          {
            content: '你好！我是AI助手，有什么我可以帮助你的吗？',
            isUser: false
          }
        ];
      }
    },
    saveConversations() {
      uni.setStorageSync('aiChatConversations', JSON.stringify(this.conversations));
    },
    saveMessages() {
      if (this.currentConversationId) {
        uni.setStorageSync(`aiChatMessages_${this.currentConversationId}`, JSON.stringify(this.messages));
      }
    },
    openConversations() {
      this.$refs.conversationsDrawer.open();
    },
    closeConversations() {
      this.$refs.conversationsDrawer.close();
    },
    loadAgents() {
      const savedAgents = uni.getStorageSync('aiChatAgents');
      this.agents = savedAgents ? JSON.parse(savedAgents) : [
        {
          id: 'default',
          name: '默认智能体',
          prompt: '你是一个AI助手，尽力帮助用户解决问题。'
        }
      ];
      this.currentAgentId = uni.getStorageSync('aiChatCurrentAgent') || 'default';
    },
    saveAgents() {
      uni.setStorageSync('aiChatAgents', JSON.stringify(this.agents));
    },
    openAgentsDrawer() {
      this.$refs.agentsDrawer.open();
    },
    closeAgentsDrawer() {
      this.$refs.agentsDrawer.close();
    },
    selectAgent(agentId) {
      this.currentAgentId = agentId;
      uni.setStorageSync('aiChatCurrentAgent', agentId);
      this.closeAgentsDrawer();
    },
    openAddAgentModal() {
      this.editAgentMode = false;
      this.newAgent = { id: '', name: '', prompt: '' };
      this.$refs.addAgentDrawer.open();
    },
    closeAddAgentModal() {
      this.$refs.addAgentDrawer.close();
    },
    editAgent(agentId) {
      const agent = this.agents.find(a => a.id === agentId);
      if (agent) {
        this.editAgentMode = true;
        this.newAgent = { ...agent };
        this.$refs.addAgentDrawer.open();
      }
    },
    saveAgent() {
      if (!this.newAgent.name) {
        uni.showToast({ title: '请输入智能体名称', icon: 'none' });
        return;
      }
      
      if (this.editAgentMode) {
        const index = this.agents.findIndex(a => a.id === this.newAgent.id);
        if (index !== -1) {
          this.agents[index] = { ...this.newAgent };
        } else {
          this.newAgent.id = this.generateUniqueId();
          this.agents.push({ ...this.newAgent });
        }
      } else {
        this.newAgent.id = this.generateUniqueId();
        this.agents.push({ ...this.newAgent });
      }
      this.saveAgents();
      this.closeAddAgentModal();
    },
    openFullScreenPromptEditor() {
      this.$refs.fullScreenPromptEditor.open();
    },
    closeFullScreenPromptEditor() {
      this.$refs.fullScreenPromptEditor.close();
    },
    removeAgent(agentId) {
      uni.showModal({
        title: '确认',
        content: '确定要删除此智能体吗？',
        success: (res) => {
          if (res.confirm) {
            this.agents = this.agents.filter(a => a.id !== agentId);
            if (this.currentAgentId === agentId) {
              this.currentAgentId = 'default';
              uni.setStorageSync('aiChatCurrentAgent', this.currentAgentId);
            }
            this.saveAgents();
          }
        }
      });
    },
    addNewConversation() {
      uni.showModal({
        title: '新建会话',
        content: '',
        editable: true,
        placeholderText: '会话名称',
        success: (res) => {
          if (res.confirm && res.content) {
            const newConvId = this.generateUniqueId();
            const newConv = {
              id: newConvId,
              name: res.content,
              createdAt: new Date().toISOString()
            };
            this.conversations.push(newConv);
            this.saveConversations(); // 确保在选择新会话前保存
            this.selectConversation(newConvId);
          }
        }
      });
    },
    selectConversation(convId) {
      this.currentConversationId = convId;
      uni.setStorageSync('aiChatCurrentConversation', convId);
      this.loadMessages();
      this.closeConversations();
    },
    removeConversation(convId) {
      if (this.conversations.length <= 1) {
        uni.showToast({ title: '至少保留一个会话', icon: 'none' });
        return;
      }
      uni.showModal({
        title: '确认',
        content: '确定要删除此会话吗？',
        success: (res) => {
          if (res.confirm) {
            this.conversations = this.conversations.filter(c => c.id !== convId);
            if (this.currentConversationId === convId) {
              this.currentConversationId = this.conversations[0].id;
              uni.setStorageSync('aiChatCurrentConversation', this.currentConversationId);
              this.loadMessages();
            }
            this.saveConversations();
          }
        }
      });
    },
    markedContent(content) {
		let mdstr = marked.parse(content);
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
      uni.setStorageSync('aiChatCurrentModel', this.currentModel);
    },
    openAddModelModal() {
      this.editMode = false;
      this.newModel = { id: '', modelId: '', name: '', type: 'chat', apiUrl: '', apiKey: '' };
      this.$refs.addModelDrawer.open();
    },
    closeAddModelModal() {
      this.$refs.addModelDrawer.close();
    },
    editModel(modelId) {
      const model = this.models.find(m => m.id === modelId);
      if (model) {
        this.editMode = true;
        this.newModel = { ...model };
        this.$refs.addModelDrawer.open();
      }
    },
    saveModel() {
      if (!this.newModel.modelId || !this.newModel.name) {
        uni.showToast({ title: '请输入有效的模型ID和名称', icon: 'none' });
        return;
      }
      
      if (this.editMode) {
        const index = this.models.findIndex(m => m.id === this.newModel.id);
        if (index !== -1) {
          this.models[index] = { ...this.newModel };
        } else {
          this.newModel.id = this.generateUniqueId();
          this.models.push({ ...this.newModel });
        }
      } else {
        // 允许模型ID重复
        this.newModel.id = this.generateUniqueId();
        this.models.push({ ...this.newModel });
      }
      // Automatically save to localStorage after adding or editing a model
      uni.setStorageSync('aiChatModels', JSON.stringify(this.models));
      this.closeAddModelModal();
    },
    removeModel(modelId) {
      uni.showModal({
        title: '确认',
        content: '确定要删除此模型吗？',
        success: (res) => {
          if (res.confirm) {
            this.models = this.models.filter(m => m.id !== modelId);
            if (this.currentModel === modelId && this.models.length > 0) {
              this.currentModel = this.models[0].id;
              uni.setStorageSync('aiChatCurrentModel', this.currentModel);
            }
            // Do not close the settings modal or save settings automatically
            uni.setStorageSync('aiChatModels', JSON.stringify(this.models));
          }
        }
      });
    },
    saveSettings() {
      uni.setStorageSync('aiChatModels', JSON.stringify(this.models));
      uni.setStorageSync('aiChatCurrentModel', this.currentModel);
      this.closeSettings();
    },
    async sendMessage() {
      const message = this.userInput.trim();
      if (!message) return;
      
      const model = this.models.find(m => m.id === this.currentModel);
      if (!model) {
        uni.showToast({ title: '请选择一个有效的模型', icon: 'none' });
        return;
      }
      
      if (!model.apiKey) {
        uni.showToast({ title: `请为 ${model.name} 设置API密钥`, icon: 'none' });
        this.openSettings();
        return;
      }
      
      this.messages.push({ content: message, isUser: true });
      this.userInput = '';
      this.isSending = true;
      this.saveMessages();
      
      // Ensure scrolling to bottom after sending user message
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
      
      try {
        await this.callAiApi(message, model);
      } catch (error) {
        console.error('Error:', error);
        this.messages.push({ content: '抱歉，发生了错误。请检查API密钥和网络连接后再试。', isUser: false });
        this.saveMessages();
      } finally {
        this.isSending = false;
        this.scrollToBottom();
      }
    },
    async callAiApi(userMessage, model) {
      try {
        if (model.type === 'chat') {
          return await this.callChatApi(userMessage, model);
        } else if (model.type === 'drawing') {
          return await this.callDrawingApi(userMessage, model);
        } else {
          throw new Error('Unsupported model type');
        }
      } catch (error) {
        this.messages.push({ content: `错误: ${error.message}`, isUser: false });
        this.saveMessages();
        this.scrollToBottom();
      }
    },
    async callChatApi(userMessage, model) {
      const apiUrl = model.apiUrl || 'https://text.pollinations.ai/openai';
      const apiKey = model.apiKey;
      const messages = this.getChatContext(userMessage);
      
      this.messages.push({ content: '', isUser: false, isThinking: true, isComplete: false });
      const aiMessageIndex = this.messages.length - 1;
      this.scrollToBottom();
      
      try {
        const contentData = {
          model: model.modelId,
          messages: messages,
          temperature: 1.0,
          stream: true
        };
        let headers = {
            'Content-Type': 'application/json',
            'Accept': "text/event-stream"
          };
          if(apiKey!='null'){
            headers['Authorization'] =  `Bearer ${apiKey}`;
          }
        // Use conditional compilation for platform-specific streaming methods
        // #ifdef MP-WEIXIN || MP-QQ || MP-BAIDU || MP-ALIPAY || MP-TOUTIAO
        // Use uni.request for streaming on mini-programs
        const requestTask = uni.request({
          url: apiUrl,
          method: 'POST',
          header: headers,
          data: contentData,
          dataType: 'json',
          responseType: 'text',
          enableChunked: true, // 开启流式传输
          success: (res) => {
            // 处理完整的响应数据
            this.messages[aiMessageIndex].isThinking = false;
            if (res.data && res.data.choices && res.data.choices[0].message && res.data.choices[0].message.content) {
              this.messages[aiMessageIndex].content = res.data.choices[0].message.content;
              this.messages[aiMessageIndex].isComplete = true; // 标记消息已完成
              this.saveMessages();
              this.scrollToBottom();
            }
          },
          fail: (err) => {
            // 处理错误情况
            this.messages[aiMessageIndex].isThinking = false;
            this.messages[aiMessageIndex].content = `API请求失败: ${err.errMsg}`;
            this.messages[aiMessageIndex].isComplete = true; // 即使出错也标记完成
            this.saveMessages();
            this.scrollToBottom();
          }
        });

        requestTask.onHeadersReceived(function(res) {
          // 可以在这里处理响应头信息
        });

        let buffer = ''; // 用于累积不完整的行
        requestTask.onChunkReceived((res) => {
          // 处理接收到的数据块
          let decoder = new TextDecoder('utf-8');
          let text = decoder.decode(new Uint8Array(res.data));
          buffer += text; // 将新数据添加到缓冲区
          
          // 按行分割缓冲区内容
          const lines = buffer.split('\n');
          buffer = lines.pop(); // 保留最后一行（可能不完整）作为新的缓冲区内容
          
          // 处理完整的行
          for (const line of lines) {
            if (line) {
              const parsedData = this.parseStream(line);
              if (line.includes('[DONE]')) {
                this.messages[aiMessageIndex].isComplete = true; // 标记消息已完成
                this.saveMessages();
                setTimeout(() => {
                  this.scrollToBottom();
                }, 0);
              } else if (parsedData && parsedData.content) {
                if (!this.messages[aiMessageIndex].content) {
                  this.messages[aiMessageIndex].content = '';
                }
                this.messages[aiMessageIndex].content += parsedData.content;
                this.messages[aiMessageIndex].isThinking = false;
                this.saveMessages();
                // Ensure scrolling to bottom after each content update
                setTimeout(() => {
                  this.scrollToBottom();
                }, 0);
              }
            }
          }
        });
        // #endif
        
        // #ifndef MP-WEIXIN || MP-QQ || MP-BAIDU || MP-ALIPAY || MP-TOUTIAO
        // Use fetch for streaming on other platforms (H5, App)
        fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(contentData)
        }).then(response => {
          if (!response.ok) {
            throw new Error(`API请求失败，状态码: ${response.status}`);
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let content = '';
          let buffer = ''; // 用于累积不完整的行
          
          this.messages[aiMessageIndex].isThinking = false;
          
          const read = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                // 处理可能剩余的缓冲区内容
                if (buffer) {
                  const parsedData = this.parseStream(buffer);
                  if (parsedData && parsedData.content) {
                    content += parsedData.content;
                    this.messages[aiMessageIndex].content = content;
                    this.saveMessages();
                    setTimeout(() => {
                      this.scrollToBottom();
                    }, 0);
                  }
                }
                this.messages[aiMessageIndex].isComplete = true; // 标记消息已完成
                return;
              }
              const text = decoder.decode(value, { stream: true });
              buffer += text; // 将新数据添加到缓冲区
              
              // 按行分割缓冲区内容
              const lines = buffer.split('\n');
              buffer = lines.pop(); // 保留最后一行（可能不完整）作为新的缓冲区内容
              
              // 处理完整的行
              for (const line of lines) {
                if (line) {
                  const parsedData = this.parseStream(line);
                  if (parsedData && parsedData.content) {
                    content += parsedData.content;
                    this.messages[aiMessageIndex].content = content;
                    this.saveMessages();
                    setTimeout(() => {
                      this.scrollToBottom();
                    }, 0);
                  }
                }
              }
              read();
            }).catch(error => {
              console.error('Stream reading error:', error);
              this.messages[aiMessageIndex].content = `流式读取错误: ${error.message}`;
              this.messages[aiMessageIndex].isComplete = true; // 即使出错也标记完成
              this.saveMessages();
              this.scrollToBottom();
            });
          };
          read();
        }).catch(error => {
          this.messages[aiMessageIndex].isThinking = false;
          this.messages[aiMessageIndex].content = `API请求失败: ${error.message}`;
          this.messages[aiMessageIndex].isComplete = true; // 即使出错也标记完成
          this.saveMessages();
          setTimeout(() => {
            this.scrollTop = 99999;
          }, 100);
        });
        // #endif
      } catch (error) {
        this.messages[aiMessageIndex].isThinking = false;
        this.messages[aiMessageIndex].isComplete = true; // 即使出错也标记完成
        throw error;
      }
    },
    async callDrawingApi(userMessage, model) {
      const apiUrl = model.apiUrl || 'https://api.openai.com/v1/images/generations';
      const apiKey = model.apiKey;
      
      // Show thinking animation while waiting for the drawing API response
      this.messages.push({ content: '', isUser: false, isThinking: true });
      const aiMessageIndex = this.messages.length - 1;
      this.scrollToBottom();
      
      try {
        const response = await uni.request({
          url: apiUrl,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          data: {
            prompt: userMessage,
            model: model.modelId,
            response_format: 'b64_json',
            n: 1
          }
        });
        
        this.messages[aiMessageIndex].isThinking = false;
        if (response.statusCode === 200) {
          let content = '';
          response.data.data.forEach((item, index) => {
            const imageUrl = item.b64_json;
            const revisedPrompt = item.revised_prompt || 'Generated Image';
            content += `![${revisedPrompt}](data:image/png;base64,${imageUrl})\n\n`;
          });
          this.messages[aiMessageIndex].content = content;
          this.saveMessages();
          this.scrollToBottom();
        } else {
          this.messages[aiMessageIndex].content = `API请求失败，状态码: ${response.statusCode}, 错误信息: ${response.data.error.message}`;
          this.saveMessages();
          this.scrollToBottom();
        }
      } catch (error) {
        this.messages[aiMessageIndex].isThinking = false;
        this.messages[aiMessageIndex].content = `错误: ${error.message}`;
        this.saveMessages();
        this.scrollToBottom();
        throw error;
      }
    },
    getChatContext(currentMessage) {
      const contextMessages = [];
      const currentAgent = this.agents.find(a => a.id === this.currentAgentId);
      if (currentAgent) {
        contextMessages.push({
          role: 'system',
          content: currentAgent.prompt
        });
      }
      let count = 0;
      for (let i = this.messages.length - 1; i >= 0 && count < 5; i--) {
        const msg = this.messages[i];
        // Avoid adding duplicate user message if it's the same as currentMessage
        if (msg.isUser && msg.content === currentMessage) {
          continue;
        }
        contextMessages.unshift({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content
        });
        count++;
      }
      contextMessages.push({
        role: 'user',
        content: currentMessage
      });
      return contextMessages;
    },
    streamResponse(content) {
      this.messages.push({ content: '', isUser: false });
      const aiMessageIndex = this.messages.length - 1;
      let currentText = '';
      const streamingDelay = 10;
      let index = 0;
      
      const stream = () => {
        if (index < content.length) {
          currentText += content[index];
          this.messages[aiMessageIndex].content = currentText;
          this.saveMessages();
          this.scrollToBottom();
          index++;
          setTimeout(stream, streamingDelay);
        }
      };
      
      stream();
    },
    scrollToBottom() {
      setTimeout(() => {
		  
        const query = uni.createSelectorQuery().in(this);
        query.select('.chat-messages').scrollOffset(data => {
          if (data) {
            // Update scrollTop to scroll to the bottom of the content
            this.scrollTop = data.scrollHeight;
          }
        }).exec();
      }, 50);
    },
    onScroll(event) {
      // No longer needed with custom scrolling, but kept for potential future use
      // Detect if user is manually scrolling
      const { scrollTop, scrollHeight, clientHeight } = event.detail;
      // If user is not at the bottom, they are manually scrolling
      this.isUserScrolling = scrollTop < scrollHeight - clientHeight - 10;
    },
    parseStream(text) {
      // Enhanced parsing for streaming data, handling multiple events in a single chunk
      try {
        if (text.startsWith('data: ')) {
          const jsonStr = text.substring(6);
          if (jsonStr === '[DONE]') {
            return { content: '' };
          }
          const data = JSON.parse(jsonStr);
          if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
            return { content: data.choices[0].delta.content };
          }
        }
      } catch (error) {
        console.error('Error parsing stream data:', error);
      }
      return { content: '' };
    },
	getPhoneInfo() {
			const phoneInfo = uni.getSystemInfoSync(); // 获取手机系统信息
			let statusBarObj = {
				statusBarHeight: 20
			}
			console.log(phoneInfo)
			// 设置状态栏高度（H5顶部无状态栏小程序有状态栏需要撑起高度）
			statusBarObj.statusBarHeight = phoneInfo.statusBarHeight;
			return statusBarObj;
		},
    copyMessage(content) {
      uni.setClipboardData({
        data: content,
        success: () => {
          uni.showToast({ title: '复制成功', icon: 'success' });
          //this.scrollToBottom(); // 滚动到底部
        },
        fail: () => {
          uni.showToast({ title: '复制失败', icon: 'none' });
        }
      });
    },
    fillMessage(content) {
      uni.showModal({
        title: '提示',
        content: '是否将此消息填充到输入框？',
        success: (res) => {
          if (res.confirm) {
            this.userInput = content;
          }
        }
      });
    },
    toggleFullscreen() {
      if (this.isFullscreen) {
        // 切换回正常模式时保持当前输入框内容的高度
        const query = uni.createSelectorQuery().in(this);
        query.select('.chat-textarea').boundingClientRect(data => {
          if (data) {
            this.previousHeight = data.height + 'px';
          }
        }).exec();
      }
      this.isFullscreen = !this.isFullscreen;
    }
  }
};
</script>

<style scoped>
.chat-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chat-header {
  background-color: #4a5568;
  color: white;
  padding: 15px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  position: relative;
}

.header-title {
  flex: 1;
  text-align: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header-icons {
  display: flex;
  align-items: center;
  gap: 15px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 0; /* Prevent flexbox compression issues */
  box-sizing: border-box;
}

.message {
  max-width: 80%;
  width: fit-content;
  padding: 10px 15px;
  border-radius: 18px;
  margin-bottom: 5px;
  word-wrap: break-word;
}

.user-message {
  align-self: flex-end;
  margin-left: auto;
  background-color: #3b82f6;
  color: white;
  border-bottom-right-radius: 5px;
}

.ai-message {
  align-self: flex-start;
  background-color: #e2e8f0;
  color: #1a202c;
  border-bottom-left-radius: 5px;
  position: relative; /* 为了定位复制按钮 */
}

.message-content {
  font-size: 1rem;
  line-height: 1.5;
}

.ai-message .message-content {
  color: #1a202c;
}

.chat-input {
  display: flex;
  padding: 8px 12px;
  background-color: white;
  border-top: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  z-index: 100;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.input-container {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  width: 100%;
}

.agent-button-container {
  display: flex;
  align-items: center;
}

.agent-button {
  height: 36px;
  width: 36px;
  min-width: 36px;
  flex: none;
  margin: 0;
  padding: 0;
  background-color: transparent;
  color: #666;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
  box-shadow: none;
  outline: none;
}

.agent-button::after {
  border: none !important;
  box-shadow: none !important;
}

.agent-button:hover {
  background-color: #e5e7eb;
  transform: scale(1.05);
}

.agent-button:active {
  transform: scale(0.95);
}

.textarea-container {
  flex: 1;
  position: relative;
}

.chat-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  box-sizing: border-box;
  overflow-y: auto;
  transition: all 0.3s ease;
  resize: none;
}

.chat-input--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: white;
  padding:0 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.chat-input--fullscreen .input-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.chat-input--fullscreen .textarea-container {
  height: 100%;
  width: 100%;
}

.chat-input--fullscreen .chat-textarea {
  height: 100% !important;
  border-color: transparent;
  background-color: #f9fafb;
  padding: 12px;
  width: 100%;
}

.send-button {
  height: 36px;
  width: 36px;
  min-width: 36px;
  flex: none;
  margin: 0 0 1px 0;
  padding: 0;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
}

.send-button:hover {
  background-color: #2563eb;
  transform: scale(1.05);
}

.send-button:active {
  transform: scale(0.95);
}

.send-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
  transform: none;
}  

.textarea-tools {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
  padding: 0 8px;
  box-sizing: border-box;
}

.textarea-tools uni-icons {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 24px;
  background-color: #f3f4f6;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.textarea-tools uni-icons:active {
  background-color: #e5e7eb;
}

/* Markdown styling */
.ai-message .message-content p {
  margin-bottom: 10px;
}

.ai-message .message-content ul, 
.ai-message .message-content ol {
  margin-left: 20px;
  margin-bottom: 10px;
}

.ai-message .message-content pre {
  background-color: #f1f5f9;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  margin-bottom: 10px;
}

.ai-message .message-content code {
  font-family: monospace;
  background-color: #f1f5f9;
  padding: 2px 4px;
  border-radius: 3px;
}

.ai-message .message-content blockquote {
  border-left: 4px solid #cbd5e1;
  padding-left: 10px;
  color: #64748b;
  margin-bottom: 10px;
}

.ai-message .message-content a {
  color: #3b82f6;
  text-decoration: none;
}

.ai-message .message-content a:hover {
  text-decoration: underline;
}



.typing-indicator {
  display: inline-block;
  width: 20px;
  text-align: left;
}

.thinking-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  margin: 0 5px;
  background-color: #1a202c;
  border-radius: 50%;
  animation: dotPulse 1.5s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.5);
  }
  40% {
    transform: scale(1);
  }
}

/* Settings Drawer */
.drawer-content {
  background-color: white;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group text {
  font-weight: bold;
  color: #4a5568;
}

.form-group select,
.form-group input {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  font-size: 1rem;
}

.list-actions {
  display: flex;
  align-items: center;
}

.list-actions button {
  padding: 4px 8px;
  font-size: 0.85rem;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.list-actions button:first-child {
  background-color: #eef2ff;
  color: #3b82f6;
}

.list-actions button:first-child:hover {
  background-color: #e0e7ff;
}

.list-actions button:last-child {
  background-color: #fff5f5;
  color: #ef4444;
}

.list-actions button:last-child:hover {
  background-color: #fee2e2;
}

.save-button {
  padding: 10px 15px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.conversation-item, .agent-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
}

.conversation-item text, .agent-item text {
  flex: 1;
}

.save-button:hover {
  background-color: #2563eb;
}

.model-selector {
  display: flex;
  align-items: center;
  background-color: white;
  border-top: 1px solid #e2e8f0;
  padding: 10px 15px;
}

/* Prompt Label */
.prompt-label {
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  padding: 10px;
  min-height: 3em;
  max-height: 10em;
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  background-color: white;
}

.prompt-label .placeholder-text {
  color: #999;
}

.prompt-label:hover {
  background-color: #f9fafb;
}

/* Full Screen Editor */
.full-screen-editor {
  background-color: white;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  z-index: 9999;
}

.editor-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
}

.editor-title {
  font-size: 1.5rem;
  font-weight: bold;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.full-screen-textarea {
  flex: 1;
  overflow-y: auto;
}

.editor-footer {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.large-close-button {
  padding: 12px 24px;
  font-size: 1.2rem;
  min-width: 120px;
}

.model-selector text {
  margin-right: 10px;
  font-weight: bold;
  color: #4a5568;
}
 .status_bar {
        background-color: #4a5568;
        width: 100%;
    }
.copy-button {
  margin-top: 5px;
  font-size: 0.8rem;
  color: #3b82f6;
  cursor: pointer;
  text-align: left;
}

.copy-button:hover {
  text-decoration: underline;
}

.message--clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.message--clickable:hover {
  opacity: 0.9;
}

.message--clickable:active {
  transform: scale(0.98);
}
</style>