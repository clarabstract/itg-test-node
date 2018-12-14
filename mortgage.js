exports.perPeriodInterestRate = (anualRate, paymentsPerYear, compoundPeriod) => {
	return Math.pow(1.0 + (anualRate / compoundPeriod), compoundPeriod / paymentsPerYear) - 1.0;
};

const interestTerm = (periods, interest) => {
	return (interest * Math.pow(1.0 + interest, periods))
			/ ( Math.pow(1.0 + interest, periods) - 1.0 );
}

exports.periodPayment = (principal, periods, interest) => {
	return principal * interestTerm(periods, interest);
};

exports.principalForPayment = (payment, periods, interest) => {
	return payment / interestTerm(periods, interest);
}

const LOW_DOWNPAYMENT_THRESHOLD = 500000;
const LOW_DOWNPAYMENT_PERCENT = 0.05;
const HIGH_DOWNPAYMENT_PERCENT = 0.1;

const minDownPayment = (askingPrice) => {
	let minDown = Math.min(LOW_DOWNPAYMENT_THRESHOLD, askingPrice) * LOW_DOWNPAYMENT_PERCENT;
	const highDownpaymentAmount = askingPrice - LOW_DOWNPAYMENT_PERCENT;
	if (highDownpaymentAmount > 0) {
		minDown += highDownpaymentAmount * HIGH_DOWNPAYMENT_PERCENT;
	}
	return minDown;
}

exports.validateDownPayment = (errors, askingPrice, downPayment) => {
	const minDown = minDownPayment(askingPrice);
	if (downPayment < minDown) {
		errors.push(`Invalid down payment - must be at least ${minDown} for an asking price of ${askingPrice}.`);
	}

};

const PAYMENT_SCHEDULES = {
	weekly: 52,
	biweekly: 52 * 4,
	monthly: 12,
}

exports.getPaymentsPerYear = (paymentSchedule) => {
	return PAYMENT_SCHEDULES[paymentSchedule];
}


exports.validatePaymentSchedule = (errors, paymentSchedule) => {
	if (!(paymentSchedule in PAYMENT_SCHEDULES)) {
		errors.push(`Invalid payment schedule - must be one of: ${Object.keys(PAYMENT_SCHEDULES).join(', ')}.`)
	}

};
const MIN_AMORTIZATION_PERIOD = 1;
const MAX_AMORTIZATION_PERIOD = 25;
exports.validateAmortizationPeriod = (errors, amortizationPeriod) => {
	if (amortizationPeriod < MIN_AMORTIZATION_PERIOD
		|| amortizationPeriod > MAX_AMORTIZATION_PERIOD) {
		errors.push(`Invalid amortization period - must be between ${MIN_AMORTIZATION_PERIOD} and ${MAX_AMORTIZATION_PERIOD} years.`)
	}
};
