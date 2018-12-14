const { status } = require('server/reply');
// This is refers to a private method that I shouldn't be accessing normally. It is needed
// because server.js does not support patch() out the box. It would be preferable to have
// this added upstream, or use a different http server alltogether, but we are iterating
// quickly here!
const generic = require('server/router/generic');
const { getInterest, updateInterest }  = require('../interestStore');

module.exports = generic('PATCH', '/interest-rate', ctx => {
	const newInterestRate = ctx.data.interestRate;
	const oldInterestRate = getInterest();
	updateInterest(newInterestRate);

	return status(200).json({newInterestRate, oldInterestRate});
});
