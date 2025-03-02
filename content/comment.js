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
  let overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "1000";

  // 2. 创建正方形窗口
  let popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.width = "70vh"; // 正方形窗口
  popup.style.height = "70vh";
  popup.style.top = "10vh"; // 上下留出间距
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.backgroundColor = "#fff";
  popup.style.borderRadius = "10px";
  popup.style.boxShadow = "0px 4px 10px rgba(0,0,0,0.2)";
  popup.style.display = "flex";
  popup.style.flexDirection = "column";
  popup.style.overflow = "hidden";

  // 3. 关闭按钮
  let closeButton = document.createElement("span");
  closeButton.innerHTML = "&times;";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "15px";
  closeButton.style.fontSize = "24px";
  closeButton.style.cursor = "pointer";
  closeButton.onclick = () => document.body.removeChild(overlay);

  // 4. 顶部课程信息（评分+教师名称）
  let header = document.createElement("div");
  header.style.padding = "10px";
  header.style.textAlign = "center";
  header.style.borderBottom = "1px solid #ddd";

  let courseTitle = document.createElement("h3");
  courseTitle.textContent = `${courseInfo.课程名称} - ${courseInfo.教师名称}`;

  let rating = document.createElement("div");
  rating.innerHTML = `评分: ${generateStarRating(courseInfo.课程评分)}`;

  header.appendChild(courseTitle);
  header.appendChild(rating);

  // 5. 评论区（可滚动）
  let commentsContainer = document.createElement("div");
  commentsContainer.style.flex = "1";
  commentsContainer.style.overflowY = "auto";
  commentsContainer.style.padding = "10px";
  commentsContainer.style.position = "relative";

  let loadingIndicator = document.createElement("div");
  loadingIndicator.textContent = "加载中...";
  loadingIndicator.style.textAlign = "center";
  loadingIndicator.style.padding = "10px";
  loadingIndicator.style.display = "none"; // 初始隐藏

  let noMoreComments = document.createElement("div");
  noMoreComments.textContent = "没有更多评论了";
  noMoreComments.style.textAlign = "center";
  noMoreComments.style.padding = "10px";
  noMoreComments.style.display = "none"; // 初始隐藏

  commentsContainer.appendChild(loadingIndicator);
  commentsContainer.appendChild(noMoreComments);

  // 6. 底部输入框 + 评分选择 + 发送按钮
  let inputContainer = document.createElement("div");
  inputContainer.style.padding = "10px";
  inputContainer.style.borderTop = "1px solid #ddd";
  inputContainer.style.display = "flex";
  inputContainer.style.alignItems = "center";

  let inputField = document.createElement("input");
  inputField.type = "text";
  inputField.placeholder = "输入评论...";
  inputField.style.flex = "2";
  inputField.style.padding = "5px";
  inputField.style.marginRight = "10px";

  // 评分选择
  let ratingSelect = document.createElement("select");
  ratingSelect.style.marginRight = "10px";
  ratingSelect.style.padding = "5px";
  for (let i = 1; i <= 5; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.textContent = i + "分";
    ratingSelect.appendChild(option);
  }

  let sendButton = document.createElement("button");
  sendButton.textContent = "发送";
  sendButton.style.padding = "5px 10px";
  sendButton.style.cursor = "pointer";
  sendButton.onclick = () => {
    let content = inputField.value.trim();
    let ratingValue = parseInt(ratingSelect.value);
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
      let newComments = await fetchCommentsFromServer(courseInfo, page);
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
  let fullStars = Math.floor(rating);
  let halfStar = rating % 1 > 0 ? 1 : 0;
  return "⭐".repeat(fullStars) + (halfStar ? "✨" : "") + ` - ${rating}`;
}

// 生成评论 DOM
function createCommentElement(comment) {
  let commentBox = document.createElement("div");
  commentBox.style.padding = "10px";
  commentBox.style.borderBottom = "1px solid #ddd";

  let userInfo = document.createElement("p");
  userInfo.innerHTML = `<strong>${comment.user}</strong> - ${generateStarRating(
    comment.rating
  )}`;

  let commentText = document.createElement("p");
  commentText.textContent = comment.content;

  let commentFooter = document.createElement("div");
  commentFooter.style.display = "flex";
  commentFooter.style.justifyContent = "space-between";
  commentFooter.style.alignItems = "center";

  let time = document.createElement("span");
  time.textContent = comment.time;

  let likeDislike = document.createElement("div");
  likeDislike.innerHTML = `<span style="cursor:pointer;">👍 ${comment.likes}</span> <span style="margin-left:10px; cursor:pointer;">👎 ${comment.dislikes}</span>`;
  // 点赞和点踩的逻辑
  likeDislike.children[0].onclick = async function () {
    let isSuc = await like(comment);
    if (!isSuc) {
      alert("点赞失败！");
      return;
    }
    likeDislike.children[0].textContent = `👍 ${++comment.likes}`;
  };
  likeDislike.children[1].onclick = async function () {
    let isSuc = await dislike(comment);
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
