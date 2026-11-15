# 零命令行基础 · GitHub 开源发布保姆级指南

本发布目录含 **65 个文件，合计约 52.55 MiB**。最大文件为单文件 HTML，约 **7.97 MiB**。项目自有代码和文档采用 MIT 协议，署名为 **宁维 (Neve)**。第三方许可见 [README](./README.md)。

---

## 方法一：纯网页直接上传（最快，无需安装任何软件）

GitHub 网页端单次可上传最多 100 个文件，每个文件最多 25 MiB。[GitHub 上传文档](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

### 第 1 步：在 GitHub 网页新建仓库
1. 打开 [GitHub](https://github.com) 并登录。在 **Settings → Emails** 开启 **Keep my email addresses private**，使用 GitHub 提供的 noreply 地址提交。[GitHub 提交邮箱说明](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address)
2. 点击页面右上角的 **`+` 号图标** → 选择 **`New repository`**（新建仓库）。
3. 按下面填写表单：
   - **Repository name（仓库名称）**：输入 `kinetic-ppt-studio`
   - **Description（简介，选填）**：输入 `开源双引擎物理动效演示文稿工坊（Native OpenXML .pptx + HTML5/GSAP 七绝转场与动态文字排版） by 宁维 (Neve)`
   - **Public / Private**：保持勾选 **`Public`**（公开开源）
   - **Add a README file / Add .gitignore / Choose a license**：**全部不要勾选**（因为我们整理好的文件夹里已经自带了更漂亮的 `README.md`、`LICENSE` 和 `.gitignore`！）
4. 点击绿色的 **`Create repository`** 按钮。

### 第 2 步：拖拽文件夹一键上传
1. 创建成功后，你会看到一个快速引导页，找到并点击蓝色链接 **`uploading an existing file`**（上传已有文件）。
2. 在电脑上打开资源管理器，进入本文件夹 `kinetic-ppt-studio`。
3. 将 `kinetic-ppt-studio` 目录里的发布文件与文件夹拖进上传区域。确保 `README.md`、`LICENSE` 和 `.gitignore` 位于仓库根目录，`docs/`、`examples/`、`skills/` 的子目录结构完整。
4. 对照上传清单，确认全部 65 个发布文件已加入。若清单缺少 `.gitignore`，用 **Choose your files** 补选。使用过构建和导出命令时，把本地的 `node_modules/`、`dist/`、`.tmp/` 等生成目录排除在此次网页上传之外。
5. 在页面最下方的 **Commit changes** 框里：
   - 第一行输入：`feat: initial open-source release v3.0 by 宁维 (Neve)`
   - 点击绿色的 **`Commit changes`** 按钮！
6. 回到仓库主页，确认 README 的 10 张预览图正常显示、`LICENSE` 中署名正确，且 `examples/` 下的三个演示文件均可下载。

---

## 方法二：使用已安装的 GitHub Desktop

使用此方法前，请确认客户端和本地仓库的数据写入位置满足你的工作区要求。

1. 打开已配置好的客户端并登录 GitHub。
2. **添加本地文件夹**：
   - 打开 GitHub Desktop，点击左上角菜单 **`File` → `Add local repository...`**
   - 点击 `Choose...`，选择你电脑上的 `kinetic-ppt-studio` 文件夹路径。
   - 如果下方弹出提示 *"This directory does not appear to be a Git repository. Would you like to create a repository here instead?"*，直接点击蓝色文字 **`create a repository`**！
   - 在弹窗里直接点击 **`Create Repository`**（名称默认就是 `kinetic-ppt-studio`）。
3. **一键发布到 GitHub**：
   - 点击软件顶部栏正中间的蓝色按钮 **`Publish repository`**（发布仓库）。
   - **⚠️ 关键一步**：在弹出的小窗口里，**取消勾选** `Keep this code private`（把勾去掉，才是公开开源！）。
   - 点击 **`Publish Repository`**，等待进度条走完，你的开源项目就正式上线了！

---

## 附：发布后怎么装饰你的 GitHub 主页更吸粉？

上传完成后，在你的 GitHub 仓库主页右侧找到 **`About` 旁边的齿轮图标 ⚙️**，点开可以填上：
- **Topics（标签，输入后按回车）**：`ppt`、`pptx`、`claude-code-skill`、`agent-skills`、`gsap`、`openxml`、`presentation`、`chinese-ink`
- 勾选 **`Releases`** / **`Packages`**（可选），保存后别人更容易在 GitHub 搜到你的作品！
