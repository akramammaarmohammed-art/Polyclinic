from main import Base, engine, SessionLocal, User, UserRole, get_password_hash

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")
    
    # Re-create admin since we wiped it
    db = SessionLocal()
    if not db.query(User).filter(User.username == "admin").first():
        print("Restoring Admin User...")
        admin = User(
                username="admin", 
                password_hash=get_password_hash("admin123"),
                role=UserRole.SENIOR_ADMIN,
                is_active=True
        )
        db.add(admin)
        db.commit()
        print("Admin user restored (admin/admin123).")
    db.close()

if __name__ == "__main__":
    confirm = input("This will WIPE ALL DATA. Type 'yes' to continue: ")
    if confirm == "yes":
        reset_database()
