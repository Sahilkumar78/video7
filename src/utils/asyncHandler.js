

const asyncHandler = (requestHandler) => {
        
    return (req, res, next) => {
         Promise.resolve(requestHandler(req, res, next)).
         catch((err) => next(err))
     }
}   // this is advanced syntax

export {asyncHandler}





// const asyncHandler =  (fn) => async (req, res, next) => {
//     try {
         
//     } catch (error) {
//         res.status(error.code || 500).json({
//              success: false,
//              message: error.message
//         })
//     }
// }

// const asyncHandler = (fn) => () => {}