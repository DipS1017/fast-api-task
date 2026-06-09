"""User-facing API messages.

Centralised so the wording lives in one place and the routers stay free of
inline string literals.
"""


class AuthMessages:
    EMAIL_ALREADY_REGISTERED = "Email already registered"
    INVALID_CREDENTIALS = "Invalid email or password"
    COULD_NOT_VALIDATE_CREDENTIALS = "Could not validate credentials"
    ADMIN_ACCESS_REQUIRED = "Admin access required"


class CandidateMessages:
    NOT_FOUND = "Candidate not found"
