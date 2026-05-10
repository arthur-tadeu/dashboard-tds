# TDS25 Productivity Dashboard

Professional dashboard for monitoring team productivity in Roboflow labeling tasks.

## 📁 Project Structure

```text
dashbaoird.epi/
├── src/
│   ├── frontend/               # Dashboard Web App
│   │   ├── assets/             # Static assets (images, icons)
│   │   ├── css/                # Stylesheets
│   │   ├── js/                 # Modular Javascript Services
│   │   │   ├── firebase-config.js  # [ACTION REQUIRED]
│   │   │   ├── auth-service.js     # Firebase Auth Logic
│   │   │   ├── api-service.js      # Roboflow API Integration
│   │   │   ├── ui-controller.js    # DOM & Charts Management
│   │   │   ├── metas-service.js    # Firestore Goals Logic
│   │   │   └── app.js              # Application Entry Point
│   │   └── index.html          # Main Interface
│   └── scripts/                # Data Processing & Monitoring
│       ├── monitor.py          # Roboflow Stats Extractor
│       └── requirements.txt    # Python Dependencies
├── README.md
└── .gitignore
```

## 🚀 Getting Started

### 1. Firebase Setup (Required)
This application uses Firebase for Authentication and Firestore.
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project.
3.  Enable **Authentication** (Google Provider).
4.  Enable **Cloud Firestore** (Start in test mode or create rules).
5.  Create a Web App in the project and copy the `firebaseConfig` object.
6.  Paste the configuration in `src/frontend/js/firebase-config.js`.

### 2. Frontend Development
To run the dashboard, simply open `src/frontend/index.html` in a local server (like Live Server in VS Code).

### 3. Python Monitoring
To run the Python monitoring script:
```bash
python src/scripts/monitor.py
```
*Tip: Set your `ROBOFLOW_API_KEY` as an environment variable for better security.*

## 🛠 Technologies
- **Frontend**: HTML5, Vanilla CSS, JS (ES6 modules).
- **Charts**: Chart.js.
- **Backend/DB**: Firebase (Auth & Firestore).
- **API**: Roboflow API.
- **Scripts**: Python 3.
