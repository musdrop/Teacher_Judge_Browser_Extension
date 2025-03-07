// ==UserScript==
// @name         NUAA教师评价助手
// @namespace    oo
// @version      1.0
// @description  让NUAAer的选课更加科学
// @author       oo
// @include      *://aao-eas.nuaa.edu.cn/eams/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

// /api/usc.js
// 生成新的 UUID
function newUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

async function localStorageGet(key) {
    let uuid = await GM.getValue(key, null);
    if(!uuid) {
        uuid = newUUID();
        saveUUID(uuid);
    }
    return uuid;
}
function localStorageSet(key_value) {
    //提取key和value
    let key = Object.keys(key_value)[0];
    let value = key_value[key];
    GM.setValue(key, value);
}
// /content/tools.js
// 配置评论排序方式
if (!localStorage.getItem('tj_orderBy')) {
    localStorage.setItem('tj_orderBy', 'time')
}

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

// 获取 UUID
async function getUUID() {
    return await localStorageGet('tj_uuid');
}

function saveUUID(uuid) {
    localStorageSet({ tj_uuid: uuid });
}

function updateUUID() {
    let newID = newUUID();
    saveUUID(newID);
    return newID;
}
// /content/request.js
const API_BASE_URL = "https://tj.musdrop.top/api"; // Workers 部署地址

// 通用请求封装
const apiRequest = async (endpoint, method = "GET", body = null) => {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.success) throw new Error(data.result);
    return data.result;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    return null;
  }
};

// 1. 获取课程评分
const getLessonScore = async (courseName, teacherName) =>
  await apiRequest(`/course`, "POST", { courseName, teacherName });

// 新增：批量获取课程评分
const getLessonScores = async (courseNames, teacherNames) =>
  await apiRequest(`/course`, "POST", { courseNames, teacherNames });

// 2. 点赞评论
const likeComment = async (commentId) =>
  await apiRequest(`/comment/${commentId}/like`, "POST");

// 3. 点踩评论
const dislikeComment = async (commentId) =>
  await apiRequest(`/comment/${commentId}/dislike`, "POST");

// 4. 按时间排序分页获取课程评论（每页5条）
const getLessonComments = async (courseId, page = 1, uuid) =>
  await apiRequest(`/comments/${courseId}/${page}/${uuid}`);

// 新增：按点赞数排序获取课程评论（每页5条）
const getLessonCommentsOrderByLikes = async (courseId, page = 1, uuid) =>
  await apiRequest(`/comments/likes/${courseId}/${page}/${uuid}`);

// 5. 发布课程评论
const postComment = async (lessonInfo, commentContent, score, uuid) =>
  await apiRequest(`/commentpost`, "POST", {
    ...lessonInfo,
    commentContent,
    score,
    uuid
  });

// /content/data.js
async function getScores(courseInfos) {
  const courseNames = courseInfos.map((info) => info.课程名称);
  const teacherNames = courseInfos.map((info) => info.教师名称);
  let results = await getLessonScores(courseNames, teacherNames);
  return results;
}

async function getScore(courseInfo) {
  let result = await getLessonScore(courseInfo.课程名称, courseInfo.教师名称);
  return result;
}

async function like(comment) {
  let result = await likeComment(comment.commentId);
  if (result) {
    return true;
  } else {
    return false;
  }
}

async function dislike(comment) {
  let result = await dislikeComment(comment.commentId);
  if (result) {
    return true;
  } else {
    return false;
  }
}

// 发送评论
async function submitComment(
  content,
  rating,
  courseInfo,
  handleCommentSubmitSuccess
) {
  console.log("提交评论:", { content, rating, courseInfo });
  //lessonId, courseCode, courseName, teacherName
  let lessonInfo = {
    courseId: courseInfo.课程ID,
    courseName: courseInfo.课程名称,
    teacherName: courseInfo.教师名称,
  };
  // 显示加载视图
  toggleLoadingOverlay(true);
  //获取uuid
  const uuid = await getUUID();
  //返回本次评论的id
  let result = await postComment(lessonInfo, content, rating, uuid);
  // 隐藏加载视图
  toggleLoadingOverlay(false);
  if (result) {
    // 提交成功
    showToast("评论发布成功", "notice");
    // 处理评论发布成功
    handleCommentSubmitSuccess();
  } else {
    // 提交失败
    showToast("评论发布失败", "error");
  }
}

// 获取评论
async function fetchCommentsFromServer(courseInfo, page) {
  const l_uuid = await getUUID();
  let comments;
  if (localStorage.getItem("tj_orderBy") === "likes") {
    comments = await getLessonCommentsOrderByLikes(
      courseInfo.课程ID,
      page,
      l_uuid
    );
  } else {
    comments = await getLessonComments(courseInfo.课程ID, page, l_uuid);
  }
  // 转换评论格式，以便于展示
  return comments.map((comment) => {
    let user = "NUAAer" + comment.commentId;
    if (comment.uuid === l_uuid) {
      user = "我";
    }
    return {
      user: user,
      content: comment.commentContent,
      rating: comment.score,
      time: comment.commentTime,
      likes: comment.likes,
      dislikes: comment.dislikes,
      commentId: comment.commentId,
      visible: comment.visible,
      uuid: comment.uuid,
    };
  });
}

// /content/comment.js
// 评论窗口
function evaluateCourseWindow(courseInfo, handleInfoChange) {
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
  // 创建加载时遮罩
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "loading";
  loadingOverlay.className = "loading";
  loadingOverlay.textContent = "加载中...";
  setStyles(loadingOverlay, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: "24px",
    display: "none",
    zIndex: "9999", // 确保加载位于最顶层
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
    }, 300);
    // 恢复页面滚动
    document.body.style.overflow = "auto";
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

  // 添加排序控件
  const sortContainer = document.createElement("div");
  setStyles(sortContainer, {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px",
  });

  const sortByTimeButton = document.createElement("button");
  sortByTimeButton.textContent = "按时间排序";
  setStyles(sortByTimeButton, {
    padding: "10px 20px",
    margin: "0 5px",
    cursor: "pointer",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
  });

  const sortByLikesButton = document.createElement("button");
  sortByLikesButton.textContent = "按点赞数排序";
  setStyles(sortByLikesButton, {
    padding: "10px 20px",
    margin: "0 5px",
    cursor: "pointer",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
  });
  if (localStorage.getItem("tj_orderBy") === "likes") {
    setStyles(sortByLikesButton, { backgroundColor: "#4CAF50" }); // 绿
    setStyles(sortByTimeButton, { backgroundColor: "#f44336" }); // 红
  }
  else {
    setStyles(sortByTimeButton, { backgroundColor: "#4CAF50" }); // 绿
    setStyles(sortByLikesButton, { backgroundColor: "#f44336" }); // 红
  }

  sortByTimeButton.onclick = () => {
    localStorage.setItem("tj_orderBy", "time");
    closeButton.click();
    evaluateCourseWindow(courseInfo, handleInfoChange);
  };

  sortByLikesButton.onclick = () => {
    localStorage.setItem("tj_orderBy", "likes");
    closeButton.click();
    evaluateCourseWindow(courseInfo, handleInfoChange);
  };

  sortContainer.appendChild(sortByTimeButton);
  sortContainer.appendChild(sortByLikesButton);
  commentsContainer.appendChild(sortContainer);

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

  let ratingValue = 0;

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
      showToast("评论和评分不能为空", "error");
      return;
    }
    const handleCommentSubmitSuccess = async () => {
      // 关闭弹窗
      closeButton.click();
      // 更新评分
      await handleInfoChange();
      // 重载评论窗口
      evaluateCourseWindow(courseInfo, handleInfoChange);
    };
    submitComment(
      content,
      ratingValue,
      courseInfo,
      handleCommentSubmitSuccess // 处理评论发布成功
    );
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
  overlay.appendChild(loadingOverlay);
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
    position: "relative", // 为角标预留位置
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
    toggleLoadingOverlay(true);
    const isSuc = await like(comment);
    toggleLoadingOverlay(false);
    if (!isSuc) {
      showToast("点赞失败", "error");
      return;
    }
    showToast("点赞成功", "notice");
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
    toggleLoadingOverlay(true);
    const isSuc = await dislike(comment);
    toggleLoadingOverlay(false);
    if (!isSuc) {
      showToast("点踩失败", "error");
      return;
    }
    showToast("点踩成功", "notice");
    dislikeButton.textContent = `👎 ${++comment.dislikes}`;
  };

  // 添加角标
  const badge = document.createElement("span");
  setStyles(badge, {
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: "5px 10px",
    borderRadius: "5px",
    color: "#fff",
    display: "none", // 默认隐藏
  });

  // 根据条件显示不同的角标
  if (comment.visible === "pending") {
    badge.textContent = "审核中";
    setStyles(badge, {
      backgroundColor: "#2196F3", // 蓝色风格
      display: "inline-block",
    });
  } else if (comment.visible === "refused") {
    badge.textContent = "审核未通过";
    setStyles(badge, {
      backgroundColor: "#f44336", // 红色风格
      display: "inline-block",
    });
  }

  commentBox.appendChild(badge);
  likeDislike.appendChild(likeButton);
  likeDislike.appendChild(dislikeButton);

  commentFooter.appendChild(time);
  commentFooter.appendChild(likeDislike);

  commentBox.appendChild(userInfo);
  commentBox.appendChild(commentText);
  commentBox.appendChild(commentFooter);

  return commentBox;
}

// 显示或隐藏加载遮罩层
function toggleLoadingOverlay(show) {
  const overlay = document.getElementById("loading");
  if (show) {
    overlay.style.display = "flex";
  } else {
    overlay.style.display = "none";
  }
}

// /content/control.js
// 从单元格中提取课程信息
function extractCourseInfo(
  cells,
  lessonIdIndex,
  courseNameIndex,
  teacherNameIndex
) {
  if (
    !cells ||
    cells.length <= Math.max(lessonIdIndex, courseNameIndex, teacherNameIndex)
  ) {
    console.error("单元格数据不足，无法解析课程信息");
    return null;
  }

  const getTextContent = (index) => cells[index]?.textContent.trim() || "未知";

  // 获取课程序号
  let lessonId = getTextContent(lessonIdIndex);

  // 提取课程代码
  let courseCode = lessonId.split(".")[0]; // 以 `.` 分割，并取第一部分

  // 获取课程名称
  let courseName = getTextContent(courseNameIndex);

  // 获取教师名称
  let teacherName =
    teacherNameIndex === -1 ? "未知" : getTextContent(teacherNameIndex);

  // 返回课程信息对象
  return {
    课程序号: lessonId,
    课程代码: courseCode,
    课程名称: courseName,
    教师名称: teacherName,
    课程评分: null, // 评分字段暂时为空
    课程ID: -1, // 课程ID暂时为空
  };
}

// 处理表格
async function addScoreAndEvaluateColumn(thead, tbody, update) {
  if (!thead || !tbody) {
    console.error("thead 或 tbody 为空，无法继续执行");
    return;
  }

  // 1. 在 <thead> 里找到 "课程名称" 所在列索引，并在其后插入 "评分" 列
  const trs = thead.querySelectorAll("tr");
  // 如果tr不止一个，使用第二个
  let tr = trs.length > 1 ? trs[1] : trs[0];
  // 处理全校开课查询界面等需要插入搜索栏的特殊情况
  const insertSearchBar = (index) => {
    // 无顶部搜索栏直接返回
    if (trs.length <= 1) return;
    // 是选课界面index+1（搜索栏相比表格多了一个查询按钮列）
    // 判断url中是否含"stdElectCourse"，含有则为选课界面
    let href = window.location.href;
    if (href.includes("stdElectCourse")) {
      index = index + 1;
    }
    // 搜索行，若干个输入框所在行
    let fbar = trs[0];
    const fcells = fbar.children;
    const fcell = document.createElement("th");
    fcell.title = "课程评分";
    setStyles(fcell, {
      width: "120px",
      padding: "3px",
    });
    const fdiv = document.createElement("div");
    setStyles(fdiv, {
      marginRight: "6px",
    });
    const finput = document.createElement("input");
    finput.type = "text";
    finput.name = "lesson.course.score";
    finput.maxLength = "100";
    finput.value = "";
    setStyles(finput, {
      width: "100%",
    });
    // 禁用输入
    finput.disabled = true;
    fdiv.appendChild(finput);
    fcell.appendChild(fdiv);
    fbar.insertBefore(fcell, fcells[index]);
  };

  let headerCells = tr.children;
  let courseNameIndex = -1;
  let lessonIdIndex = -1;
  let teacherNameIndex = -1;
  let scoreInedx = 100;

  for (let i = 0; i < headerCells.length; i++) {
    const textContent = headerCells[i].textContent.trim();
    if (textContent === "课程序号") {
      lessonIdIndex = i;
    } else if (textContent.includes("教师")) {
      teacherNameIndex = i;
    } else if (textContent === "课程名称") {
      courseNameIndex = i;
    } else if (textContent === "评分") {
      scoreInedx = i;
    }
  }
  // 修正索引
  lessonIdIndex = lessonIdIndex <= scoreInedx ? lessonIdIndex : lessonIdIndex - 1;
  teacherNameIndex = teacherNameIndex <= scoreInedx ? teacherNameIndex : teacherNameIndex - 1;
  courseNameIndex = courseNameIndex <= scoreInedx ? courseNameIndex : courseNameIndex - 1;

  if (courseNameIndex === -1) {
    console.error("未找到 '课程名称' 列");
    return;
  }

  // 在 "课程名称" 后面插入 "评分" 列及其搜索栏
  // 如果为 body 局部更新，则不插入
  if (!update) {
    insertSearchBar(courseNameIndex + 1);
    let scoreHeader = document.createElement("th");
    scoreHeader.textContent = "评分";
    setStyles(scoreHeader, {
      textAlign: "center",
      width: "120px",
    });
    tr.insertBefore(scoreHeader, headerCells[courseNameIndex + 1]);
  }

  // 2. 处理 <tbody> 中的所有课程项
  let rows = tbody.querySelectorAll("tr");

  // 插入评分单元格方法
  const insertEvaluateColumn = (row, cells, courseInfo) => {

    // 创建评分单元格
    let scoreCell = document.createElement("td");
    scoreCell.style.textAlign = "center";

    // 填充评分
    let scoreSpan = document.createElement("span");
    // 如果没有找到教师名称，说明是未中选课程界面
    if (courseInfo.教师名称 === "未知") {
      scoreSpan.textContent = "不支持该页面";
      scoreCell.appendChild(scoreSpan);
      row.insertBefore(scoreCell, cells[courseNameIndex + 1]);
      return;
    }
    scoreSpan.textContent = "加载中";
    scoreCell.appendChild(scoreSpan);

    // 创建评价按钮
    let evaluateButton = document.createElement("a");
    evaluateButton.textContent = "评价";
    evaluateButton.href = "javascript:void(0)";
    evaluateButton.className = "lessonListOperator"; // 使样式与补选/重修按钮一致
    evaluateButton.style.marginLeft = "10px"; // 评分和按钮之间的间隙

    // 评论信息变更处理函数，目前仅处理评论窗口内用户发布评论后导致的评分变动
    const handleInfoChange = async () => {
      try {
        let res = await getScore(courseInfo);
        courseInfo.课程ID = res.courseId;
        score =
          res.score === "N/A" ? "暂无评分" : parseFloat(res.score).toFixed(1);
        courseInfo.课程评分 = score;
        scoreSpan.textContent = score;
      } catch (error) {
        console.error("获取评分失败：", error);
        scoreSpan.textContent = "获取失败";
      }
    };
    evaluateButton.onclick = () =>
      evaluateCourseWindow(courseInfo, handleInfoChange); // 绑定函数

    scoreCell.appendChild(evaluateButton);
    row.insertBefore(scoreCell, cells[courseNameIndex + 1]); // 插入到课程名称之后

    // 用于后续填入评分
    return scoreSpan;
  };

  // 提取所有课程信息并插入评分单元格
  let scoreSpans_courseInfos = Array.from(rows).map((row) => {
    let cells = row.children;
    if (cells.length < courseNameIndex + 1) return; // 避免越界错误

    // 如果已有class，则不再处理，避免重复添加评分单元格
    if (row.classList.contains("course-item")) return;

    // 给课程项添加 class
    row.classList.add("course-item");

    // 提取课程信息
    let courseInfo = extractCourseInfo(
      cells,
      lessonIdIndex,
      courseNameIndex,
      teacherNameIndex
    );

    // 插入评分单元格
    let scoreSpan = insertEvaluateColumn(row, cells, courseInfo);
    return { scoreSpan, courseInfo };
  });

  // 如果没有获取到相关信息直接返回
  if (!scoreSpans_courseInfos || scoreSpans_courseInfos[0] === undefined) {
    return;
  }

  // 分离评分span和课程信息
  let scoreSpans = scoreSpans_courseInfos.map((item) => item.scoreSpan);
  let courseInfos = scoreSpans_courseInfos.map((item) => item.courseInfo);


  // 批量获取评分
  let scores = await getScores(courseInfos);

  // 填充评分
  for (let i = 0; i < scoreSpans.length; i++) {
    courseInfos[i].课程ID = scores[i].courseId;
    score =
      scores[i].score === "N/A" ? "暂无评分" : parseFloat(scores[i].score).toFixed(1);
    courseInfos[i].课程评分 = score;
    scoreSpans[i].textContent = score;
  }

}

// /content/check.js
console.log("check.js loaded");
// 检测课程详情界面
function CheckCoursesTable() {
  console.log("CheckCoursesTable_start");
  let tableEs = getCoursesTable_1();

  if(!tableEs) {
    tableEs = getCoursesTable_2();
  };

  if (!tableEs) {
    console.log("未找到课程表格");
    return;
  };

  const { thead, tbody } = tableEs;
  
  addScoreAndEvaluateColumn(thead, tbody, false);

  // 处理补选/重修界面搜索，翻页等操作只更新tbody内部节点而导致的不重载的问题
  // 方法：监听tbody的变化，重新加载tbody
  const debouncedTbodyObserverCallback = debounce(tbodyObserverCallback(thead, tbody), 500);
  const tbodyObserver = new MutationObserver(debouncedTbodyObserverCallback);
  tbodyObserver.observe(tbody, config)


  console.log("CheckCoursesTable_end");
}

// 获取课程表格的thead和tbody元素，适配常规情况
function getCoursesTable_1() {
  // 先定位 id 为 mainTable 的 table
  let mtable = document.querySelector("#mainTable");
  if (!mtable) {
    console.log("未找到 id 为 mainTable 的 table");
    return null;
  }

  // 再定位 class 为 grid 的 div
  let div = mtable.querySelector(".grid");
  if (!div) {
    console.log("未找到 class 为 grid 的 div");
    return null;
  }

  // 从 div 中获取 class 为 gridhead 的 <thead> 节点
  let thead = div.querySelector("thead.gridhead");
  if (!thead) {
    console.log("未找到 <thead> 节点");
    return null;
  }

  // 如果 <thead> 已经有 class，则不再处理
  if (thead.classList.contains("comment-thead")) {
    console.log("已经处理过 <thead> 节点");
    return null;
  }

  // 给 thead 添加 class
  thead.classList.add("comment-thead");

  // 获取 <thead> 所属的 <table>
  let table = thead.closest("table");
  if (!table) {
    console.log("未找到包含 <thead> 的 <table>");
    return null;
  }

  // 在该 <table> 内查找 <tbody> 节点
  let tbody = table.querySelector("tbody");
  if (!tbody) {
    console.log("未找到 <tbody> 节点");
    return null;
  }

  console.log("成功获取课程表格的 thead 和 tbody");
  return { thead, tbody };
}

// 获取课程表格的thead和tbody元素，适配学期选课界面和教务系统页面刷新后的异常情况
function getCoursesTable_2() {
  // 先定位 class 为 grid 的 div
  let div = document.querySelector(".grid");
  if (!div) {
    console.log("未找到 class 为 grid 的 div");
    return null;
  }

  // 从 div 中获取 class 为 gridtable 的 <table> 节点
  let table = div.querySelector(".gridtable");
  if (!table) {
    console.log("未找到 class 为 gridtable 的 <table> 节点");
    // 从 div 中获取第一个 直接子<table> 节点
    const tables = div.querySelectorAll("table")
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].parentNode == div) {
        table = tables[i];
        break;
      }
    }
  }
  if(!table) {
    console.log("未找到 <table> 节点");
    return null;
  }

  // 从 table 中获取 <thead> 节点
  let thead = table.querySelector("thead");
  if (!thead) {
    console.log("未找到 <thead> 节点");
    return null;
  }
  // 如果 <thead> 已经有 class，则不再处理
  if (thead.classList.contains("comment-thead")) {
    console.log("已经处理过 <thead> 节点");
    return null;
  }

  // 给 thead 添加 class
  thead.classList.add("comment-thead");

  // 在该 <table> 内查找 <tbody> 节点
  let tbody = table.querySelector("tbody");

  if (!tbody) {
    console.log("未找到 <tbody> 节点");
    return null;
  }

  console.log("成功获取课程表格的 thead 和 tbody");
  return { thead, tbody };
}

// 防抖函数：在等待时间内如果再次调用，则重新计时
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 页面观察者的回调函数
const pageObserverCallback = (mutationsList, observer) => {
    CheckCoursesTable();
};

// 表格观察者的回调函数
const tbodyObserverCallback = (thead, tbody) => (mutationsList, observer) => {
  addScoreAndEvaluateColumn(thead, tbody, true);
};

// 创建防抖后的回调函数，设置等待时间为 500 毫秒
const debouncedPageObserverCallback = debounce(pageObserverCallback, 500);


// 创建 MutationObserver 实例并传入防抖后的回调函数
const pageObserver = new MutationObserver(debouncedPageObserverCallback);

// 配置观察选项
const config = { childList: true, subtree: true };

// 开始观察目标节点
pageObserver.observe(document.body, config);

// Popup
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
// 添加菜单项
GM_registerMenuCommand('配置设置', createPopup);
