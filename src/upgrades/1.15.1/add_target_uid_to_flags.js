'use strict';

const db = require('../../database');
const batch = require('../../batch');
const posts = require('../../posts');

async function handlePostFlag(flagObj) {
	const targetUid = await posts.getPostField(flagObj.targetId, 'uid');
	if (targetUid) {
		await db.setObjectField(`flag:${flagObj.flagId}`, 'targetUid', targetUid);
	}
}

async function handleUserFlag(flagObj) {
	await db.setObjectField(`flag:${flagObj.flagId}`, 'targetUid', flagObj.targetId);
}

async function processFlagObject(flagObj) {
	if (!flagObj || !flagObj.targetId) {
		return;
	}

	console.log('Processing Flag Object by Ismael:', flagObj);

	if (flagObj.type === 'post') {
		await handlePostFlag(flagObj);
	} else if (flagObj.type === 'user') {
		await handleUserFlag(flagObj);
	}
}

module.exports = {
	name: 'Add target uid to flag objects',
	timestamp: Date.UTC(2020, 7, 22),
	method: async function () {
		const { progress } = this;

		await batch.processSortedSet('flags:datetime', async (flagIds) => {
			progress.incr(flagIds.length);
			const flagData = await db.getObjects(flagIds.map(id => `flag:${id}`));
			for (const flagObj of flagData) {
				/* eslint-disable no-await-in-loop */
				await processFlagObject(flagObj);
			}
		}, {
			progress: progress,
			batch: 500,
		});
	},
};
