# Design Document: Scoring System Revamp

## Overview

The Scoring System Revamp redesigns the TOEIC learning experience by introducing a question-based EXP system and clarifying score types. The system transitions from time-based EXP calculation to question-based rewards, providing more accurate reflection of learning effort and achievement.

### Key Changes

1. **Base Score (Điểm Gốc)**: Established from diagnostic test, represents starting proficiency
2. **Practice Score (Điểm Ôn Tập)**: Renamed from "Điểm Dự Phòng", accumulated through practice questions
3. **Question-Based EXP**: Replaces time-based EXP, rewards correct answers based on difficulty
4. **Exam Unlock Mechanism**: Practice Score reaching target unlocks exam simulation
5. **Enhanced Leaderboards**: Weekly and total rankings based on question-based EXP

### Design Goals

- **Accuracy**: Reflect actual learning progress through question performance
- **Motivation**: Reward quality practice over time spent
- **Clarity**: Clear distinction between score types and their purposes
- **Performance**: Sub-500ms response times for EXP calculations
- **Scalability**: Handle 50,000+ practice sessions efficiently

## Architecture

### System Components

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Student UI]
        API_CLIENT[API Client]
    end
    
    subgraph "API Layer"
        CERT_CTRL[Certificate Controller]
        STUDY_CTRL[Study Room Controller]
        LB_CTRL[Leaderboard Controller]
    end
    
    subgraph "Service Layer"
        BSC[Base Score Calculator]
        PSM[Practice Score Manager]
        QEC[Question-Based EXP Calculator]
        LBU[Leaderboard Updater]
        DIAG[Diagnostic Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
    end
    
    UI --> API_CLIENT
    API_CLIENT --> CERT_CTRL
    API_CLIENT --> STUDY_CTRL
    API_CLIENT --> LB_CTRL
    
    CERT_CTRL --> BSC
    CERT_CTRL --> PSM
    CERT_CTRL --> QEC
    
    STUDY_CTRL --> QEC
    LB_CTRL --> LBU
    
    BSC --> DB
    PSM --> DB
    QEC --> DB
    QEC --> REDIS
    LBU --> DB
    LBU --> REDIS
    DIAG --> DB
    
    style BSC fill:#e1f5ff
    style PSM fill:#e1f5ff
    style QEC fill:#fff3e0
    style LBU fill:#f3e5f5
