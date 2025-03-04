/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

var headers = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': '*',
	'Content-Type': 'application/json',
};

var newResponse = (result, success = true, init = {}) => new Response(JSON.stringify({ success, result }), { headers, ...init });

let preparedStatements = {};

export default {
	async fetch(request, env) {
		if (!preparedStatements.courseSelect) {
			preparedStatements.courseSelect = env.DB.prepare('SELECT * FROM course WHERE courseName = ? AND teacherName = ?');
			preparedStatements.commentUpdate = env.DB.prepare('UPDATE comment SET likes = likes + 1 WHERE commentId = ?');
			preparedStatements.commentDislikeUpdate = env.DB.prepare('UPDATE comment SET dislikes = dislikes + 1 WHERE commentId = ?');
			preparedStatements.commentsSelect = env.DB.prepare(
				'SELECT * FROM comment WHERE courseId = ? ORDER BY commentTime DESC LIMIT 5 OFFSET ?'
			);
			preparedStatements.courseScoreSelect = env.DB.prepare('SELECT score, commentCount FROM course WHERE courseId = ?');
			preparedStatements.courseUpdate = env.DB.prepare('UPDATE course SET score = ?, commentCount = commentCount + 1 WHERE courseId = ?');
			preparedStatements.courseInsert = env.DB.prepare(
				'INSERT INTO course (courseName, teacherName, score, commentCount) VALUES (?, ?, ?, 1)'
			);
			preparedStatements.commentInsert = env.DB.prepare(
				"INSERT INTO comment (courseId, commentContent, score, commentTime, likes, dislikes) VALUES (?, ?, ?, datetime('now','+8 hours'), 0, 0)"
			);
		}

		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		if (method === 'OPTIONS') {
			return newResponse('OK', true, { status: 200 });
		}

		try {
			if (method === 'POST' && pathname.startsWith('/api/course')) {
				const body = await request.json();
				const { courseName, teacherName } = body;
				const course = await preparedStatements.courseSelect.bind(courseName, teacherName).first();
				if (course) {
					return newResponse({ score: course.score, courseId: course.courseId });
				} else {
					return newResponse({ score: 'N/A', courseId: -1 });
				}
			}

			if (method === 'POST' && pathname.startsWith('/api/comment/')) {
				const ts = pathname.split('/');
				ts.pop();
				const commentId = ts.pop();
				const isDisLike = pathname.includes('dislike');
				const statement = isDisLike ? preparedStatements.commentDislikeUpdate : preparedStatements.commentUpdate;
				await statement.bind(commentId).run();
				return newResponse('Success');
			}

			if (method === 'GET' && pathname.startsWith('/api/comments/')) {
				const ts = pathname.split('/');
				const page = ts.pop();
				const courseId = ts.pop();
				console.log(courseId);
				const offset = (parseInt(page) - 1) * 5;
				const comments = await preparedStatements.commentsSelect.bind(courseId, offset).all();
				return newResponse(comments.results || []);
			}

			if (method === 'POST' && pathname === '/api/commentpost') {
				const body = await request.json();
				const { courseId, courseName, teacherName, commentContent, score } = body;

				let course = await preparedStatements.courseScoreSelect.bind(courseId).first();
				let cId = courseId;
				if (course) {
					const newScore =
						(parseFloat(course.commentCount) * parseFloat(course.score) + parseFloat(score)) / (parseFloat(course.commentCount) + 1);
					await preparedStatements.courseUpdate.bind(newScore, courseId).run();
				} else {
					const insertRes = await preparedStatements.courseInsert.bind(courseName, teacherName, score).run();
					cId = insertRes.meta.last_row_id;
				}

				await preparedStatements.commentInsert.bind(cId, commentContent, score).run();

				return newResponse('Comment added', true, { status: 201 });
			}

			return newResponse('Not Found But Connected', false, { status: 404 });
		} catch (err) {
			console.error(err);
			return newResponse(err.message, false, { status: 500 });
		}
	},
};
