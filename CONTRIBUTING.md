# Contributing to EdVision

First off, thank you for considering contributing to EdVision! It's people like you that make EdVision such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and expected**
- **Include screenshots if possible**
- **Specify your environment** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Issue that pull request!

## Development Process

### Setup Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Ed_Vision.git
cd Ed_Vision

# Add upstream remote
git remote add upstream https://github.com/Tuanzeebee/Ed_Vision.git

# Install dependencies
cd Ed_Vision && npm install
cd ../ed_vision_backend && npm install
cd ../ml_service && pip install -r requirements.txt
```

### Coding Style

- **TypeScript/JavaScript**: Follow Airbnb style guide
- **Python**: Follow PEP 8
- **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)
- **Comments**: Write meaningful comments for complex logic

### Testing

```bash
# Frontend tests
cd Ed_Vision
npm run test

# Backend tests
cd ed_vision_backend
npm run test

# ML service tests
cd ml_service
pytest
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/my-new-feature

# Create Pull Request on GitHub
```

## Project Structure

```
Ed_Vision/
├── Ed_Vision/              # Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── modules/       # Feature modules
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom hooks
├── ed_vision_backend/      # Backend
│   ├── src/
│   │   ├── auth/          # Authentication
│   │   ├── prisma/        # Database
│   │   └── services/      # Business logic
└── ml_service/             # ML Service
    ├── model/             # ML models
    ├── data/              # Training data
    └── output_final_v2/   # Model artifacts
```

## Questions?

Feel free to contact the team at support@edvision.edu.vn
