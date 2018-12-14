// Note that we rely on sync operations to prevent issues with concurrent writes. This is
// fine as long as we only have a single Node process running where the JS single thread
// execution will save us. If more than one server proccess is running, however, this would
// need to be replaced by a proper locking storage mechanism
const { readFileSync, writeFileSync, existsSync } = require('fs');

const DEFAULT_INTEREST_RATE = 0.025;
const INTEREST_FILE_PATH = `${__dirname}/interest.json`;

exports.getInterest = () => {
	if (!existsSync(INTEREST_FILE_PATH)) {
		return DEFAULT_INTEREST_RATE;
	}
	return JSON.parse(readFileSync(INTEREST_FILE_PATH, 'utf8')).interestRate;
};

exports.updateInterest = (interestRate) => {
	writeFileSync(INTEREST_FILE_PATH, JSON.stringify({interestRate}), 'utf8');
};
