# Chatlite
**Chatlite** 是一个基于 UniApp 开发的本地 AI 客户端，支持多平台运行，包括 Windows、Linux、Mac、Android、HarmonyOS (鸿蒙)、iOS、H5 以及小程序。目前市面上的 iOS AI 客户端普遍最低支持 iOS 16 系统以上，为了让更多用户能够体验 AI 功能，我开发了这个开源项目，供有需要的人免费使用。
目前，该客户端支持 **聊天对话** 和 **AI 画图** 功能，旨在提供一个轻量、便捷的本地 AI 交互工具。
## 特性
- **多平台支持**：兼容 Windows、Linux、Mac、Android、HarmonyOS、iOS、H5 和小程序。
- **聊天对话**：与 AI 进行自然语言对话，获取智能回复。
- **AI 画图**：通过文本描述生成图像，释放创意。
- **本地化运行**：支持本地部署 AI 模型，保护用户隐私。
- **开源免费**：完全开源，欢迎社区贡献和改进。
## 支持平台
| 平台            | 支持状态 |
|----------------|---------|
| Windows        | ✅      |
| Linux          | ✅      |
| Mac            | ✅      |
| Android        | ✅      |
| HarmonyOS (鸿蒙) | ✅      |
| iOS            | ✅      |
| H5             | ✅      |
| 小程序          | ✅      |
> **注意**：由于 iOS 市场上现有 AI 客户端普遍不支持 iOS 16 以下版本，本项目致力于提供更广泛的兼容性支持。
## 安装指南
### 前提条件
- 确保已安装 Node.js（推荐版本：v14 或以上）。
- 确保已安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html) 或其他 UniApp 开发工具。
- 对于本地 AI 模型部署，可能需要安装相关依赖（具体依赖根据使用的模型而定）。
### 步骤
1. **克隆仓库**
   您可以从以下任一仓库克隆代码：
   - GitHub:
     ```bash
     git clone https://github.com/haocker/chatlite.git
     cd chatlite
     ```
   - GitCode:
     ```bash
     git clone https://gitcode.com/haocker/chatlite.git
     cd chatlite
     ```
   - Gitee:
     ```bash
     git clone https://gitee.com/haocker/chatlite.git
     cd chatlite
     ```
2. **安装依赖**
   ```bash
   npm install
   ```
3. **运行项目**
   使用 HBuilderX 打开项目，选择目标平台进行运行或打包：
   - 对于 H5、小程序：直接运行即可。
   - 对于原生 App（Android/iOS）：需使用 HBuilderX 打包生成安装包。
   - 对于桌面端（Windows/Linux/Mac）：需使用 UniApp 的桌面端打包工具。
4. **配置本地 AI 模型**（可选）
   如果需要本地运行 AI 模型，请参考相关文档配置模型文件和推理环境。
## 使用说明
1. **聊天对话**
   打开客户端，进入“聊天”页面，输入您的问题或内容，AI 将实时回复。
2. **AI 画图**
   进入“画图”页面，输入描述性文本（如“一只可爱的猫咪在草地上”），点击生成即可查看 AI 绘制的图像。
3. **设置**
   在设置页面中，您可以选择使用本地模型或云端 API，并配置相关参数。
## 贡献指南
欢迎社区成员参与贡献！如果您有任何改进建议或发现了 Bug，请按照以下步骤操作：
1. Fork 本仓库。
2. 创建您的分支（`git checkout -b feature/AmazingFeature`）。
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）。
4. 推送到分支（`git push origin feature/AmazingFeature`）。
5. 提交 Pull Request。
## 许可证
本项目采用 [MIT 许可证](LICENSE) 开源，欢迎自由使用、修改和分发。
## 联系方式
如果您有任何问题或建议，欢迎通过以下方式联系我：
- **GitHub Issues**：[提交问题](https://github.com/haocker/chatlite/issues)
- **GitCode Issues**：[提交问题](https://gitcode.com/haocker/chatlite/issues)
- **Gitee Issues**：[提交问题](https://gitee.com/haocker/chatlite/issues)
- **邮箱**：haocker@icloud.com
## 致谢
- 感谢 [UniApp](https://uniapp.dcloud.io/) 提供的跨平台开发框架。
- 感谢开源社区的支持和贡献。