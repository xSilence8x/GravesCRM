# Dokumentace 
```bash
backend/
│
├─ app/
│  ├─ __init__.py
│  ├─ config.py
│  │
│  ├─ models/
│  │   ├─ user.py
│  │   └─ client.py
│  │
│  ├─ routes/
│  │   ├─ auth.py
│  │   └─ clients.py
│  │
│  ├─ services/
│  │   └─ auth_service.py
│  │
│  └─ extensions.py
│
├─ migrations/
└─ run.py
```

## Run app:
Run Flask:
```bash
flask run
```
Run React:
```bash
frontend/npm run dev
```