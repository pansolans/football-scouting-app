import bcrypt

print("=== CREAR NUEVO USUARIO PARA SISTEMA DE SCOUTING ===\n")

# Solicitar datos
email = input("Email del usuario: ")
password = input("Contraseña: ")
name = input("Nombre completo: ")

print("\nRoles disponibles:")
print("1. admin (acceso total)")
print("2. head_scout (jefe de scouting)")
print("3. scout (scout normal)")
print("4. viewer (solo lectura)")

role_option = input("\nElige rol (1-4): ")
roles = {
    "1": "admin",
    "2": "head_scout", 
    "3": "scout",
    "4": "viewer"
}
role = roles.get(role_option, "viewer")

print("\nClub del usuario:")
print("1. Club Atlético Banfield")
print("2. Boca Juniors")
print("3. Santa Fe Fútbol Club")  
print("4. Scouting FC")
print("5. UAI Urquiza")
print("6. TAGENCY")      
club_option = input("\nElige club (1-6): ")  # CAMBIAR A 1-3
clubs = {
    "1": "Club Atlético Banfield",
    "2": "Boca Juniors",
    "3": "Santa Fe Fútbol Club", 
    "4": "Scouting FC",
    "5": "UAI Urquiza", 
    "6": "TAGENCY",     
}
club = clubs.get(club_option, "Club Atlético Banfield")

department = input("Departamento/Área: ")

# Generar hash
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)

# Generar SQL
print("\n" + "="*50)
print("COPIA Y PEGA ESTE SQL EN SUPABASE:")
print("="*50 + "\n")

sql = f"""INSERT INTO scouts (
    email, 
    password_hash, 
    name, 
    role, 
    organization,
    department,
    club_id,
    is_active
) VALUES (
    '{email}',
    '{hashed.decode('utf-8')}',
    '{name}',
    '{role}',
    '{club}',
    '{department}',
    (SELECT id FROM clubs WHERE name = '{club}'),
    true
);"""

print(sql)
print("\n" + "="*50)
print(f"Usuario: {email}")
print(f"Contraseña: {password}")
print(f"Rol: {role}")
print(f"Club: {club}")
print("="*50)