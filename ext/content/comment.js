/*
 * courseInfo 对象包含以下属性：
 * 课程序号：lessonId
 * 课程代码：courseCode
 * 课程名称：courseName
 * 教师名称：teacherName
 * 课程评分：score
 */

// 评论窗口
function evaluateCourseWindow(courseInfo) {
  // 禁用页面滚动
  document.body.style.overflow = "hidden";

  // 1. 创建弹出窗口的遮罩层
  const overlay = document.createElement("div");
  setStyles(overlay, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.7)", // 调整遮罩层颜色
    zIndex: "1000",
    overflowY: "auto", // 允许遮罩层滚动
    transition: "opacity 0.3s ease", // 添加淡入淡出效果
    opacity: "0",
  });

  // 2. 创建正方形窗口
  const popup = document.createElement("div");
  setStyles(popup, {
    position: "fixed",
    width: "70vh",
    height: "70vh",
    top: "10vh",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0px 4px 20px rgba(0,0,0,0.3)", // 调整阴影效果
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    opacity: "0",
    transition: "opacity 0.3s ease, transform 0.3s ease", // 添加淡入淡出和缩放效果
    transform: "translateX(-50%) scale(0.9)",
  });

  // 3. 关闭按钮
  const closeButton = document.createElement("span");
  closeButton.innerHTML = "&times;";
  setStyles(closeButton, {
    position: "absolute",
    top: "10px",
    right: "15px",
    fontSize: "24px",
    cursor: "pointer",
    color: "#333", // 调整颜色
  });
  closeButton.onclick = () => {
    overlay.style.opacity = "0";
    popup.style.opacity = "0";
    popup.style.transform = "translateX(-50%) scale(0.9)";
    setTimeout(() => {
      document.body.removeChild(overlay);
      // 恢复页面滚动
      document.body.style.overflow = "auto";
    }, 300);
  };

  // 4. 顶部课程信息（评分+教师名称）
  const header = document.createElement("div");
  setStyles(header, {
    padding: "20px", // 调整内边距
    textAlign: "center",
    borderBottom: "1px solid #ddd",
    backgroundColor: "#f5f5f5", // 添加背景色
  });

  const courseTitle = document.createElement("h3");
  courseTitle.textContent = `${courseInfo.课程名称} - ${courseInfo.教师名称}`;
  setStyles(courseTitle, {
    margin: "0",
    color: "#333", // 调整颜色
  });

  const rating = document.createElement("div");
  rating.innerHTML = `评分: ${generateStarRating(courseInfo.课程评分)}`;
  setStyles(rating, {
    marginTop: "10px", // 调整间距
    color: "#ff9800", // 调整颜色
  });

  header.appendChild(courseTitle);
  header.appendChild(rating);

  // 5. 评论区（可滚动）
  const commentsContainer = document.createElement("div");
  setStyles(commentsContainer, {
    flex: "1",
    overflowY: "auto",
    padding: "20px", // 调整内边距
    position: "relative",
  });

  const loadingIndicator = document.createElement("div");
  loadingIndicator.textContent = "加载中...";
  setStyles(loadingIndicator, {
    textAlign: "center",
    padding: "10px",
    display: "none",
    color: "#999", // 调整颜色
  });

  const noMoreComments = document.createElement("div");
  noMoreComments.textContent = "没有更多评论了";
  setStyles(noMoreComments, {
    textAlign: "center",
    padding: "10px",
    display: "none",
    color: "#999", // 调整颜色
  });

  commentsContainer.appendChild(loadingIndicator);
  commentsContainer.appendChild(noMoreComments);

  // 6. 底部输入框 + 评分选择 + 发送按钮
  const inputContainer = document.createElement("div");
  setStyles(inputContainer, {
    padding: "20px", // 调整内边距
    borderTop: "1px solid #ddd",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f5f5f5", // 添加背景色
  });

  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.placeholder = "输入评论...";
  setStyles(inputField, {
    flex: "2",
    padding: "10px", // 调整内边距
    marginRight: "10px",
    borderRadius: "5px", // 添加圆角
    border: "1px solid #ddd", // 添加边框
  });

  // 评分选择
  const ratingContainer = document.createElement("div");
  setStyles(ratingContainer, {
    display: "flex",
    alignItems: "center",
    marginRight: "10px",
  });

  for (let i = 1; i <= 5; i++) {
    const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    star.setAttribute("width", "24");
    star.setAttribute("height", "24");
    star.setAttribute("viewBox", "0 0 24 24");
    star.setAttribute("fill", "none");
    star.setAttribute("stroke", "currentColor");
    star.setAttribute("stroke-width", "2");
    star.setAttribute("stroke-linecap", "round");
    star.setAttribute("stroke-linejoin", "round");
    star.innerHTML =
      '<polygon points="12 2 15 8.5 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 8.5 12 2"></polygon>';
    star.style.cursor = "pointer";
    star.dataset.value = i;
    star.onclick = () => {
      ratingValue = i;
      updateStarRating(ratingContainer, i);
    };
    ratingContainer.appendChild(star);
  }

  let ratingValue = 3;
  updateStarRating(ratingContainer, ratingValue);// 初始化星级评分显示

  function updateStarRating(container, value) {
    requestAnimationFrame(() => {
      Array.from(container.children).forEach((star, index) => {
        star.style.fill = index < value ? "#ff9800" : "none";
        star.style.stroke = index < value ? "#ff9800" : "currentColor";
      });
    });
  }

  inputContainer.appendChild(ratingContainer);

  const sendButton = document.createElement("button");
  sendButton.textContent = "发送";
  setStyles(sendButton, {
    padding: "10px 20px", // 调整内边距
    cursor: "pointer",
    backgroundColor: "#4CAF50", // 调整背景色
    color: "#fff", // 调整文字颜色
    border: "none", // 去掉边框
    borderRadius: "5px", // 添加圆角
  });
  sendButton.onclick = () => {
    const content = inputField.value.trim();
    if (content === "" || ratingValue === 0) {
      alert("评论和评分不能为空！");
      return;
    }
    submitComment(content, ratingValue, courseInfo);
    inputField.value = ""; // 清空输入框
    updateStarRating(ratingContainer, 0); // 重置星级评分
    ratingValue = 0;
  };

  inputContainer.appendChild(inputField);
  inputContainer.appendChild(sendButton);

  // 7. 组合元素
  popup.appendChild(closeButton);
  popup.appendChild(header);
  popup.appendChild(commentsContainer);
  popup.appendChild(inputContainer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // 显示弹窗
  setTimeout(() => {
    overlay.style.opacity = "1";
    popup.style.opacity = "1";
    popup.style.transform = "translateX(-50%) scale(1)";
  }, 10);

  // 8. 动态加载评论逻辑
  let page = 1;
  let isLoading = false;
  let hasMoreComments = true;

  async function loadMoreComments() {
    if (isLoading || !hasMoreComments) return;

    isLoading = true;
    loadingIndicator.style.display = "block";

    try {
      const newComments = await fetchCommentsFromServer(courseInfo, page);
      if (newComments.length === 0) {
        hasMoreComments = false;
        noMoreComments.style.display = "block";
      } else {
        page++;
        newComments.forEach((comment) =>
          commentsContainer.insertBefore(
            createCommentElement(comment),
            loadingIndicator
          )
        );
      }
    } catch (error) {
      console.error("加载评论失败:", error);
    } finally {
      isLoading = false;
      loadingIndicator.style.display = "none";
    }
  }
  commentsContainer.onscroll = function () {
    if (
      commentsContainer.scrollTop + commentsContainer.clientHeight >=
      commentsContainer.scrollHeight - 5
    ) {
      loadMoreComments();
    }
  };
  loadMoreComments(); // 初次加载评论
}

// 生成星级评分的 HTML
function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 > 0 ? 1 : 0;
  return "⭐".repeat(fullStars) + (halfStar ? "✨" : "") + ` - ${rating}`;
}

// 生成评论 DOM
function createCommentElement(comment) {
  const commentBox = document.createElement("div");
  setStyles(commentBox, {
    padding: "10px",
    borderBottom: "1px solid #ddd",
  });

  const userInfo = document.createElement("p");
  userInfo.innerHTML = `<strong>${comment.user}</strong> - ${generateStarRating(
    comment.rating
  )}`;
  
  const commentText = document.createElement("p");
  commentText.textContent = comment.content;

  const commentFooter = document.createElement("div");
  setStyles(commentFooter, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  });

  const time = document.createElement("span");
  time.textContent = comment.time;

  const likeDislike = document.createElement("div");
  setStyles(likeDislike, {
    display: "flex",
    alignItems: "center",
  });

  const likeButton = document.createElement("span");
  likeButton.innerHTML = `👍 ${comment.likes}`;
  setStyles(likeButton, {
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "5px",
    backgroundColor: "#e0f7fa",
    marginRight: "10px",
  });
  likeButton.onclick = async function () {
    const isSuc = await like(comment);
    if (!isSuc) {
      alert("点赞失败！");
      return;
    }
    likeButton.textContent = `👍 ${++comment.likes}`;
  };

  const dislikeButton = document.createElement("span");
  dislikeButton.innerHTML = `👎 ${comment.dislikes}`;
  setStyles(dislikeButton, {
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "5px",
    backgroundColor: "#ffebee",
  });
  dislikeButton.onclick = async function () {
    const isSuc = await dislike(comment);
    if (!isSuc) {
      alert("点踩失败！");
      return;
    }
    dislikeButton.textContent = `👎 ${++comment.dislikes}`;
  };

  likeDislike.appendChild(likeButton);
  likeDislike.appendChild(dislikeButton);

  commentFooter.appendChild(time);
  commentFooter.appendChild(likeDislike);

  commentBox.appendChild(userInfo);
  commentBox.appendChild(commentText);
  commentBox.appendChild(commentFooter);

  return commentBox;
}

// 设置样式的辅助函数
function setStyles(element, styles) {
  for (const property in styles) {
    element.style[property] = styles[property];
  }
}
