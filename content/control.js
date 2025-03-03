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
  let teacherName = teacherNameIndex === -1 ? "未知" : getTextContent(teacherNameIndex);

  // 返回课程信息对象
  return {
    课程序号: lessonId,
    课程代码: courseCode,
    课程名称: courseName,
    教师名称: teacherName,
    课程评分: null, // 评分字段暂时为空
  };
}

// 处理表格
async function addScoreAndEvaluateColumn(thead, tbody) {
  if (!thead || !tbody) {
    console.error("thead 或 tbody 为空，无法继续执行");
    return;
  }

  // 1. 在 <thead> 里找到 "课程名称" 所在列索引，并在其后插入 "评分" 列
  let tr = thead.querySelectorAll("tr");
  // 如果tr不止一个，使用第二个，处理全校开课查询界面特殊情况
  if (tr.length > 1) {
    let fbar = tr[0];
    tr = tr[1];
    //全校开课查询处理显示异常
    let fcells = fbar.children;
    //复制第4个元素在其后面
    let fcell = fcells[3].cloneNode(true);
    fbar.insertBefore(fcell, fcells[4]);
  } else {
    tr = tr[0];
  }

  let headerCells = tr.children;
  let courseNameIndex = -1;
  let lessonIdIndex = -1;
  let teacherNameIndex = -1;

  for (let i = 0; i < headerCells.length; i++) {
    const textContent = headerCells[i].textContent.trim();
    if (textContent === "课程序号") {
      lessonIdIndex = i;
    } else if (textContent.includes("教师")) {
      teacherNameIndex = i;
    } else if (textContent === "课程名称") {
      courseNameIndex = i;
    }
  }

  if (courseNameIndex === -1) {
    console.error("未找到 '课程名称' 列");
    return;
  }

  // 在 "课程名称" 后面插入 "评分" 列
  let scoreHeader = document.createElement("th");
  scoreHeader.textContent = "评分";
  scoreHeader.style.textAlign = "center";
  scoreHeader.style.width = "80px"; // 限制列宽
  tr.insertBefore(scoreHeader, headerCells[courseNameIndex + 1]);

  // 2. 处理 <tbody> 中的所有课程项
  let rows = tbody.querySelectorAll("tr");

  rows.forEach(async (row) => {
    let cells = row.children;

    if (cells.length < courseNameIndex + 1) return; // 避免越界错误

    // 提取课程信息对象
    let courseInfo = extractCourseInfo(
      cells,
      lessonIdIndex,
      courseNameIndex,
      teacherNameIndex
    );

    // 创建评分单元格（异步填充评分）
    let scoreCell = document.createElement("td");
    scoreCell.style.textAlign = "center";

    // 先填充“加载中...”提示
    let scoreSpan = document.createElement("span");
    scoreSpan.textContent = "加载中...";
    scoreCell.appendChild(scoreSpan);

    // 创建评价按钮
    let evaluateButton = document.createElement("a");
    evaluateButton.textContent = "评价";
    evaluateButton.href = "javascript:void(0)";
    evaluateButton.className = "lessonListOperator"; // 使样式与补选/重修按钮一致
    evaluateButton.style.marginLeft = "10px"; // 评分和按钮之间的间隙
    evaluateButton.onclick = () => evaluateCourseWindow(courseInfo); // 绑定函数

    scoreCell.appendChild(evaluateButton);
    row.insertBefore(scoreCell, cells[courseNameIndex + 1]); // 插入到课程名称之后

    // 异步获取评分并更新显示
    try {
      let score = await getScore(courseInfo); // 获取评分
      score = score === "N/A" ? "暂无评分" : parseFloat(score).toFixed(1); // 保留一位小数或显示暂无评分
      // 将评分保留一位小数并保存到课程信息对象中
      courseInfo.课程评分 = score;
      scoreSpan.textContent = score; // 显示评分
    } catch (error) {
      console.error("获取评分失败：", error);
      scoreSpan.textContent = "获取失败";
    }
  });
}
