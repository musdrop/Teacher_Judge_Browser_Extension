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
  //返回本次评论的id
  let result = await postComment(lessonInfo, content, rating);
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
  let comments = await getLessonComments(courseInfo.课程ID, page);
  /*    {
      "commentId": 5,
      "courseId": "123",
      "commentContent": "4",
        "score": 4,
      "commentTime": "4",
      "likes": 4,
      "dislikes": 4
    }将该格式转换为返回的格式
     */
  return comments.map((comment) => ({
    user: "NUAAer" + comment.commentId,
    content: comment.commentContent,
    rating: comment.score,
    time: comment.commentTime,
    likes: comment.likes,
    dislikes: comment.dislikes,
    commentId: comment.commentId,
  }));
}
