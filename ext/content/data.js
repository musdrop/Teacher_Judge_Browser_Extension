async function getScore(courseInfo) {
  let score = await getLessonScore(courseInfo.课程序号);
  return score;
}

async function like(comment) {
  let result = await likeComment(comment.id);
  if (result) {
    return true;
  } else {
    return false;
  }
}

async function dislike(comment) {
  let result = await dislikeComment(comment.id);
  if (result) {
    return true;
  } else {
    return false;
  }
}

// 发送评论
function submitComment(content, rating, courseInfo) {
  console.log("提交评论:", { content, rating, courseInfo });
  //lessonId, courseCode, courseName, teacherName
  let lessonInfo = {
    lessonId: courseInfo.课程序号,
    courseCode: courseInfo.课程代码,
    courseName: courseInfo.课程名称,
    teacherName: courseInfo.教师名称,
  };
  postComment(lessonInfo, content, rating);
}

// 模拟获取评论
async function fetchCommentsFromServer(courseInfo, page) {
  let comments = await getLessonComments(courseInfo.课程序号, page);
  /*    {
      "commentId": 5,
      "lessonId": "123",
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
    id: comment.commentId,
  }));
}
