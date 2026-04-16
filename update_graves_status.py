#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from app import create_app
from app.extensions import db
from app.models import Grave

app = create_app()
with app.app_context():
    # Update all graves with NULL status to default
    updated = db.session.query(Grave).filter(Grave.status == None).update({'status': 'plánováno'})
    db.session.commit()
    print(f'Updated {updated} graves with default status')
