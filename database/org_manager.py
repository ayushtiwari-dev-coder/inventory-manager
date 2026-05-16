import secrets
from database.connection import get_connection
from database.sql_handler import DatabaseHelper

class OrgManager:
    @staticmethod
    def generate_join_code():
        # Clean alphanumeric generator without loading the string module
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return ''.join(secrets.choice(chars) for _ in range(6))

    @staticmethod
    def create_organization(org_name, owner_id, owner_gmail=None):
        manager_code = OrgManager.generate_join_code()
        employee_code = OrgManager.generate_join_code()
        
        db = get_connection()
        cursor = db.cursor()
        try:
            query_org = """
            INSERT INTO organizations (org_name, owner_id, owner_gmail, manager_join_code, employee_join_code)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(query_org, (org_name, owner_id, owner_gmail, manager_code, employee_code))
            org_id = cursor.lastrowid
            
            query_map = """
            INSERT INTO user_organizations (user_id, org_id, role)
            VALUES (%s, %s, 'owner')
            """
            cursor.execute(query_map, (owner_id, org_id))
            
            DatabaseHelper.log_action(cursor, org_id, owner_id, "SYSTEM", "CREATE_ORGANIZATION", {
                "org_name": org_name,
                "org_id": org_id
            })
            
            db.commit()
            return {
                "status": "success", 
                "org_id": org_id, 
                "manager_join_code": manager_code, 
                "employee_join_code": employee_code
            }
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()

    @staticmethod
    def join_organization(user_id, join_code):
        db = get_connection()
        cursor = db.cursor(dictionary=True)
        try:
            # Step 1: Look up code to see if it belongs to a manager
            query_m = "SELECT org_id FROM organizations WHERE manager_join_code = %s AND is_active = 1"
            cursor.execute(query_m, (join_code,))
            res_m = cursor.fetchone()
            
            if res_m:
                role = 'manager'
                org_id = res_m['org_id']
            else:
                # Step 2: Check if it belongs to an employee
                query_e = "SELECT org_id FROM organizations WHERE employee_join_code = %s AND is_active = 1"
                cursor.execute(query_e, (join_code,))
                res_e = cursor.fetchone()
                if res_e:
                    role = 'employee'
                    org_id = res_e['org_id']
                else:
                    return {"status": "error", "message": "Invalid or inactive join code."}

            # Step 3: Check for an existing membership row inside the same cursor block
            check_query = "SELECT is_active FROM user_organizations WHERE user_id = %s AND org_id = %s"
            cursor.execute(check_query, (user_id, org_id))
            existing = cursor.fetchone()
            
            if existing:
                if existing['is_active'] == 1:
                    return {"status": "error", "message": "You are already a member of this organization."}
                else:
                    update_query = "UPDATE user_organizations SET is_active = 1, role = %s WHERE user_id = %s AND org_id = %s"
                    cursor.execute(update_query, (role, user_id, org_id))
            else:
                query_join = "INSERT INTO user_organizations (user_id, org_id, role) VALUES (%s, %s, %s)"
                cursor.execute(query_join, (user_id, org_id, role))

            # Step 4: Write audit trail using the active transaction cursor channel
            DatabaseHelper.log_action(cursor, org_id, user_id, "SYSTEM", "JOIN_ORGANIZATION", {
                "role_assigned": role
            })

            db.commit()
            return {"status": "success", "org_id": org_id, "role": role}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()

    @staticmethod
    def change_member_role(org_id, target_user_id, admin_user_id, admin_username, new_role):
        if new_role not in ['manager', 'employee']:
            return {"status": "error", "message": "Invalid target role requested."}
            
        db = get_connection()
        cursor = db.cursor()
        try:
            query = """
            UPDATE user_organizations 
            SET role = %s 
            WHERE org_id = %s AND user_id = %s AND is_active = 1
            """
            cursor.execute(query, (new_role, org_id, target_user_id))
            
            DatabaseHelper.log_action(cursor, org_id, admin_user_id, admin_username, "CHANGE_MEMBER_ROLE", {
                "target_user_id": target_user_id,
                "new_role": new_role
            })
            
            db.commit()
            return {"status": "success"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()

    @staticmethod
    def remove_member(org_id, target_user_id, admin_user_id, admin_username):
        db = get_connection()
        cursor = db.cursor()
        try:
            query = """
            UPDATE user_organizations 
            SET is_active = 0 
            WHERE org_id = %s AND user_id = %s
            """
            cursor.execute(query, (org_id, target_user_id))
            
            DatabaseHelper.log_action(cursor, org_id, admin_user_id, admin_username, "REMOVE_MEMBER", {
                "removed_user_id": target_user_id
            })
            
            db.commit()
            return {"status": "success"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()

    @staticmethod
    def soft_delete_organization(org_id, owner_id, owner_username):
        db = get_connection()
        cursor = db.cursor()
        try:
            query_org = """
            UPDATE organizations 
            SET is_active = 0, deleted_at = CURRENT_TIMESTAMP 
            WHERE org_id = %s AND owner_id = %s
            """
            cursor.execute(query_org, (org_id, owner_id))
            
            query_maps = """
            UPDATE user_organizations 
            SET is_active = 0 
            WHERE org_id = %s
            """
            cursor.execute(query_maps, (org_id,))
            
            DatabaseHelper.log_action(cursor, org_id, owner_id, owner_username, "DELETE_ORGANIZATION", {
                "org_id": org_id
            })
            
            db.commit()
            return {"status": "success"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()