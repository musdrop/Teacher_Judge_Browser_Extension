/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const headers = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': '*',
	'Content-Type': 'application/json',
};

const newResponse = (result, success = true, init = {}) => new Response(JSON.stringify({ success, result }), { headers, ...init });

let preparedStatements = {};

const prepareStatements = (env) => {
	if (!preparedStatements.courseSelect) {
		preparedStatements.courseSelect = env.DB.prepare('SELECT * FROM course WHERE courseName = ? AND teacherName = ?');
		preparedStatements.commentLikesAdd = env.DB.prepare('UPDATE comment SET likes = likes + 1 WHERE commentId = ?');
		preparedStatements.commentDislikesAdd = env.DB.prepare('UPDATE comment SET dislikes = dislikes + 1 WHERE commentId = ?');
		preparedStatements.commentsSelect = env.DB.prepare(
			'SELECT * FROM comment WHERE courseId = ? AND (visible = "accepted" OR (visible != "accepted" AND uuid = ?)) ORDER BY commentTime DESC LIMIT 5 OFFSET ?'
		);
		preparedStatements.courseScoreSelect = env.DB.prepare('SELECT score, commentCount FROM course WHERE courseId = ?');
		preparedStatements.courseScoreUpdate = env.DB.prepare('UPDATE course SET score = ?, commentCount = commentCount + 1 WHERE courseId = ?');
		preparedStatements.courseInsert = env.DB.prepare(
			'INSERT INTO course (courseName, teacherName, score, commentCount) VALUES (?, ?, ?, 1)'
		);
		preparedStatements.commentInsert = env.DB.prepare(
			"INSERT INTO comment (courseId, commentContent, score, commentTime, likes, dislikes, visible, uuid) VALUES (?, ?, ?, datetime('now','+8 hours'), 0, 0, ?, ?)"
		);
		prepareStatements.commentsSelectBylikes = env.DB.prepare(
			'SELECT * FROM comment WHERE courseId = ? AND (visible = "accepted" OR (visible != "accepted" AND uuid = ?)) ORDER BY likes DESC LIMIT 5 OFFSET ?'
		);
	}
};

const handleOptions = () => newResponse('OK', true, { status: 200 });

const handleCourseSelect = async (request) => {
	const body = await request.json();
	const { courseNames, teacherNames } = body;

	if (Array.isArray(courseNames) && Array.isArray(teacherNames) && courseNames.length === teacherNames.length) {
		const courses = [];
		for (let i = 0; i < courseNames.length; i++) {
			const course = await preparedStatements.courseSelect.bind(courseNames[i], teacherNames[i]).first();
			if (course) {
				courses.push({ score: course.score, courseId: course.courseId });
			} else {
				courses.push({ score: 'N/A', courseId: -1 });
			}
		}
		return newResponse(courses);
	} else {
		const { courseName, teacherName } = body;
		const course = await preparedStatements.courseSelect.bind(courseName, teacherName).first();
		if (course) {
			return newResponse({ score: course.score, courseId: course.courseId });
		} else {
			return newResponse({ score: 'N/A', courseId: -1 });
		}
	}
};

const handleCommentUpdate = async (pathname) => {
	const ts = pathname.split('/');
	ts.pop();
	const commentId = ts.pop();
	const isDisLike = pathname.includes('dislike');
	const statement = isDisLike ? preparedStatements.commentDislikesAdd : preparedStatements.commentLikesAdd;
	await statement.bind(commentId).run();
	return newResponse('Success');
};

const handleCommentsSelect = async (pathname) => {
	const ts = pathname.split('/');
	const uuid = ts.pop();
	const page = ts.pop();
	const courseId = ts.pop();
	const offset = (parseInt(page) - 1) * 5;
	let comments;
	if (pathname.includes('likes')) {
		comments = await preparedStatements.commentsSelectBylikes.bind(courseId, uuid, offset).all();
	}
	else {
		comments = await preparedStatements.commentsSelect.bind(courseId, uuid, offset).all();
	}
	return newResponse(comments.results || []);
};

const handleCommentPost = async (request) => {
	const body = await request.json();
	const { courseId, courseName, teacherName, commentContent, score, uuid } = body;

	// 参数校验
	if (!courseId || !courseName || !teacherName || !commentContent || !score || !uuid) {
		return newResponse('Invalid parameters', false, { status: 400 });
	}
	// 评分校验
	if (isNaN(score) || score < 0 || score > 5) {
		return newResponse('Invalid score', false, { status: 400 });
	}


	let course = await preparedStatements.courseScoreSelect.bind(courseId).first();
	let cId = courseId;
	if (course) {
		const newScore =
			(parseFloat(course.commentCount) * parseFloat(course.score) + parseFloat(score)) / (parseFloat(course.commentCount) + 1);
		await preparedStatements.courseScoreUpdate.bind(newScore, courseId).run();
	} else {
		const insertRes = await preparedStatements.courseInsert.bind(courseName, teacherName, score).run();
		cId = insertRes.meta.last_row_id;
	}

	await preparedStatements.commentInsert.bind(cId, commentContent, score, "pending", uuid).run();

	return newResponse('Comment added', true, { status: 201 });
};

export default {
	async fetch(request, env) {
		prepareStatements(env);

		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		if (method === 'OPTIONS') {
			return handleOptions();
		}

		try {
			if (method === 'POST' && pathname.startsWith('/api/course')) {
				return await handleCourseSelect(request);
			}

			if (method === 'POST' && pathname.startsWith('/api/comment/')) {
				return await handleCommentUpdate(pathname);
			}

			if (method === 'GET' && pathname.startsWith('/api/comments/')) {
				return await handleCommentsSelect(pathname);
			}

			if (method === 'GET' && pathname.startsWith('/api/likes/comments/')) {
				return newResponse('OK');
			}

			if (method === 'POST' && pathname === '/api/commentpost') {
				return await handleCommentPost(request);
			}

			return newResponse('Not Found But Connected', false, { status: 404 });
		} catch (err) {
			console.error(err);
			return newResponse(err.message, false, { status: 500 });
		}
	},
};
