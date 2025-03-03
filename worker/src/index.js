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

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		if (method === 'OPTIONS') {
			return newResponse('OK', true, { status: 200 });
		}

		try {
			if (method === 'GET' && pathname.startsWith('/api/lesson/')) {
				const lessonId = pathname.split('/').pop();
				const lesson = await env.DB.prepare('SELECT score FROM lesson WHERE lessonId = ?').bind(lessonId).first();
				return newResponse(lesson ? lesson.score : 'N/A');
			}

			if (method === 'POST' && pathname.startsWith('/api/comment/')) {
				const ts = pathname.split('/');
				ts.pop();
				const commentId = ts.pop();
				const isDisLike = pathname.includes('dislike');
				const field = isDisLike ? 'dislikes' : 'likes';
				await env.DB.prepare(`UPDATE comment SET ${field} = ${field} + 1 WHERE commentId = ?`).bind(commentId).run();
				return newResponse('Success');
			}

			if (method === 'GET' && pathname.startsWith('/api/comments/')) {
				const ts = pathname.split('/');
				const page = ts.pop();
				const lessonId = ts.pop();
				console.log(lessonId);
				const offset = (parseInt(page) - 1) * 5;
				const comments = await env.DB.prepare('SELECT * FROM comment WHERE lessonId = ? ORDER BY commentTime DESC LIMIT 5 OFFSET ?')
					.bind(lessonId, offset)
					.all();
				return newResponse(comments.results || []);
			}

			if (method === 'POST' && pathname === '/api/commentpost') {
				const body = await request.json();
				const { lessonId, courseCode, courseName, teacherName, commentContent, score } = body;

				let lesson = await env.DB.prepare('SELECT score, commentCount FROM lesson WHERE lessonId = ?').bind(lessonId).first();

				if (lesson) {
					const newScore =
						(parseFloat(lesson.commentCount) * parseFloat(lesson.score) + parseFloat(score)) / (parseFloat(lesson.commentCount) + 1);
					await env.DB.prepare('UPDATE lesson SET score = ?, commentCount = commentCount + 1 WHERE lessonId = ?')
						.bind(newScore, lessonId)
						.run();
				} else {
					await env.DB.prepare(
						'INSERT INTO lesson (lessonId, courseCode, courseName, teacherName, score, commentCount) VALUES (?, ?, ?, ?, ?, 1)'
					)
						.bind(lessonId, courseCode, courseName, teacherName, score)
						.run();
				}

				await env.DB.prepare(
					"INSERT INTO comment (lessonId, commentContent,score ,commentTime, likes, dislikes) VALUES (?, ?, ? ,datetime('now'), 0, 0)"
				)
					.bind(lessonId, commentContent, score)
					.run();
				return newResponse('Comment added', true, { status: 201 });
			}

			return newResponse('Not Found But Connected', false, { status: 404 });
		} catch (err) {
			console.error(err);
			return newResponse(err.message, false, { status: 500 });
		}
	},
};

