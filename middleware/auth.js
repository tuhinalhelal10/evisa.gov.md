// অথেন্টিকেশন মিডলওয়্যার
const authMiddleware = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// অ্যাডমিন অথোরাইজেশন মিডলওয়্যার
const adminMiddleware = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

module.exports = { authMiddleware, adminMiddleware };