const server = require('server');
const { error } = require('server/router');
const { status } = require('server/reply');
const interestRateRoute = require('./src/server/interest-rate');
const mortgageAmountRoute = require('./src/server/mortgage-amount');
const paymentAmountRoute = require('./src/server/payment-amount');

// CSRF disabled to make accessing the PATCH endpoint simpler. This is safe to do here, as there is nothing
// to gain by forging a request in the name of another user (since no endpoint is restricted anyway).
server({security: {csrf: false}}, [
	paymentAmountRoute,
	mortgageAmountRoute,
	interestRateRoute,
	error(ctx => status(500).json({error: ctx.error.message})),
]);
