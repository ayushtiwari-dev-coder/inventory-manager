import bcrypt


def hashing_password(password):
    # password.encode() turns the string into bytes for bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8') # Store this in db

# Call this during Login
def check_password(password, hashed_from_db):
    # This checks if the entered password matches the DB hash
    return bcrypt.checkpw(password.encode('utf-8'), hashed_from_db.encode('utf-8'))