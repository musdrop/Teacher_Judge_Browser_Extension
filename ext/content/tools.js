// 设置样式的辅助函数
function setStyles(element, styles) {
  for (const property in styles) {
    element.style[property] = styles[property];
  }
}


// 弹窗函数
function showToast(message, type) {
    // 创建弹窗容器
    const toast = document.createElement('div');
    toast.textContent = message;
    setStyles(toast, {
        position: 'fixed',
        top: '-50px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 'bold',
        borderRadius: '8px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        transition: 'top 0.5s ease-in-out, opacity 0.5s',
        opacity: '0.95',
        zIndex: '9999',
    });
    
    // 根据类型设置样式
    if (type === 'error') {
        toast.style.backgroundColor = '#ff4d4f'; // 红色背景
        toast.style.color = '#fff';
    } else if (type === 'notice') {
        toast.style.backgroundColor = '#1890ff'; // 蓝色背景
        toast.style.color = '#fff';
    } else {
        toast.style.backgroundColor = '#555'; // 默认灰色背景
        toast.style.color = '#fff';
    }
    
    document.body.appendChild(toast);
    
    // 触发动画，使其滑入可见区域
    setTimeout(() => {
        toast.style.top = '20px';
    }, 10);
    
    // 2秒后自动消失
    setTimeout(() => {
        toast.style.top = '-50px';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove(); // 完全消失后移除
        }, 500);
    }, 2000);
}