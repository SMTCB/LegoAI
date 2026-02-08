module.exports = (req, res) => {
    res.json({
        status: 'ok',
        message: 'API is working (CommonJS)',
        env_check: {
            has_gemini: !!process.env.GEMINI_API_KEY,
            has_rebrickable: !!process.env.REBRICKABLE_API_KEY
        }
    });
};
