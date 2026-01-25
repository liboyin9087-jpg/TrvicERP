"""
Database initialization and seed data
"""
from app.db.database import SessionLocal, engine, Base
from app.models.models import User
from app.core.auth import get_password_hash
from datetime import datetime


def init_db():
    """Initialize database with tables"""
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")


def seed_users():
    """Seed initial users"""
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"✓ Users already seeded ({existing_users} users found)")
            return
        
        # Create default users matching frontend mock data
        users = [
            {
                "id": "user_admin",
                "username": "admin",
                "email": "admin@trvic.com",
                "hashed_password": get_password_hash("admin123"),
                "full_name": "系統管理員",
                "role": "admin",
                "is_active": True
            },
            {
                "id": "user_manager",
                "username": "manager",
                "email": "manager@trvic.com",
                "hashed_password": get_password_hash("manager123"),
                "full_name": "業務經理",
                "role": "manager",
                "is_active": True
            },
            {
                "id": "user_sales",
                "username": "sales",
                "email": "sales@trvic.com",
                "hashed_password": get_password_hash("sales123"),
                "full_name": "業務專員",
                "role": "sales",
                "is_active": True
            },
            {
                "id": "user_hr",
                "username": "hr",
                "email": "hr@trvic.com",
                "hashed_password": get_password_hash("hr123"),
                "full_name": "人資專員",
                "role": "welfare",
                "is_active": True
            },
            {
                "id": "user_employee",
                "username": "employee",
                "email": "employee@company.com",
                "hashed_password": get_password_hash("employee123"),
                "full_name": "一般員工",
                "role": "traveler",
                "is_active": True
            }
        ]
        
        for user_data in users:
            user = User(**user_data)
            db.add(user)
        
        db.commit()
        print(f"✓ Seeded {len(users)} users")
        
        # Print credentials
        print("\n默認用戶帳號:")
        print("=" * 50)
        for user_data in users:
            print(f"用戶名: {user_data['username']:12} | 密碼: {user_data['username']}123")
        print("=" * 50)
        
    except Exception as e:
        print(f"✗ Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """Main initialization function"""
    print("Initializing TrvicERP Database...")
    print("=" * 50)
    
    init_db()
    seed_users()
    
    print("\n✓ Database initialization complete!")


if __name__ == "__main__":
    main()
