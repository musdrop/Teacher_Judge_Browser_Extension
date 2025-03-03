返回结果格式：
```json
{
    "success": true,
    "result": any
}
```

### 1. 获取评分
**参数**：课程序号 `lessonId`  
**返回结果**：一个评分字符串  
**对数据库内容的影响**：无

### 2. 点赞
**参数**：评论id `commentId`  
**返回结果**：成功与否  
**对数据库内容的影响**：修改评论的点赞数

### 3. 点踩
**参数**：评论id `commentId`  
**返回结果**：成功与否  
**对数据库内容的影响**：修改评论的点赞数

### 4. 分页获取课程评论
**参数**：课程序号 `lessonId`，页数 `page`（每五个评论为一页）  
**返回结果**：评论列表  
**对数据库内容的影响**：无

### 5. 发布评论
**参数**：
- 课程信息 `lessonInfo`（包含课程序号 `lessonId`，课程代码 `courseCode`，课程名称 `courseName`，教师名称 `teacherName`）
- 评论内容 `commentContent`
- 评分 `score`

**返回结果**：成功与否  
**对数据库内容的影响**：先检测该课程是否存在，存在则重新计算课程平均分（(评论数 * 评分 + 新评分) / (评论数 + 1)），将评论数也 +1，如果不存在则新建相应课程。在评论表中添加评论，评论id

### 数据库
两张表：

#### 课程表
包含：
- 课程序号：`lessonId`（主键）
- 课程代码：`courseCode`
- 课程名称：`courseName`
- 教师名称：`teacherName`
- 课程评分：`score`
- 评论数：`commentCount`

以上字段均为字符串。

#### 评论表
包含：
- 评论序号：`commentId`（自增）
- 评论内容：`commentContent`
- 课程序号：`lessonId`
- 评分：`score`
- 评论时间：`commentTime`
- 点赞数：`likes`
- 点踩数：`dislikes`
