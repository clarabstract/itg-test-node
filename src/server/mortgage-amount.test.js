const { stringify } = require('querystring');
const run = require('./_testRun');
const route = require('./mortgage-amount');
const interestStore = require('../interestStore');
// this keeps tests from seeing each-other's interest rate files:
interestStore.INTEREST_FILE_PATH = './interest.mortgage-test.json';

const VALID_PARAMS = {
	paymentAmount: 7000,
	paymentSchedule: 'monthly',
	amortizationPeriod: 10,
}
const EXPECTED_MAX_MORTGAGE = 750000;
const validRequestPath = (replacingParams = {}) =>  {
	return `/mortgage-amount?${stringify({...VALID_PARAMS, ...replacingParams})}`;
}

describe('GET /mortgage-amount', () => {
	it.each(['paymentAmount', 'paymentSchedule', 'amortizationPeriod'])(
		'should require the %s param',
		async (paramName) => {
			const response = await run(route).get('/mortgage-amount');
			expect(response.statusCode).toEqual(422);
			expect(response.body).toContainKey('errors');
			expect(response.body.errors).toContainValue(expect.objectContaining({
				param: paramName,
				code: 'MISSING',
			}));
		}
	)
	it('should require a valid payment schedule', async () => {
		const response = await run(route).get(validRequestPath({paymentSchedule: 'yearly'}));
		expect(response.statusCode).toEqual(422);
		expect(response.body).toContainKey('errors');
		expect(response.body.errors).toContainValue(expect.objectContaining({
			param: 'paymentSchedule',
			code: 'INVALID_OPTION',
			validOptions: ['weekly', 'biweekly', 'monthly'],
		}));
	})
	it('should require an amortization period of at least 5 years', async () => {
		const response = await run(route).get(validRequestPath({amortizationPeriod: 4}));
		expect(response.statusCode).toEqual(422);
		expect(response.body).toContainKey('errors');
		expect(response.body.errors).toContainValue(expect.objectContaining({
			param: 'amortizationPeriod',
			code: 'OUTSIDE_RANGE',
			validRange: {min: 5, max: 25},
		}));
	})
	it('should require an amortization period of no more than 25 years', async () => {
		const response = await run(route).get(validRequestPath({amortizationPeriod: 26}));
		expect(response.statusCode).toEqual(422);
		expect(response.body).toContainKey('errors');
		expect(response.body.errors).toContainValue(expect.objectContaining({
			param: 'amortizationPeriod',
			code: 'OUTSIDE_RANGE',
			validRange: {min: 5, max: 25},
		}));
	})
	it('should calculate the correct maximum mortgage for a US mortgage', async () => {
		// Payment amount obtained from from entering EXPECTED_MAX_MORTGAGE the at https://usmortgagecalculator.org/
		const response = await run(route).get(validRequestPath({paymentAmount: 7070.24}));
		expect(response.statusCode).toEqual(200);

		expect(response.body).toEqual(expect.objectContaining({
			// because of float precision issues, we expect to be a little (further) off here:
			maximumMortgage: expect.toBeWithin(
				EXPECTED_MAX_MORTGAGE - 1.0,
				EXPECTED_MAX_MORTGAGE + 1.0,
			),
		}));
	})
	it('should calculate the correct maximum mortgage for a CA mortgage', async () => {
		// Payment amount obtained from from entering EXPECTED_MAX_MORTGAGE the at https://tools.td.com/mortgage-payment-calculator/
		const response = await run(route).get(validRequestPath({paymentAmount: 7065.84, location: 'ca'}));
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual(expect.objectContaining({
			// because of float precision issues, we expect to be a little (further) off here:
			maximumMortgage: expect.toBeWithin(
				EXPECTED_MAX_MORTGAGE - 1.0,
				EXPECTED_MAX_MORTGAGE + 1.0,
			),
		}));
	})
		it('should add any provided down payment to the returned maximum mortgage amount', async () => {
		const downPayment = 50000;
		const response = await run(route).get(validRequestPath({paymentAmount: 7070.24, downPayment}));
		expect(response.statusCode).toEqual(200);

		expect(response.body).toEqual(expect.objectContaining({
			// because of float precision issues, we expect to be a little (further) off here:
			maximumMortgage: expect.toBeWithin(
				EXPECTED_MAX_MORTGAGE + downPayment - 1.0,
				EXPECTED_MAX_MORTGAGE + downPayment + 1.0,
			),
		}));
	})
});
