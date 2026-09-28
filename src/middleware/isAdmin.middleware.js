export function isAdmin(req,res,next){
    if(req.user.role!=="admin"){
        return res.status(403).json({
            message:"Invalid access"
        });
    }
    next();
}
export default isAdmin;