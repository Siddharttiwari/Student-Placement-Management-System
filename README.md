
# 🎓 Student Placement Management System

A full-stack web application designed to streamline college
placement activities by connecting students and Training &
Placement Officers (TPOs).

Built using Django REST Framework, React, MySQL, and Tailwind CSS.

## 🚀 Features

### 👨‍🎓 Student Module
- Student registration and login
- Profile management
- PDF resume upload
- Browse available placement drives
- Automatic eligibility checking based on CGPA and course
- Apply for placement opportunities
- Track application status

### 🧑‍💼 TPO Module
- Role-based TPO authentication
- Dashboard with live placement statistics
- Company management
- Placement drive management
- Review student applications
- Shortlist, reject, and select candidates
- Search and filter applications

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, Django, Django REST Framework |
| Database | MySQL |
| Authentication | Django Session Authentication, CSRF |
| API Communication | Axios |
| Version Control | Git, GitHub |

## 🏗 Project Structure

```text
Student_Placement_Portal/
├── backend/
│   ├── accounts/
│   ├── students/
│   ├── companies/
│   ├── placements/
│   ├── config/
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🔄 Placement Workflow

1. Student registers and completes their profile.
2. TPO registers recruiting companies.
3. TPO creates placement drives.
4. System checks student eligibility.
5. Eligible students apply for jobs.
6. TPO reviews applications.
7. TPO shortlists, rejects, or selects candidates.
8. Students track their application status.

## ⚙️ Local Setup

### Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure MySQL and required environment variables
in a local `.env` file.

Run migrations:

```bash
python manage.py migrate
```

Start Django:

```bash
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open:

http://127.0.0.1:5173

## 🔐 Security

- Role-based access control
- Django session authentication
- CSRF protection
- Server-side validation
- Environment-based secrets

## 📌 Future Enhancements

- Placement analytics and visualizations
- Advanced student search
- Recruitment reports
- Docker deployment
- Automated testing

## 👨‍💻 Author

Siddharth Tiwari

MCA Student | Python | Django | React | AI/ML

## 📄 License

No license has been specified yet.
```
