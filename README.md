# 🏭 Dashboard Canang Indah

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18%2B-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

Dashboard sistem monitoring dan quality control untuk PT Canang Indah - Wood Processing Factory (Particle Board Industry)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [License](#license)

## 🎯 Overview

Dashboard Canang Indah adalah aplikasi web untuk monitoring dan quality control di pabrik pengolahan kayu PT Canang Indah. Aplikasi ini memungkinkan admin, supervisor, dan lab staff untuk mengelola data QC, dokumen, dan proses produksi secara digital.

## ✨ Features

### 🔐 Authentication
- **Login System** - Secure authentication dengan JWT token
- **Register System** - User registration dengan role-based access
- **Password Security** - Bcrypt hashing dengan validasi kompleksitas password

### 👥 User Roles

#### **Admin**
- Full access ke semua fitur
- QC Management
- Lab PB Form Management
- Flakes Monitoring
- Resin Monitoring
- Document List Management

#### **Supervisor**
- View Document
- Edit Document
- Limited access ke specific modules

#### **Lab Staff**
- **Lab PB** - Quality control untuk Particle Board
- **Lab MDF** - Quality control untuk MDF (On Development)

### 📊 Modules
- **HomePage** - Dashboard overview
- **Lab PB** - Particle Board quality control
- **Admin1** - QC, Lab PB Form, Flakes, Resin, Document List
- **Admin2** - On Development
- **Lab MDF** - On Development

## 🛠 Tech Stack

### Frontend
- **React 18** - UI Library
- **React Router** - Navigation
- **Axios** - HTTP Client
- **CSS3** - Styling dengan custom animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment variables
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **cors** - Cross-origin resource sharing

## 📁 Project Structure
dashboard-canang-indah/
├── Backend/
│ ├── server.js # Main server file
│ ├── .env # Environment variables
│ ├── package.json
| ├── package-lock.json
│ └── node-modules
│
├── Frontend/Canang-Indah
│ ├── node-modules
│ ├── src/
│ │ ├── assets
│ │ ├── auth/
│ │ | ├── Login.css
│ │ | ├── Login.jsx
│ │ | ├── Register.css
│ │ | ├── Register.jsx
│ │ ├── components/
│ │ │ ├── InspectionTable.jsx
│ │ │ ├── QCAnalisaHeader.jsx
│ │ │ ├── QCAnalisaStandardRow.jsx
│ │ │ ├── QCAnalisaTable.jsx
│ │ │ ├── QCAnalisaTableRow.jsx
│ │ │ ├── ResinInspectionFooter.jsx
│ │ │ ├── ResinInspectionHeader.jsx
│ │ │ └── SampleTable.jsx
│ │ │ ├── SolidContentTable.jsx
│ │ ├── Dashboard/
│ │ │ ├── DashboardLayout.css
│ │ │ ├── DashboardLayout.jsx
│ │ ├── forms/
│ │ │ ├── DokumenList.css
│ │ │ ├── DokumenList.jsx
│ │ │ ├── FlakesForm.css
│ │ │ ├── FlakesForm.jsx
│ │ │ ├── FlakesFormView.css
│ │ │ ├── FlakesFormView.jsx
│ │ │ ├── LabPBForm.css
│ │ │ ├── LabPBForm.jsx
│ │ │ ├── LabPBFormView.jsx
│ │ │ ├── QCAnalisaForm.jsx
│ │ │ ├── QCAnalisaView.css
│ │ │ ├── QCAnalisaView.jsx
│ │ │ ├── ResinInspectionForm.css
│ │ │ ├── ResinInspectionForm.jsx
│ │ │ ├── ResinInspectionView.jsx
│ │ │ ├── ResinInspectionView.css
│ │ └── helper/
│ │ │ ├── Helper.js
│ │ │ ├── useFormPersistence.js
│ │ └── hooks/
│ │ │ ├── useFlakesForm.js
│ │ │ ├── useLabPBForm.js
│ │ │ ├── useResinInspectionForm.js
│ │ └── hooks/
│ │ │ ├── HomePage.css
│ │ │ ├── HomePage.jsx
│ │ │ ├── LabMDFPage.jsx
│ │ │ ├── LabPBPage.jsx
│ │ │ ├── SupervisorPage.css
│ │ │ ├── SupervisorPage.jsx
│ │ └── sections/
│ │ │ ├── BendingStrangeSection.jsx
│ │ │ ├── ConsHardenerSection.jsx
│ │ │ ├── DataUtamaSection.jsx
│ │ │ ├── DensityProfileSection.jsx
│ │ │ ├── FormSection.jsx
│ │ │ ├── GelTimeSection.jsx
│ │ │ ├── InternalBondingSection.jsx
│ │ │ ├── McBoardSection.jsx
│ │ │ ├── ScrewTestSection.jsx
│ │ │ ├── SurfaceSoundnessSection.jsx
│ │ │ ├── SwellingSection.jsx
│ │ │ ├── TebalFlakesSection.jsx
│ │ └── services/
│ │ │ ├── Api.js
│ │ └── utils/
│ │ │ ├── auth.js
│ │ │ ├── calculations.js
│ │ │ ├── flakesUtils.js
│ │ │ ├── RequireAuth.jsx
│ │ └── App.css
│ │ └── App.jsx
│ │ └── index.css
│ │ └── main.jsx
│ ├── .env # Environment variables
│ ├── .gitignore
│ ├── eslint.config.js
│ ├── index.html
│ ├── package-lock.json
│ ├── package.json
│ ├── readme.md
│ ├── vite.config.js
|
|
├── database/
│ ├── schema.sql # Database schema
|
│
├── .gitignore
├── README.md
└── LICENSE



## 🚀 Installation

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### Step 1: Clone Repository

```bash
git clone https://github.com/Iamwillypieter/Canang-Indah-Dashboard.git
```


📸 Screenshots
Login Page
<img width="2559" height="1100" alt="Screenshot 2026-02-09 145619" src="https://github.com/user-attachments/assets/ad8ffbba-ff9c-4dec-ace5-19d2b9d4b354" />

Register Page
<img width="2529" height="1109" alt="Screenshot 2026-02-09 145940" src="https://github.com/user-attachments/assets/7c09a9e1-b6cc-4b86-b394-4bf5ba20d0c3" />

Home Page
<img width="2530" height="1099" alt="Screenshot 2026-02-11 090656" src="https://github.com/user-attachments/assets/2dd6d98c-f60b-4349-91e4-01d0bd2293ca" />
<img width="2527" height="1105" alt="Screenshot 2026-02-11 091408" src="https://github.com/user-attachments/assets/286b09dc-aa76-4d89-bd23-dd2cf2db8af4" />

Lab PB Page
<img width="2531" height="1106" alt="Screenshot 2026-02-11 091843" src="https://github.com/user-attachments/assets/97c4133a-b13b-43cb-ba67-e1b7a71766ff" />
<img width="2531" height="1098" alt="Screenshot 2026-02-11 092155" src="https://github.com/user-attachments/assets/40420ab9-d773-4d73-9ff8-5ca16b812f19" />
<img width="2530" height="1104" alt="Screenshot 2026-02-11 092218" src="https://github.com/user-attachments/assets/50674926-3279-4f6e-8ee0-38efc0a6fce7" />
<img width="2532" height="1101" alt="Screenshot 2026-02-11 092458" src="https://github.com/user-attachments/assets/aa543acf-77c0-4075-9f09-e5fab8c52e01" />
<img width="478" height="1003" alt="Screenshot 2026-02-11 092547" src="https://github.com/user-attachments/assets/ad76540a-5813-483e-af49-c71853141945" />
<img width="636" height="749" alt="Screenshot 2026-02-11 092620" src="https://github.com/user-attachments/assets/00ac4414-b653-44a6-90fb-3c96fc8c5c07" />
<img width="635" height="735" alt="Screenshot 2026-02-11 092632" src="https://github.com/user-attachments/assets/1687b014-f921-43c7-b6da-3df207701977" />
<img width="636" height="749" alt="Screenshot 2026-02-11 092643" src="https://github.com/user-attachments/assets/f5f0a467-8631-4dcd-9f51-a4a44b5985af" />
<img width="637" height="1004" alt="Screenshot 2026-02-11 092656" src="https://github.com/user-attachments/assets/5a9924ab-2406-4a9c-bdb3-d5d5ab27f3a8" />
<img width="695" height="1030" alt="Screenshot 2026-02-11 092758" src="https://github.com/user-attachments/assets/17a03dfd-e889-45d4-bb3a-688ea2ce0edf" />
<img width="2528" height="1102" alt="Screenshot 2026-02-11 092940" src="https://github.com/user-attachments/assets/484e9ac1-9136-4eef-b283-f01a5e2f582c" />
<img width="1394" height="879" alt="Screenshot 2026-02-11 093008" src="https://github.com/user-attachments/assets/ba9f903c-f116-477b-ab63-ab34f3020236" />  
<img width="925" height="966" alt="Screenshot 2026-02-11 093024" src="https://github.com/user-attachments/assets/344c40a6-8d6c-4cc2-b7e6-543f0e37b256" />
<img width="2530" height="1098" alt="Screenshot 2026-02-11 093115" src="https://github.com/user-attachments/assets/90081430-3489-4de5-a0af-8268cc9f4677" />

Supervisor Page

<img width="2528" height="1103" alt="Screenshot 2026-02-11 093551" src="https://github.com/user-attachments/assets/685f5722-8399-4862-892c-cbdc3720e426" />

<img width="2527" height="1101" alt="Screenshot 2026-02-11 094054" src="https://github.com/user-attachments/assets/40d09aac-830e-435c-afdb-2d003cf88bd9" />

<img width="2528" height="1100" alt="Screenshot 2026-02-11 094252" src="https://github.com/user-attachments/assets/f2fa9063-4ed7-47a9-b445-1fe7711d2458" />

<img width="2526" height="1101" alt="Screenshot 2026-02-11 094307" src="https://github.com/user-attachments/assets/bed1723c-33db-4e8e-8973-6db60b258f77" />





