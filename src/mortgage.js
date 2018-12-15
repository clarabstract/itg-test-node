const { inspect } = require('util');

exports.validateAskingPrice = (errors, askingPrice) => {
	if (typeof askingPrice !== 'number' || isNaN(askingPrice)) {
		errors.push({
			param: 'askingPrice',
			code: 'MISSING',
			message: `A proper asking price must be provided - receieved: ${inspect(askingPrice)}`,
		});
	}
};

exports.validatePaymentAmount = (errors, paymentAmount) => {
	if (typeof paymentAmount !== 'number' || isNaN(paymentAmount)) {
		errors.push({
			param: 'paymentAmount',
			code: 'MISSING',
			message: `A payment amount must be provided - receieved: ${inspect(paymentAmount)}`,
		});
	}
};


exports.perPeriodInterestRate = (anualRate, paymentsPerYear, compoundPeriod) => {
	return Math.pow(1.0 + (anualRate / compoundPeriod), compoundPeriod / paymentsPerYear) - 1.0;
};

const interestTerm = (periods, interest) => {
	return (interest * Math.pow(1.0 + interest, periods))
			/ ( Math.pow(1.0 + interest, periods) - 1.0 );
};

exports.periodPayment = (principal, periods, interest) => {
	return principal * interestTerm(periods, interest);
};

exports.principalForPayment = (payment, periods, interest) => {
	return payment / interestTerm(periods, interest);
};

const LOW_DOWNPAYMENT_THRESHOLD = 500000;
const LOW_DOWNPAYMENT_PERCENT = 0.05;
const HIGH_DOWNPAYMENT_PERCENT = 0.1;

const minDownPayment = exports.minDownPayment = (askingPrice) => {
	let minDown = Math.min(LOW_DOWNPAYMENT_THRESHOLD, askingPrice) * LOW_DOWNPAYMENT_PERCENT;
	const highDownpaymentAmount = askingPrice - LOW_DOWNPAYMENT_THRESHOLD;
	if (highDownpaymentAmount > 0) {
		minDown += highDownpaymentAmount * HIGH_DOWNPAYMENT_PERCENT;
	}
	return minDown;
};

exports.validateDownPayment = (errors, askingPrice, downPayment) => {
	if (typeof downPayment !== 'number' || isNaN(downPayment)) {
		errors.push({
			param: 'downPayment',
			code: 'MISSING',
			message: `A down payment must be provided - receieved: ${inspect(downPayment)}`
		});
	}
	const minDown = minDownPayment(askingPrice);
	if (downPayment < minDown) {
		errors.push({
			param: 'downPayment',
			code: 'TOO_LOW',
			minValue: minDown,
			message: `Invalid down payment - must be at least ${minDown} for an asking price of ${askingPrice}.`
		});
	}

};

const PAYMENT_SCHEDULES = {
	weekly: 52,
	biweekly: 52 * 4,
	monthly: 12,
};

exports.getPaymentsPerYear = (paymentSchedule) => {
	return PAYMENT_SCHEDULES[paymentSchedule];
};

exports.validatePaymentSchedule = (errors, paymentSchedule) => {
	if (typeof paymentSchedule !== 'string' || paymentSchedule.length === 0) {
		errors.push({
			param: 'paymentSchedule',
			code: 'MISSING',
			message: `A payment schedule be provided - receieved: ${inspect(paymentSchedule)}`
		});
	}
	if (!(paymentSchedule in PAYMENT_SCHEDULES)) {
		errors.push({
			param: 'paymentSchedule',
			code: 'INVALID_OPTION',
			validOptions: Object.keys(PAYMENT_SCHEDULES),
			message: `Invalid payment schedule - must be one of: ${Object.keys(PAYMENT_SCHEDULES).join(', ')}.`
		});
	}

};
const MIN_AMORTIZATION_PERIOD = 5;
const MAX_AMORTIZATION_PERIOD = 25;
exports.validateAmortizationPeriod = (errors, amortizationPeriod) => {
	if (typeof amortizationPeriod !== 'number' || isNaN(amortizationPeriod)) {
		errors.push({
			param: 'amortizationPeriod',
			code: 'MISSING',
			message: `An amortization period must be provided - receieved: ${inspect(amortizationPeriod)}`
		});
	}
	if (amortizationPeriod < MIN_AMORTIZATION_PERIOD
		|| amortizationPeriod > MAX_AMORTIZATION_PERIOD) {
		errors.push({
			param: 'amortizationPeriod',
			code: 'OUTSIDE_RANGE',
			validRange: {min: MIN_AMORTIZATION_PERIOD, max: MAX_AMORTIZATION_PERIOD},
			message: `Invalid amortization period - must be between ${MIN_AMORTIZATION_PERIOD} and ${MAX_AMORTIZATION_PERIOD} years.`
		});
	}
};

const COMPOUND_PERIODS_FOR_LOCATION = {
	'us': 12,
	'ca': 2,
};
exports.getCompoundPeriod = (location) => {
	return COMPOUND_PERIODS_FOR_LOCATION[location];
};
exports.validateLocation = (errors, location) => {
	if (!(location in COMPOUND_PERIODS_FOR_LOCATION)) {
		errors.push({
			param: 'location',
			code: 'INVALID_OPTION',
			validOptions: Object.keys(COMPOUND_PERIODS_FOR_LOCATION),
			message: `Invalid mortgage location - must be one of: ${Object.keys(COMPOUND_PERIODS_FOR_LOCATION).join(', ')}.`
		});
	}
};

const MORTGAGE_INSURANCE_RATES = [
	[0.05, 	0.0315],
	[0.1,	0.024],
	[0.15,  0.018],
	[0.2,	0]
].reverse();

const getInsuranceRateForDownPaymentPercent = (downPaymentPercent) => {
	for (const [maxPercent, insuranceRate] of MORTGAGE_INSURANCE_RATES) {
		if (downPaymentPercent >= maxPercent) {
			return insuranceRate;
		}
	}
	throw new Error('Down payment is too low to calculate mortgage insurance rate');
}
exports.mortgageInsurance = (askingPrice, downPayment) => {
	downPaymentPercent = downPayment / askingPrice;
	insuranceCostPercent = getInsuranceRateForDownPaymentPercent(downPaymentPercent);
	return (askingPrice - downPayment) * insuranceCostPercent;
}
