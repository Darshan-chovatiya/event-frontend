// export const BaseUrl = "https://event.itfuturz.in"
// export const BaseUrl = "https://vtwfkr7c-3100.inc1.devtunnels.ms"
export const BaseUrl = "https://wg7b08rk-3100.inc1.devtunnels.ms"



export const AmazonAws = "https://itfuturz.s3.ap-south-1.amazonaws.com"



// const updateProfile = asyncHandler(async (req, res) => {
//     const { id, email, companyName, name, mobile, designation, companyWebsite, bio, keywords, insights, facebook, twitter, linkedin, focusSector, profileImagePath, coverImagePath, companyLogoPath } = req.body;
//      const profileImage = req.files?.profileImage?.[0]?.key ?? profileImagePath;
//     const coverImage = req.files?.coverImage?.[0]?.key ?? coverImagePath;
//     const companyLogo = req.files?.companyLogo?.[0]?.key ?? companyLogoPath;
//     const Model = req.role == 'Exhibitor' ? models.exhibitors : models.visitors;

//     if (!id) {
//         return requiredField('ID is required', res);
//     }

//     const updateFields = {
//         email, companyName, name, mobile, designation, companyWebsite, bio, keywords, insights, 'socialMedia.facebook': facebook, 'socialMedia.twitter': twitter, 'socialMedia.linkedin': linkedin, profileImage, coverImage, companyLogo, focusSector
//     };

//     const user = await Model.findByIdAndUpdate(
//         id,
//         { $set: updateFields },
//         { new: true, runValidators: true }
//     );

//     if (!user) return notFound('User not found', res);

//     return success(
//         'User profile updated successfully',
//         user,
//         res
//     );
// });



// const updateExhibitorQR = asyncHandler(async (req, res) => {
//     const qrCode = req.file.key
//     const Model = req.role == 'Exhibitor' ? models.exhibitors : models.visitors;
//     if (!qrCode) {
//         return badRequest('QR code is required', res);
//     }

//     const user = await Model.findOneAndUpdate(
//         { _id: req.user._id },
//         { qrCode },
//         { new: true, runValidators: true }
//     );

//     if (!user) {
//         return notFound('Exhibitor not found or unauthorized', res);
//     }

//     return success('QR code updated successfully', { data: { qrCode: user.qrCode } }, res)
// });