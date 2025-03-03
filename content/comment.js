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
  // 1. 创建弹出窗口的遮罩层
  const overlay = document.createElement("div");
  setStyles(overlay, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: "1000"
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
    boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  });

  // 3. 关闭按钮
  const closeButton = document.createElement("span");
  closeButton.innerHTML = "&times;";
  setStyles(closeButton, {
    position: "absolute",
    top: "10px",
    right: "15px",
    fontSize: "24px",
    cursor: "pointer"
  });
  closeButton.onclick = () => document.body.removeChild(overlay);

  // 4. 顶部课程信息（评分+教师名称）
  const header = document.createElement("div");
  setStyles(header, {
    padding: "10px",
    textAlign: "center",
    borderBottom: "1px solid #ddd"
  });

  const courseTitle = document.createElement("h3");
  courseTitle.textContent = `${courseInfo.课程名称} - ${courseInfo.教师名称}`;

  const rating = document.createElement("div");
  rating.innerHTML = `评分: ${generateStarRating(courseInfo.课程评分)}`;

  header.appendChild(courseTitle);
  header.appendChild(rating);

  // 5. 评论区（可滚动）
  const commentsContainer = document.createElement("div");
  setStyles(commentsContainer, {
    flex: "1",
    overflowY: "auto",
    padding: "10px",
    position: "relative"
  });

  const loadingIndicator = document.createElement("div");
  loadingIndicator.textContent = "加载中...";
  setStyles(loadingIndicator, {
    textAlign: "center",
    padding: "10px",
    display: "none"
  });

  const noMoreComments = document.createElement("div");
  noMoreComments.textContent = "没有更多评论了";
  setStyles(noMoreComments, {
    textAlign: "center",
    padding: "10px",
    display: "none"
  });

  commentsContainer.appendChild(loadingIndicator);
  commentsContainer.appendChild(noMoreComments);

  // 6. 底部输入框 + 评分选择 + 发送按钮
  const inputContainer = document.createElement("div");
  setStyles(inputContainer, {
    padding: "10px",
    borderTop: "1px solid #ddd",
    display: "flex",
    alignItems: "center"
  });

  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.placeholder = "输入评论...";
  setStyles(inputField, {
    flex: "2",
    padding: "5px",
    marginRight: "10px"
  });

  // 评分选择
  const ratingSelect = document.createElement("select");
  setStyles(ratingSelect, {
    marginRight: "10px",
    padding: "5px"
  });
  for (let i = 1; i <= 5; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i + "分";
    ratingSelect.appendChild(option);
  }

  const sendButton = document.createElement("button");
  sendButton.textContent = "发送";
  setStyles(sendButton, {
    padding: "5px 10px",
    cursor: "pointer"
  });
  sendButton.onclick = () => {
    const content = inputField.value.trim();
    const ratingValue = parseInt(ratingSelect.value);
    if (content === "") {
      alert("评论不能为空！");
      return;
    }
    submitComment(content, ratingValue, courseInfo);
    inputField.value = ""; // 清空输入框
  };

  inputContainer.appendChild(inputField);
  inputContainer.appendChild(ratingSelect);
  inputContainer.appendChild(sendButton);

  // 7. 组合元素
  popup.appendChild(closeButton);
  popup.appendChild(header);
  popup.appendChild(commentsContainer);
  popup.appendChild(inputContainer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

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
    borderBottom: "1px solid #ddd"
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
    alignItems: "center"
  });

  const time = document.createElement("span");
  time.textContent = comment.time;

  const likeDislike = document.createElement("div");
  likeDislike.innerHTML = `<span style="cursor:pointer;">👍 ${comment.likes}</span> <span style="margin-left:10px; cursor:pointer;">👎 ${comment.dislikes}</span>`;
  // 点赞和点踩的逻辑
  likeDislike.children[0].onclick = async function () {
    const isSuc = await like(comment);
    if (!isSuc) {
      alert("点赞失败！");
      return;
    }
    likeDislike.children[0].textContent = `👍 ${++comment.likes}`;
  };
  likeDislike.children[1].onclick = async function () {
    const isSuc = await dislike(comment);
    if (!isSuc) {
      alert("点踩失败！");
      return;
    }
    likeDislike.children[1].textContent = `👎 ${++comment.dislikes}`;
  };

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
