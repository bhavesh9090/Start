const cron = require('node-cron');
const { generateMonthlyTaxes, applyPenalties } = require('../controllers/taxController');

const startCronJobs = () => {
  // Generate monthly taxes on the 1st of every month at midnight
  cron.schedule('0 0 1 * *', async () => {
    console.log('🕐 Running monthly tax generation cron...');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    try {
      await generateMonthlyTaxes(year, month);
      console.log(`✅ Monthly taxes generated for ${month}/${year}`);
    } catch (err) {
      console.error('❌ Cron tax generation failed:', err);
    }
  });

  // Apply penalties on the 5th of every month
  cron.schedule('0 0 5 * *', async () => {
    console.log('🕐 Running penalty application cron...');
    try {
      await applyPenalties();
      console.log('✅ Penalties applied');
    } catch (err) {
      console.error('❌ Cron penalty application failed:', err);
    }
  });

  console.log('⏰ Cron jobs scheduled: tax generation (1st) & penalties (5th)');
};

module.exports = { startCronJobs };
