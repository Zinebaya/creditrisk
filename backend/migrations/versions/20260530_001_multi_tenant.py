"""Add multi-tenant support: Enterprise and Repayment tables, update User schema

Revision ID: 20260530_001_multi_tenant
Revises: 2539315e7724
Create Date: 2026-05-30 12:06:33

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

revision = '20260530_001_multi_tenant'
down_revision = '2539315e7724'
branch_labels = None
depends_on = None


def upgrade():
    """Create new tables and migrate schema for multi-tenant support"""
    
    # Create enterprises table (new)
    op.create_table(
        'enterprises',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(256), nullable=False),
        sa.Column('sector', sa.String(128), nullable=False),
        sa.Column('email', sa.String(256), nullable=False, unique=True),
        sa.Column('phone', sa.String(32), nullable=False),
        sa.Column('address', sa.String(512), nullable=True),
        sa.Column('wilaya', sa.String(128), nullable=True),
        sa.Column('city', sa.String(120), nullable=True),
        sa.Column('subscription_status', sa.String(32), nullable=False, server_default='free'),
        sa.Column('plan_tier', sa.String(32), nullable=False, server_default='free'),
        sa.Column('subscription_expires_at', sa.DateTime(), nullable=True),
        sa.Column('stripe_customer_id', sa.String(256), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(256), nullable=True),
        sa.Column('total_users', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('total_predictions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_clients', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(512), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_enterprises_name', 'name'),
        sa.Index('ix_enterprises_email', 'email'),
    )
    
    # Create repayments table (new)
    op.create_table(
        'repayments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('prediction_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(32), nullable=False, server_default='en_cours'),
        sa.Column('loan_amount', sa.Integer(), nullable=True),
        sa.Column('paid_amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('start_date', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('last_payment_date', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.String(1000), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['prediction_id'], ['predictions.id']),
        sa.Index('ix_repayments_client_id', 'client_id'),
        sa.Index('ix_repayments_prediction_id', 'prediction_id'),
    )
    
    # Update users table to add new columns
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Add enterprise_id column for new multi-tenant support
        try:
            batch_op.add_column(sa.Column('enterprise_id', sa.Integer(), nullable=True))
            batch_op.create_foreign_key('fk_users_enterprise_id', 'enterprises', ['enterprise_id'], ['id'])
        except:
            pass  # Column might already exist
        
        # Update role default to 'enterprise_user' for new registrations
        # Note: existing roles will be migrated in a data migration


def downgrade():
    """Revert schema changes"""
    
    # Drop repayments table
    op.drop_table('repayments')
    
    # Drop enterprises table  
    op.drop_table('enterprises')
    
    # Remove enterprise_id from users
    with op.batch_alter_table('users', schema=None) as batch_op:
        try:
            batch_op.drop_constraint('fk_users_enterprise_id', type_='foreignkey')
            batch_op.drop_column('enterprise_id')
        except:
            pass
