import bcrypt

passwords = {
    'admin@banfield.com': 'Admin123!',
    'jrodriguez@banfield.com': 'Scout123!',
    'mfernandez@banfield.com': 'Scout123!',
    'pgomez@banfield.com': 'Scout123!',
    'lmartinez@banfield.com': 'Viewer123!'
}

print("-- Copia y pega este SQL en Supabase:\n")

for email, password in passwords.items():
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    print(f"UPDATE scouts SET password_hash = '{hashed.decode('utf-8')}' WHERE email = '{email}';")