const API_BASE_URL = "https://tj.musdrop.top/api"; // Workers 部署地址

// 通用请求封装
async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (!data.success) throw new Error(data.result);
    return data.result;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    return null;
  }
}

// 1. 获取课程评分
async function getLessonScore(lessonId) {
  return await apiRequest(`/lesson/${lessonId}`);
}

// 2. 点赞评论
async function likeComment(commentId) {
  return await apiRequest(`/comment/${commentId}/like`, "POST");
}

// 3. 点踩评论
async function dislikeComment(commentId) {
  return await apiRequest(`/comment/${commentId}/dislike`, "POST");
}

// 4. 分页获取课程评论（每页5条）
async function getLessonComments(lessonId, page = 1) {
  return await apiRequest(`/comments/${lessonId}/${page}`);
}

// 5. 发布课程评论
async function postComment(lessonInfo, commentContent, score) {
  return await apiRequest(`/commentpost`, "POST", {
    ...lessonInfo,
    commentContent,
    score,
  });
}