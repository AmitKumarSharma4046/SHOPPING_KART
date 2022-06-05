const jwt = require("jsonwebtoken")

const authentication = async function (req, res, next) {
    try {
        let bearerToken = req.headers["authorization"] || req.headers["Authorization"];
        if (!bearerToken)
        return res.status(400).send({ status: false, message: "Token required! Please login to generate token" });
       
        const token = bearerToken.split(" ")[1]
        
        jwt.verify(token, 'functionUp-Uranium', (err, decodedToken) => {
            if (err) {
                return res.status(401).send({
                    status: false,
                    message: err.message
                })
            } else {
                req.userId = decodedToken.userId
                next()
            }
        })
        
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports ={ authentication }