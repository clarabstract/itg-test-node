const { unlinkSync } = require('fs');
const run = require('./_testRun');
const route = require('./interest-rate');
const calculatingRoute = require('./payment-amount');
const interestStore = require('../interestStore');
// this keeps tests from seeing each-other's interest rate files:
interestStore.INTEREST_FILE_PATH = './interest.update-test.json';

describe('PATCH /interest-rate', () => {
	afterEach(() => {
		unlinkSync(interestStore.INTEREST_FILE_PATH);
	});
	it('should accept a new interest rate and ensure it used by subsequent requests', async () => {
		let initialResult = await run(calculatingRoute).get('/payment-amount?askingPrice=10000&downPayment=5000&amortizationPeriod=10&paymentSchedule=monthly');
		expect(initialResult.statusCode).toEqual(200);


		let patchResult = await run({security: {csrf: false}}, route)
			.patch('/interest-rate', {body: {interestRate: 0.05}});
		expect(patchResult.statusCode).toEqual(200);
		expect(patchResult.body).toEqual({
			oldInterestRate: 0.025,
			newInterestRate: 0.05,
		});

		let subsequentResult = await run(calculatingRoute).get('/payment-amount?askingPrice=10000&downPayment=5000&amortizationPeriod=10&paymentSchedule=monthly');
		expect(subsequentResult.statusCode).toEqual(200);

		expect(initialResult.body.paymentPerPeriod).toBeLessThan(subsequentResult.body.paymentPerPeriod);

		let additionalPatchResult = await run({security: {csrf: false}}, route)
			.patch('/interest-rate', {body: {interestRate: 0.1}});
		expect(additionalPatchResult.statusCode).toEqual(200);
		expect(additionalPatchResult.body).toEqual({
			oldInterestRate: 0.05,
			newInterestRate: 0.1,
		});

		let finalResult = await run(calculatingRoute).get('/payment-amount?askingPrice=10000&downPayment=5000&amortizationPeriod=10&paymentSchedule=monthly');
		expect(finalResult.statusCode).toEqual(200);

		expect(subsequentResult.body.paymentPerPeriod).toBeLessThan(finalResult.body.paymentPerPeriod);
	});
});
