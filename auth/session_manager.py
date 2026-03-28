import os
import pickle

# Path for the session file
SESSION_FILE = "auth/session.pkl"

# Save the user session (username)
def save_session(username):
    with open(SESSION_FILE, "wb") as session_file:
        pickle.dump(username, session_file)

# Load the user session
def load_session():
    if os.path.exists(SESSION_FILE):
        with open(SESSION_FILE, "rb") as session_file:
            username = pickle.load(session_file)
            return username
    return None

# Clear the user session (log out)
def clear_session():
    if os.path.exists(SESSION_FILE):
        os.remove(SESSION_FILE)