# Dokumentace 
```bash
backend/
│
├─ app/
│  ├─ routes/
│  ├─ services/
│  ├─ static/
│  ├─ utils/
│  ├─ __init__.py
│  ├─ config.py
│  ├─ extensions.py
│  └─ models.py
├─ docs/
├─ frontend/
├─ migrations/
└─ run.py
...
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

## Generate new Token Encryption Key
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```