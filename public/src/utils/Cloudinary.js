import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

    // Configuration
cloudinary.config(
{ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
    const uploadOnCloudinary = async (filePath) => {
    try {
        if(!filePath)  return null;

        //  UPLOAD THE FILE ON CLOUDINARY
        const response =await cloudinary.uploader.upload(filePath, { 
            resource_type: "auto",    
            })

        // FILE UPLOADED SUCCESSFULLY, NOW DELETE THE LOCAL FILE
        console.log("File uploaded to Cloudinary successfully. NOW Deleting local file...",response.url);
        // return response.url;
        return response;
    } 

      
    // catch (error) {
    //     fs.unlinkSync(filePath); // DELETE THE LOCAL FILE IN CASE OF ERROR  
    //     return null ;
    //   }



    //     if (filePath) fs.unlinkSync(filePath);
    //     return null;
    // } 
     
    catch (error) {
    console.log(" CLOUDINARY ERROR MESSAGE:", error.message);
    console.log(" FULL ERROR OBJECT:", error);

    if (filePath) fs.unlinkSync(filePath);
    return null;
}
}
*/

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;

    const response = await cloudinary.uploader.upload(
      filePath.replace(/\\/g, "/"), // 🔥 FIX
      {
        resource_type: "auto",
      }
    );

    console.log("Uploaded:", response.secure_url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return response;

  } catch (error) {
    console.log("Cloudinary Error:", error.message);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return null;
  }
};

    export { uploadOnCloudinary };





// cloudinary.v2.uploader.upload("path/to/your/image.jpg", function(error, result) {
//     if (error) {
//         console.error("Error uploading to Cloudinary:", error); 
//     });
//     console.log("Upload result:", result);  






