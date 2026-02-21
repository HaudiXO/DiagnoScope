"""Password value object with bcrypt hashing."""

import bcrypt


class Password:
    """Password value object with bcrypt hashing and verification."""

    def __init__(self, value: str) -> None:
        """Initialize password with a plaintext value.

        The value is immediately hashed using bcrypt.

        Args:
            value: The plaintext password to hash

        Raises:
            TypeError: If value is not a string
            ValueError: If value is empty or too short
        """
        if not isinstance(value, str):
            raise TypeError(
                f"Password value must be a str, got {type(value).__name__!r}"
            )
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(value) > 128:
            raise ValueError("Password must be at most 128 characters long")

        # Hash the password using bcrypt
        self._hash = bcrypt.hashpw(value.encode("utf-8"), bcrypt.gensalt(rounds=12))

    @classmethod
    def from_hash(cls, hash_value: str) -> "Password":
        """Create a Password instance from an existing hash.

        This is used when loading a user from the database.

        Args:
            hash_value: The existing bcrypt hash

        Returns:
            A Password instance with the given hash
        """
        instance = cls.__new__(cls)
        instance._hash = (
            hash_value.encode("utf-8") if isinstance(hash_value, str) else hash_value
        )
        return instance

    def verify(self, plaintext: str) -> bool:
        """Verify a plaintext password against the stored hash.

        Args:
            plaintext: The plaintext password to verify

        Returns:
            True if the password matches, False otherwise
        """
        if not isinstance(plaintext, str):
            return False
        return bcrypt.checkpw(plaintext.encode("utf-8"), self._hash)

    @property
    def hash(self) -> str:
        """Get the password hash as a string."""
        return (
            self._hash.decode("utf-8") if isinstance(self._hash, bytes) else self._hash
        )

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Password):
            return self._hash == other._hash
        return False

    def __hash__(self) -> int:
        return hash(self._hash)

    def __repr__(self) -> str:
        return "Password(<hashed>)"
