// require("dotenv").config();
// const PayOS = require("@payos/node");

// const payOS = new PayOS(
//   process.env.PAYOS_CLIENT_ID,
//   process.env.PAYOS_API_KEY,
//   process.env.PAYOS_CHECKSUM_KEY
// );

// module.exports = payOS;

require("dotenv").config();
// @payos/node exports a named PayOS class; require returns an object of exports
const PayOSModule = require("@payos/node");
const PayOS = PayOSModule.PayOS || PayOSModule;

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

module.exports = payOS;
