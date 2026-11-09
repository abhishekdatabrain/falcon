const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log('[Password Hash]', { password, hashedPassword });
  return hashedPassword;
};

const comparePassword = async (password, hashedPassword) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  console.log('[Password Compare]', { password, hashedPassword, isMatch });
  return isMatch;
};

module.exports = {
  hashPassword,
  comparePassword,
};
