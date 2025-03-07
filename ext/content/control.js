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
        const score =
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
