# cloudS

<!-- Badges -->
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/java-24-orange.svg)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](#)

A secure, open source cloud storage platform with end-to-end encryption.

## Table of Contents
- [About](#about)
- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## About
cloudS provides privacy-first file storage. Files are encrypted in the browser using Curve25519-based key pairs and AES-GCM before being uploaded. A Spring Boot API handles authentication, metadata, and interaction with S3 storage while a React interface manages the user experience.

## Features
- 🔐 Client-side key generation and AES-GCM encryption
- 📁 Upload, download, and manage files securely
- 📫 Email-based registration and login with verification
- 👤 Profile management with password updates and account deletion
- 🖥️ Responsive React dashboard with drag-and-drop uploads
- ☁️ Spring Boot backend with PostgreSQL and AWS S3 integration

## Screenshots
![Storage with files](https://i.postimg.cc/rwTX50Hy/asd.png)
![Key generation diagram](https://i.postimg.cc/rwTX50Hy/asd.png)
![User profile](https://i.postimg.cc/rwTX50Hy/asd.png)
![Password or account deletion](https://i.postimg.cc/rphB6hwz/unnamed-1.png)
![Upload files](https://i.postimg.cc/DwcV6fVr/unnamed-2.png)
![Empty storage](https://i.postimg.cc/hG4k5FgH/unnamed-3.png)
![Registration window](https://postimg.cc/9RPLNXJ8)

## Installation
### Backend
1. Install JDK 24 and PostgreSQL.
2. Configure your environment variables for database, AWS S3, and mail settings.
3. Run:
   ```bash
   cd server
   ./gradlew bootRun
   ```
   The API will be available at `http://localhost:8080`.

### Frontend
1. Install Node.js 18+.
2. Install dependencies and start the dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Access the app at `http://localhost:5173`.

## Usage

# ! The service is currently disabled.

- Register and verify an account, then log in.
- Upload files via drag-and-drop or the upload button. Files are encrypted before upload.
- link: cloud-s-secure-project.xyz

## Contributing
Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License
Distributed under the MIT License. See [LICENSE](LICENSE) for details.

