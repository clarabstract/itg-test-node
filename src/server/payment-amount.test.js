const { stringify } = require('querystring');
const run = require('./_testRun');
const route = require('./payment-amount');
const interestStore = require('../interestStore');
// this keeps tests from seeing each-other's interest rate files:
interestStore.INTEREST_FILE_PATH = './interest.payment-test.json';

const VALID_PARAMS = {
	askingPrice: 750000,
	downPayment: 50000,
	paymentSchedule: 'monthly',
	amortizationPeriod: 10,
}
// 50,000 / 75,000 = 6.66%, so using 3.15% insurance cost on principal:
const EXPECTED_MORTGAGE_INSURANCE_COST = (750000 - 50000) * 0.0315;
// Obtained from https://www.mortgagecalculator.org/ using $772,050 (asking price + insurance) as the principal
const EXPECTED_US_MORTGAGE_PAYMENT = 6806.76;
// Obtained from https://tools.td.com/mortgage-payment-calculator/ using $722,050 (asking price  insurance - down payment) as the principal
const EXPECTED_CA_MORTGAGE_PAYMENT = 6802.52;
const validRequestPath = (replacingParams = {}) =>  {
	return `/payment-amount?${stringify({...VALID_PARAMS, ...replacingParams})}`;
}

describe('GET /payment-amount', () => {
	it.each(['askingPrice', 'downPayment', 'paymentSchedule', 'amortizationPeriod'])(
		'should require the %s param',
		async (paramName) => {
			const response = await run(route).get('/payment-amount');
			expect(response.statusCode).toEqual(422);
			expect(response.body).toContainKey('errors');
			expect(response.body.errors).toContainValue(expect.objectContaining({
				param: paramName,
				code: 'MISSING',
			}));
		}
	)
	it('should require the correct minimum down payment below 500K', async () => {
		const response = await run(route).get(validRequestPath({askingPrice: 100000, downPayment: 4999}));
		expect(response.statusCode).toEqual(422);
		expect(response.body).toContainKey('errors');
		expect(response.body.errors).toContainValue(expect.objectContaining({
			param: 'downPayment',
			code: 'TOO_LOW',
			minValue: 5000,
		}));
	})
	it('should require the correct minimum down payment above 500K', async () => {
		const response = await run(route).get(validRequestPath({askingPrice: 1000000, downPayment: 74999}));
		expect(response.statusCode).toEqual(422);
		expect(response.body).toContainKey('errors');
		expect(response.body.errors).toContainValue(expect.objectContaining({
			param: 'downPayment',
			code: 'TOO_LOW',
			minValue: 75000,
		}));
	})
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
		it('should require a valid location (if one is given)', async () => {
		const response = await run(route).get(validRequestPath({location: 'ro'}));
		expect(response.statusCode).toEqual(422);
		expect(response.body).toContainKey('errors');
		expect(response.body.errors).toContainValue(expect.objectContaining({
			param: 'location',
			code: 'INVALID_OPTION',
			validOptions: ['us', 'ca'],
		}));
	})
	it('should calculate the correct monthly payment for a US mortgage', async () => {
		const response = await run(route).get(validRequestPath({location: 'us'}));
		expect(response.statusCode).toEqual(200);
		expect(response.body.info.mortgageInsuranceAdded).toEqual(EXPECTED_MORTGAGE_INSURANCE_COST);
		expect(response.body).toEqual(expect.objectContaining({
			// because of float precision issues, we expect to be a little off here:
			paymentPerPeriod: expect.toBeWithin(
				EXPECTED_US_MORTGAGE_PAYMENT - 0.01,
				EXPECTED_US_MORTGAGE_PAYMENT + 0.01,
			),
		}));
	})
	it('should calculate the correct monthly payment for a CA mortgage', async () => {
		const response = await run(route).get(validRequestPath({location: 'ca'}));
		expect(response.statusCode).toEqual(200);
		expect(response.body.info.mortgageInsuranceAdded).toEqual(EXPECTED_MORTGAGE_INSURANCE_COST);
		expect(response.body).toEqual(expect.objectContaining({
			// because of float precision issues, we expect to be a little off here:
			paymentPerPeriod: expect.toBeWithin(
				EXPECTED_CA_MORTGAGE_PAYMENT - 0.01,
				EXPECTED_CA_MORTGAGE_PAYMENT + 0.01,
			),
		}));
	})
});
