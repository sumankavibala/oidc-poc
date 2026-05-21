const authorize = (requiredRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userRole = user.role;
        const hasRole = requiredRoles.includes(userRole);
        if (!hasRole) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};
export default authorize;