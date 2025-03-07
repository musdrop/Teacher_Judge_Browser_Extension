function createPopup() {
  // 创建容器
  const container = document.createElement('div');
  container.innerHTML = `

  <h1>NUAA教师评价助手</h1>
  <div class="info"><span>身份ID:<span id="uuid">暂无</span></span> <button id="update">刷新</button></div>
  <script src="../api/crx.js"></script>
  <script src="popup.js"></script>
`;

  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
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
    }
`+`
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
    }

    .info {
      background-color: #fff;
      border: 1px solid #ddd;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      color: #555;
      display: flex;
      justify-content: space-between;
      /* 让子元素两端对齐 */
      align-items: center;
      /* 垂直居中对齐 */
    }

    #uuid {
      font-weight: bold;
    }


    #update {
      background-color: #007bff;
      color: #fff;
      border: none;
      width: 60px;
      height: 30px;
      border-radius: 5px;
      cursor: pointer;
    }
  `;
  
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
    const uuidSpan = document.getElementById('uuid');

localStorageGet('tj_uuid').then((uuid) => {
    uuidSpan.textContent = uuid;
});

let updateBtn = document.getElementById('update');
updateBtn.addEventListener('click', updateUUID);

function updateUUID() {
    let newID = newUUID();
    localStorageSet({ tj_uuid: newID });
    uuidSpan.textContent = newID;
}
  })();

  function closePopup() {
    document.body.removeChild(popupRoot);
  }
}