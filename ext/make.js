const plugin_file_name = "NTJ.js";
const iconURL = "https://img.picui.cn/free/2025/03/07/67ca7f0d7a64b.png";
const updateURL = "https://github.com/musdrop/Teacher_Judge_Browser_Extension/releases/latest/download/NTJ.js";
const namespace = 'nuaa_teacher_judge';

const fs = require('fs');
const path = require('path');
const outputFilePath = path.join(__dirname, plugin_file_name);

let combinedContent = '';

// 读取mainfest文件内容解析
const manifestPath = path.join(__dirname, 'manifest.json');
const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
const manifest = JSON.parse(manifestContent);
const { name, version, description, author, content_scripts } = manifest;
const { js, matches } = content_scripts[0];

// --生成油猴插件属性--
combinedContent
  += `// ==UserScript==\n`
  + `// @name         ${name}\n`
  + `// @namespace    ${namespace}\n`
  + `// @version      ${version}\n`
  + `// @description  ${description}\n`
  + `// @icon          ${iconURL}\n`
  + `// @author       ${author}\n`
  + `// @include      ${matches}\n`
  + `// @grant        GM_setValue\n`
  + `// @grant        GM_getValue\n`
  + `// @grant        GM_registerMenuCommand\n`
  + `// @downloadURL  ${updateURL}\n`
  + `// @updateURL    ${updateURL}\n`
  + `// ==/UserScript==\n`;


// --读取每个js文件的内容并组合--
js.forEach(script => {
  // 替换基础API
  if (script === '/api/crx.js') {
    script = '/api/usc.js';
  }
  const scriptPath = path.join(__dirname, script);
  const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  combinedContent += `\n// ${script}\n` + scriptContent;
});

// --读取popup弹窗并生成独立函数--

// 配置路径
const inputDir = path.join(__dirname, 'popup');
const outputFile = path.join(__dirname, 'bundle-popup.js');

// 读取原始文件
const htmlContent = fs.readFileSync(path.join(inputDir, 'popup.html'), 'utf-8');
// 从html中提取出body
const bodyContent = htmlContent.match(/<body>([\s\S]*)<\/body>/)[1];
// 提取style
const styleContent = htmlContent.match(/<style>([\s\S]*?)<\/style>/)[1];
console.log(styleContent);
const jsContent = fs.readFileSync(path.join(inputDir, 'popup.js'), 'utf-8');

// 转义特殊字符
function escapeContent(content) {
  return content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');
}

// 生成独立函数
const popupCode = `function createPopup() {
  // 创建容器
  const container = document.createElement('div');
  container.innerHTML = \`
${escapeContent(bodyContent)}\`;

  // 添加样式
  const style = document.createElement('style');
  style.textContent = \`
    .popup-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      background: white;
      padding: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      width: 450px;
    }
    .popup-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9998;
    }
    [data-close] {
      cursor: pointer;
      position: absolute;
      top: 10px;
      right: 10px;
    }\n\`+\`${styleContent}\`;
  
  // 包裹容器
  const wrapper = document.createElement('div');
  container.appendChild(style);
  wrapper.appendChild(container);
  wrapper.classList.add('popup-container');
  
  // 创建背景遮罩
  const backdrop = document.createElement('div');
  backdrop.classList.add('popup-backdrop');
  
  // 组合元素
  const popupRoot = document.createElement('div');
  popupRoot.appendChild(backdrop);
  popupRoot.appendChild(wrapper);
  
  // 插入到文档
  document.body.appendChild(popupRoot);

  // 自动关闭逻辑
  backdrop.addEventListener('click', closePopup);
  const closeButtons = container.querySelectorAll('[data-close]');
  closeButtons.forEach(btn => btn.addEventListener('click', closePopup));

  // 注入原始JS逻辑
  (function() {
    ${jsContent}
  })();

  function closePopup() {
    document.body.removeChild(popupRoot);
  }
}`;

// --合并独立弹窗函数到输出文件，注册设置--
combinedContent += `\n// Popup\n` + popupCode;

// 添加菜单项，绑定创建弹窗函数
combinedContent += `
// 添加菜单项
GM_registerMenuCommand('配置设置', createPopup);
`;

// 写入到输出文件
fs.writeFileSync(outputFilePath, combinedContent, 'utf-8');

console.log('Tampermonkey plugin created successfully!');
