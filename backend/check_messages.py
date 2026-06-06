#!/usr/bin/env python
"""Quick test script to verify contact messages in database."""

import sys
import os
sys.path.insert(0, '.')

from services.db import DatabaseService

db_path = os.path.join(os.path.dirname(__file__), 'credit_risk.db')
database_url = f"sqlite:///{db_path.replace(chr(92), '/')}"
db = DatabaseService(database_url)
messages, total = db.get_contact_messages()

print(f"Total messages: {total}")
print("-" * 60)

for msg in messages:
    print(f"ID: {msg['id']}")
    print(f"From: {msg['name']} <{msg['email']}>")
    print(f"Subject: {msg['subject']}")
    print(f"Type: {msg['message_type']}")
    print(f"Read: {msg['is_read']}")
    print(f"Date: {msg['created_at']}")
    print(f"Message: {msg['message'][:100]}...")
    print("-" * 60)
