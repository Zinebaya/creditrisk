"""
Role-based access control (RBAC) system for multi-tenant SaaS
Defines roles, permissions, and authorization helpers
"""

from enum import Enum
from typing import Set, Dict, Any

class UserRole(Enum):
    """User roles in the system"""
    SUPER_ADMIN = "super_admin"  # Platform administrator
    ENTERPRISE_ADMIN = "enterprise_admin"  # Company/enterprise administrator
    ENTERPRISE_USER = "enterprise_user"  # Regular employee of an enterprise
    
    # Legacy support
    ADMIN = "admin"  # Maps to SUPER_ADMIN
    CLIENT = "client"  # Maps to ENTERPRISE_ADMIN
    CLIENT_USER = "client_user"  # Maps to ENTERPRISE_USER


class Permission(Enum):
    """Available permissions in the system"""
    # Super Admin permissions
    VIEW_ALL_ENTERPRISES = "view_all_enterprises"
    MANAGE_ENTERPRISES = "manage_enterprises"
    VIEW_ALL_USERS = "view_all_users"
    MANAGE_ALL_USERS = "manage_all_users"
    VIEW_GLOBAL_ANALYTICS = "view_global_analytics"
    MANAGE_SUBSCRIPTIONS = "manage_subscriptions"
    MANAGE_SECTORS = "manage_sectors"
    
    # Enterprise Admin permissions
    MANAGE_ENTERPRISE = "manage_enterprise"
    MANAGE_ENTERPRISE_USERS = "manage_enterprise_users"
    MANAGE_CLIENTS = "manage_clients"
    CREATE_PREDICTIONS = "create_predictions"
    VIEW_PREDICTIONS = "view_predictions"
    VIEW_ENTERPRISE_ANALYTICS = "view_enterprise_analytics"
    MANAGE_PROFILE = "manage_profile"
    VIEW_REPAYMENTS = "view_repayments"
    MANAGE_REPAYMENTS = "manage_repayments"
    
    # Enterprise User permissions
    VIEW_CLIENTS = "view_clients"
    CREATE_PREDICTION = "create_prediction"
    VIEW_OWN_PREDICTIONS = "view_own_predictions"


# Role to permissions mapping
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.SUPER_ADMIN: {
        # Platform-wide permissions
        Permission.VIEW_ALL_ENTERPRISES,
        Permission.MANAGE_ENTERPRISES,
        Permission.VIEW_ALL_USERS,
        Permission.MANAGE_ALL_USERS,
        Permission.VIEW_GLOBAL_ANALYTICS,
        Permission.MANAGE_SUBSCRIPTIONS,
        Permission.MANAGE_SECTORS,
    },
    
    UserRole.ENTERPRISE_ADMIN: {
        # Enterprise management
        Permission.MANAGE_ENTERPRISE,
        Permission.MANAGE_ENTERPRISE_USERS,
        Permission.MANAGE_CLIENTS,
        Permission.CREATE_PREDICTIONS,
        Permission.VIEW_PREDICTIONS,
        Permission.VIEW_ENTERPRISE_ANALYTICS,
        Permission.MANAGE_PROFILE,
        Permission.VIEW_REPAYMENTS,
        Permission.MANAGE_REPAYMENTS,
    },
    
    UserRole.ENTERPRISE_USER: {
        # Limited permissions
        Permission.VIEW_CLIENTS,
        Permission.CREATE_PREDICTION,
        Permission.VIEW_OWN_PREDICTIONS,
    },
    
    # Legacy roles map to new ones
    UserRole.ADMIN: {
        Permission.VIEW_ALL_ENTERPRISES,
        Permission.MANAGE_ENTERPRISES,
        Permission.VIEW_ALL_USERS,
        Permission.MANAGE_ALL_USERS,
        Permission.VIEW_GLOBAL_ANALYTICS,
        Permission.MANAGE_SUBSCRIPTIONS,
        Permission.MANAGE_SECTORS,
    },
    
    UserRole.CLIENT: {
        Permission.MANAGE_ENTERPRISE,
        Permission.MANAGE_ENTERPRISE_USERS,
        Permission.MANAGE_CLIENTS,
        Permission.CREATE_PREDICTIONS,
        Permission.VIEW_PREDICTIONS,
        Permission.VIEW_ENTERPRISE_ANALYTICS,
        Permission.MANAGE_PROFILE,
        Permission.VIEW_REPAYMENTS,
        Permission.MANAGE_REPAYMENTS,
    },
    
    UserRole.CLIENT_USER: {
        Permission.VIEW_CLIENTS,
        Permission.CREATE_PREDICTION,
        Permission.VIEW_OWN_PREDICTIONS,
    },
}


def get_role_permissions(role: str) -> Set[Permission]:
    """Get all permissions for a given role"""
    try:
        role_enum = UserRole(role)
        return ROLE_PERMISSIONS.get(role_enum, set())
    except ValueError:
        # Unknown role
        return set()


def has_permission(role: str, permission: Permission) -> bool:
    """Check if a role has a specific permission"""
    permissions = get_role_permissions(role)
    return permission in permissions


def is_super_admin(role: str) -> bool:
    """Check if user is super admin"""
    return role in ("super_admin", "admin")


def is_enterprise_admin(role: str) -> bool:
    """Check if user is enterprise admin"""
    return role in ("enterprise_admin", "client")


def is_enterprise_user(role: str) -> bool:
    """Check if user is enterprise user"""
    return role in ("enterprise_user", "client_user")


def normalize_role(role: str) -> str:
    """Convert legacy roles to new role names"""
    mapping = {
        "admin": "super_admin",
        "client": "enterprise_admin",
        "client_user": "enterprise_user",
    }
    return mapping.get(role, role)


def get_display_name(role: str) -> str:
    """Get human-readable role name"""
    names = {
        "super_admin": "Super Admin",
        "enterprise_admin": "Enterprise Admin",
        "enterprise_user": "Enterprise User",
        "admin": "Super Admin",
        "client": "Enterprise Admin",
        "client_user": "Enterprise User",
    }
    return names.get(role, role)
