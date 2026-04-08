# Changelog

All notable changes to EdVision will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- SHAP optimization service for concurrent users
- Request deduplication and queueing
- Server-side caching for ML predictions
- Pagination for student lists (10-12 per page)

## [1.0.0] - 2024-11-21

### Added
- Initial release of EdVision platform
- Teacher dashboard with grade management
- Student performance prediction using Gradient Boosting
- SHAP explanations for model interpretability
- Multi-role authentication system (Teacher, Student, Parent, Admin)
- CSV grade upload functionality
- Behavior survey integration
- Real-time notifications
- Bilingual support (Vietnamese/English)
- MongoDB integration for prediction storage
- PostgreSQL for user and course management
- Responsive UI with TailwindCSS

### Features by Module

#### Frontend (Ed_Vision)
- Teacher module with prediction view
- Student dashboard
- Parent portal
- Admin panel
- Grade management interface
- Interactive charts and analytics
- Real-time updates

#### Backend (ed_vision_backend)
- RESTful API with NestJS
- JWT authentication
- Role-based access control
- Prisma ORM for PostgreSQL
- MongoDB integration for predictions
- File upload handling
- Email notification service

#### ML Service (ml_service)
- FastAPI ML API
- Gradient Boosting model (85%+ accuracy)
- SHAP explainability
- Behavior feature integration
- Dynamic fallback system based on course R²
- Model artifacts caching

### Security
- Bcrypt password hashing
- JWT token-based authentication
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## [0.9.0] - 2024-10-15

### Added
- Beta testing phase
- Core prediction functionality
- Basic authentication

### Fixed
- Various bug fixes from alpha testing
- Performance improvements

## [0.5.0] - 2024-09-01

### Added
- Alpha version
- Initial ML model training
- Basic UI components
- Database schema design

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute to this changelog.

## Support

For questions about releases, contact: support@edvision.edu.vn
