# BackendFlow 🚀

A production-ready backend project built with **Node.js, Express, MongoDB, and Cloudinary**, focusing on real-world architecture, authentication, and file handling.

---

## 🚀 Features

* 🔐 User Registration with Validation
* 🖼️ Avatar & Cover Image Upload (Multer + Cloudinary)
* 🔒 Password Hashing using Bcrypt
* ⚡ Async Error Handling (Custom Middleware)
* 📦 Structured API Responses
* 🧠 Clean MVC Architecture

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **Authentication:** JWT (Upcoming)
* **File Upload:** Multer
* **Cloud Storage:** Cloudinary

---

## 📂 Project Structure

```
src/
 ├── controllers/     # Business logic
 ├── models/          # Mongoose schemas
 ├── routes/          # API routes
 ├── middlewares/     # Custom middlewares
 ├── utils/           # Helpers (ApiError, ApiResponse, etc.)
 └── index.js         # Entry point
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```
PORT=8000
MONGODB_URI=your_mongodb_connection_string

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

---

## 📡 API Endpoints

### 🔹 Register User

```
POST /api/v1/users/register
```

**Form Data:**

* fullName (text)
* email (text)
* username (text)
* password (text)
* avatar (file)
* coverImage (file - optional)

---

## 🧠 What I Learned

* Handling multipart/form-data with Multer
* Integrating Cloudinary for media storage
* Writing scalable backend structure
* Debugging real-world backend issues
* Secure password storage and validation

---

## 🔗 Architecture / Model

👉 https://app.eraser.io/workspace/g1bF1T0MiGj6Mqp188Px?origin=share

---

## 📌 Future Improvements

* 🔐 Login & JWT Authentication
* 🔄 Refresh Token System
* 🛡️ Protected Routes Middleware
* 📊 Rate Limiting & Security Enhancements

---

## 👨‍💻 Author

**Vedant Lodhi**

---

⭐ If you like this project, consider giving it a star!
