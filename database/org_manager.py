import secrets
from security.auth_deps import create_passport
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
            org_token=create_passport(
                user_id=owner_id,
                username="SYSTEM",
                org_id=org_id,
                role="owner"
            )
            return {
                "status": "success",
                "org_token":org_token, 
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
            query_m = "SELECT org_id, org_name FROM organizations WHERE manager_join_code = %s AND is_active = 1"
            cursor.execute(query_m, (join_code,))
            res_m = cursor.fetchone()

            if res_m:
                role = 'manager'
                org_id = res_m['org_id']
            else:
                # Step 2: Check if it belongs to an employee
                query_e = "SELECT org_id, org_name FROM organizations WHERE employee_join_code = %s AND is_active = 1"
                cursor.execute(query_e, (join_code,))
                res_e = cursor.fetchone()

                if res_e:
                    role = 'employee'
                    org_id = res_e['org_id']
                else:
                    return {"status": "error", "message": "Invalid or inactive join code."}

            # ---> NEW STEP: Check if the user is banned from this specific organization
            ban_check_query = "SELECT reason FROM banned_users WHERE org_id = %s AND user_id = %s"
            cursor.execute(ban_check_query, (org_id, user_id))
            banned_record = cursor.fetchone()
            
            if banned_record:
                return {
                    "status": "error", 
                    "message": f"You have been banned from this workspace. Reason: {banned_record['reason']}"
                }

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
            return {
                "status": "success", 
                "org_id": org_id, 
                "role": role,
                "org_name": res_m['org_name'] if res_m else res_e['org_name']
            }

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
    def remove_member(org_id, target_user_id, admin_user_id, admin_username, admin_role, reason="Removed by administrator"):
        db = get_connection()
        cursor = db.cursor(dictionary=True) # Use dictionary to read role cleanly
        try:
            # ---> HIERARCHY SECURITY CHECK <---
            cursor.execute("SELECT role FROM user_organizations WHERE org_id = %s AND user_id = %s AND is_active = 1", (org_id, target_user_id))
            target = cursor.fetchone()
            
            if not target:
                return {"status": "error", "message": "Target user is not an active member."}
                
            if admin_role == 'manager' and target['role'] in ['owner', 'manager']:
                return {"status": "error", "message": "Permission Denied: Managers can only remove standard employees."}

            # 1. Soft delete them from the active workspace
            query = """
                UPDATE user_organizations
                SET is_active = 0
                WHERE org_id = %s AND user_id = %s
            """
            cursor.execute(query, (org_id, target_user_id))

            # 2. Automatically drop them into the banned_users table
            ban_query = """
                INSERT IGNORE INTO banned_users (org_id, user_id, reason)
                VALUES (%s, %s, %s)
            """
            cursor.execute(ban_query, (org_id, target_user_id, reason))

            # 3. Log the action
            DatabaseHelper.log_action(cursor, org_id, admin_user_id, admin_username, "REMOVE_MEMBER", {
                "removed_user_id": target_user_id,
                "reason": reason
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

    @staticmethod
    def get_org_profile(org_id, user_role):
        
        db = get_connection()
        cursor = db.cursor(dictionary=True)
        try:
            # If the user is an owner or manager, they see the actual codes. 
            # If they are an employee, the database evaluates the condition and returns NULL.
            query = """
                SELECT 
                    org_id, 
                    org_name, 
                    owner_id, 
                    created_at,
                    CASE 
                        WHEN %s IN ('owner', 'manager') THEN manager_join_code 
                        ELSE NULL 
                    END AS manager_join_code,
                    CASE 
                        WHEN %s IN ('owner', 'manager') THEN employee_join_code 
                        ELSE NULL 
                    END AS employee_join_code
                FROM organizations 
                WHERE org_id = %s AND is_active = 1
            """
            cursor.execute(query, (user_role, user_role, org_id))
            return cursor.fetchone()
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()




    @staticmethod
    def get_organization_audit_logs(org_id: int, limit: int = 100):
        """
        Retrieves the chronological audit ledger trail for tracking system adjustments.
        Delegates execution directly to the SQL handler layer.
        """
        query = """
            SELECT log_id as id, action_type, details, username, created_at as timestamp
            FROM audit_logs
            WHERE org_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """
        # Executing through your database wrapper using 1 for fetchall
        return DatabaseHelper.execute_query(query, (org_id, limit), fetch_type=1)
    


    @staticmethod
    def get_org_members(org_id):
        query = """
            SELECT u.user_id, u.username, u.name, u.user_gmail, uo.role, uo.created_at
            FROM user_organizations uo
            JOIN users u ON uo.user_id = u.user_id
            WHERE uo.org_id = %s AND uo.is_active = 1 AND u.is_active = 1
            ORDER BY FIELD(uo.role, 'owner', 'manager', 'employee'), u.username ASC
        """
        return DatabaseHelper.execute_query(query, (org_id,), fetch_type=1)
    
    

    @staticmethod
    def get_banned_users(org_id):
        query = """
            SELECT bu.user_id, u.username, u.name, bu.reason, bu.banned_at
            FROM banned_users bu
            JOIN users u ON bu.user_id = u.user_id
            WHERE bu.org_id = %s
            ORDER BY bu.banned_at DESC
        """
        return DatabaseHelper.execute_query(query, (org_id,), fetch_type=1)

    @staticmethod
    def unban_user(org_id, target_user_id, admin_user_id, admin_username):
        db = get_connection()
        cursor = db.cursor()
        try:
            # Remove the user from the ban list
            query = "DELETE FROM banned_users WHERE org_id = %s AND user_id = %s"
            cursor.execute(query, (org_id, target_user_id))

            # Log the action
            DatabaseHelper.log_action(cursor, org_id, admin_user_id, admin_username, "UNBAN_USER", {
                "unbanned_user_id": target_user_id
            })

            db.commit()
            return {"status": "success"}
        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            cursor.close()
            db.close()