const server = require('server');
const { get, error } = require('server/router');
// This is refers to a private method that I shouldn't be accessing normally. It is needed
// because server.js does not support patch() out the box. It would be preferable to have
// this added upstream, or use a different http server alltogether, but we are iterating
// quickly here!
const generic = require('server/router/generic');
const { status } = require('server/reply');

const {
	getPaymentsPerYear,
	periodPayment,
	perPeriodInterestRate,
	validateAmortizationPeriod,
	validateDownPayment,
	validatePaymentSchedule,

} = require('./mortgage');

const INTEREST_RATE = 0.05;

server([
  get('/payment-amount', ctx => {
  	let { askingPrice, downPayment, paymentSchedule, amortizationPeriod } = ctx.query;
  	askingPrice = parseFloat(askingPrice)
  	downPayment = parseInt(downPayment)
  	amortizationPeriod = parseInt(amortizationPeriod)
  	const errors = [];
	validateDownPayment(errors, askingPrice, downPayment);
	validatePaymentSchedule(errors, paymentSchedule);
	validateAmortizationPeriod(errors, amortizationPeriod);
  	if (errors.length > 0) {
  		return status(422).json({errors},);
  	}
  	const paymentsPerYear = getPaymentsPerYear(paymentSchedule);
  	const periodRate = perPeriodInterestRate(
  		INTEREST_RATE,
  		paymentsPerYear,
  		2,
	);
	const paymentPerPeriod = periodPayment(
		askingPrice,
		paymentsPerYear * amortizationPeriod,
		periodRate
	);
	return status(200).json({
		paymentPerPeriod,
		paymentsPerYear,
		periodRate,
		askingPrice,
		INTEREST_RATE,
		paymentSchedule,
		amortizationPeriod,
	});
  }),
  error(ctx => status(500).json({error: ctx.error.message}))
]);
