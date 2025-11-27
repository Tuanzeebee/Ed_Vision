# EdVision - AI-Powered Student Performance Prediction System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178c6.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)](https://fastapi.tiangolo.com/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-e0234e.svg)](https://nestjs.com/)

## 🎯 About The Project

<p align="center">
  <img alt="EdVision Landing Page" src="./Ed_Vision/public/landing-page.png" width="100%">
</p>

**EdVision** is an intelligent education management platform that leverages Machine Learning and Explainable AI (XAI) to predict student academic performance and provide actionable insights for educators. The system helps teachers identify at-risk students early and implement personalized intervention strategies.

### ✨ Key Features

- 🤖 **AI-Powered Predictions**: Grade forecasting using Gradient Boosting with 85%+ accuracy
- 📊 **Explainable AI (SHAP)**: Transparent insights into prediction factors
- 👥 **Multi-Role System**: Separate portals for Teachers, Students, Parents, and Admins
- 📈 **Real-time Analytics**: Interactive dashboards with performance trends
- 🔔 **Smart Notifications**: Automated alerts for at-risk students
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🌐 **Bilingual Support**: Vietnamese and English localization
- 🔒 **Secure Authentication**: JWT-based auth with role-based access control

### 🎓 Use Cases

- **For Teachers**: Upload grades, run predictions, view SHAP explanations, manage classes
- **For Students**: View grades, track progress, receive personalized recommendations
- **For Parents**: Monitor child's performance, receive notifications, communicate with teachers
- **For Admins**: System analytics, user management, generate reports

---

## 🏗️ Architecture

```
EdVision/
├── Ed_Vision/              # Frontend (React + TypeScript + Vite)
├── ed_vision_backend/      # Backend API (NestJS + PostgreSQL + MongoDB)
└── ml_service/             # ML Service (FastAPI + Python + SHAP)
```

### Tech Stack

#### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.10
- **Styling**: TailwindCSS 3.4.15
- **State Management**: React Context + Custom Hooks
- **Charts**: Recharts 2.13.3
- **Routing**: React Router DOM 6.28.0
- **Internationalization**: i18next 23.16.8

#### Backend
- **Framework**: NestJS 10.0
- **Database**: PostgreSQL (primary) + MongoDB (predictions)
- **ORM**: Prisma 6.1.0
- **Authentication**: JWT + Passport
- **API Documentation**: Swagger/OpenAPI

#### ML Service
- **Framework**: FastAPI
- **ML Library**: Scikit-learn (Gradient Boosting)
- **XAI**: SHAP (SHapley Additive exPlanations)
- **Data Processing**: Pandas, NumPy
- **Model Artifacts**: Joblib

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **Python** >= 3.8
- **PostgreSQL** >= 13
- **MongoDB** >= 5.0
- **npm** or **yarn**
- **pip**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Tuanzeebee/Ed_Vision.git
cd Ed_Vision
```

#### 2. Setup Frontend

```bash
cd Ed_Vision

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# VITE_API_URL=http://localhost:3000
# VITE_ML_API_URL=http://localhost:8000

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

#### 3. Setup Backend (NestJS)

```bash
cd ed_vision_backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure database
# DATABASE_URL="postgresql://user:password@localhost:5432/edvision"
# MONGODB_URI="mongodb://localhost:27017/edvision"
# JWT_SECRET="your-secret-key"

# Run Prisma migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
npm run start:dev
```

Backend API will be available at `http://localhost:3000`

#### 4. Setup ML Service (FastAPI)

```bash
cd ml_service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run ML service
uvicorn predictscoreforteacheraddfeature:app --reload --port 8000
```

ML API will be available at `http://localhost:8000`

---

## 📖 Usage Guide

### For Teachers

1. **Login** with teacher credentials
2. **Navigate** to "Quản Lý Điểm" (Grade Management)
3. **Upload** CSV file with student grades
4. **Fill** behavior survey for the class
5. **Run Prediction** to get AI-powered forecasts
6. **View SHAP Explanations** to understand key factors
7. **Export** results or share with students

### For Students

1. **Login** with student credentials
2. **Dashboard** shows current grades and predictions
3. **View** personalized recommendations
4. **Track** progress over time
5. **Access** learning resources

### API Documentation

- **Backend API**: `http://localhost:3000/api/docs`
- **ML API**: `http://localhost:8000/docs`

---

## 🧪 Testing

### Frontend Tests

```bash
cd Ed_Vision
npm run test
```

### Backend Tests

```bash
cd ed_vision_backend
npm run test
npm run test:e2e
```

### ML Service Tests

```bash
cd ml_service
pytest
```

---

## 📦 Production Build

### Frontend

```bash
cd Ed_Vision
npm run build

# Output will be in dist/ folder
# Serve with nginx or any static file server
```

### Backend

```bash
cd ed_vision_backend
npm run build
npm run start:prod
```

### ML Service

```bash
cd ml_service

# Use gunicorn for production
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker predictscoreforteacheraddfeature:app
```

---

## 🎨 Screenshots

<table>
  <tr>
    <td><img src="./Ed_Vision/src/assets/teacher/Chart_Teacher_Dashboard.png" alt="Teacher Dashboard"></td>
    <td><img src="./Ed_Vision/src/assets/teacher/Report_Teacher.png" alt="Grade Management"></td>
  </tr>
  <tr>
    <td><img src="./Ed_Vision/src/assets/shared/logo_predica.jpg" alt="Dashboard View"></td>
    <td><img src="./Ed_Vision/src/assets/student/imgUploadTranscript.png" alt="Upload Transcript"></td>
  </tr>
</table>

### 📸 Additional Screenshots

<details>
<summary>Click to view more screenshots</summary>

**Student Learning Path Steps:**

<table>
  <tr>
    <td><img src="./Ed_Vision/src/assets/student/step1.png" alt="Step 1" width="200"></td>
    <td><img src="./Ed_Vision/src/assets/student/step3.png" alt="Step 3" width="200"></td>
    <td><img src="./Ed_Vision/src/assets/student/step4.png" alt="Step 4" width="200"></td>
  </tr>
  <tr>
    <td><img src="./Ed_Vision/src/assets/student/step5.png" alt="Step 5" width="200"></td>
    <td><img src="./Ed_Vision/src/assets/student/step6.png" alt="Step 6" width="200"></td>
    <td><img src="./Ed_Vision/src/assets/student/step7.png" alt="Step 7" width="200"></td>
  </tr>
</table>

</details>

---

## 📊 System Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 10 GB
- **Network**: Stable internet connection

### Recommended for Production

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: High-speed connection
- **OS**: Ubuntu 20.04+ or Windows Server 2019+

---

## 🔧 Configuration

### Frontend Environment Variables

```env
# .env
VITE_API_URL=http://localhost:3000
VITE_ML_API_URL=http://localhost:8000
VITE_APP_NAME=EdVision
VITE_DEFAULT_LANGUAGE=vi
```

### Backend Environment Variables

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/edvision"
MONGODB_URI="mongodb://localhost:27017/edvision"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRATION="7d"
PORT=3000
NODE_ENV=development
```

### ML Service Configuration

```python
# config.py
HIGH_R2 = 0.60   # High confidence threshold
MID_R2 = 0.30    # Medium confidence threshold
BLEND_ALPHA = 0.7  # Model blend ratio
CACHE_TTL_MINUTES = 15  # SHAP cache duration
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Coding Guidelines

- Follow TypeScript/JavaScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

---

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [ML Model Documentation](./docs/ML_MODEL.md)
- [SHAP Optimization Guide](./docs/SHAP_OPTIMIZATION.md)
- [Deployment Guide](./DEPLOY_SHAP_OPTIMIZATION.md)

---

## 🐛 Known Issues

- **SHAP Calculation**: May be slow for large datasets (>200 students). Use caching optimization.
- **MongoDB Connection**: Ensure MongoDB service is running before starting backend.
- **CSV Upload**: File must follow the template format strictly.

See [Issues](https://github.com/Tuanzeebee/Ed_Vision/issues) for a full list of known issues and feature requests.

---

## 🔐 Security

EdVision takes security seriously. If you discover a security vulnerability, please email:

- **Security Team**: security@edvision.edu.vn
- **Response Time**: Within 48 hours

### Security Features

- 🔒 JWT-based authentication
- 🛡️ Role-based access control (RBAC)
- 🔐 Password hashing with bcrypt
- 🚫 SQL injection prevention (Prisma ORM)
- ✅ Input validation and sanitization
- 📝 Audit logging

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 EdVision Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Team

- **Project Lead**: Nguyễn Đình Tuấn
- **Backend Developer**: Hồ Trọng Vỹ, Tô Minh Vương, Võ Văn Phương
- **Frontend Developer**: Võ Hoàng Mai Khanh, Tô Minh Vương, Võ Văn Phương
- **ML Engineer**: Nguyễn Đình Tuấn
- **UI/UX Designer**: Võ Hoàng Mai Khanh, Tô Minh Vương, Võ Văn Phương

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Framework
- [NestJS](https://nestjs.com/) - Backend Framework
- [FastAPI](https://fastapi.tiangolo.com/) - ML API Framework
- [SHAP](https://github.com/slundberg/shap) - Explainable AI Library
- [Scikit-learn](https://scikit-learn.org/) - Machine Learning Library
- [TailwindCSS](https://tailwindcss.com/) - CSS Framework

---

## 📞 Contact & Support

- **Website**: [https://teamnghiencuu.id.vn](https://teamnghiencuu.id.vn)
- **Email**: support@edvision.edu.vn
- **GitHub**: [@Tuanzeebee](https://github.com/Tuanzeebee)
- **Documentation**: [https://docs.edvision.edu.vn](https://docs.edvision.edu.vn)

For bugs and feature requests, please [create an issue](https://github.com/Tuanzeebee/Ed_Vision/issues/new).

---

## 🌟 Star History

If you find EdVision useful, please consider giving it a ⭐ on GitHub!

---

<p align="center">
  Made with ❤️ by EdVision Team
</p>

<p align="center">
  <a href="#edvision---ai-powered-student-performance-prediction-system">Back to Top ↑</a>
</p>
