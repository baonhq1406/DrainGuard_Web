"""initial DrainGuard schema
Revision ID: 0001_initial
Revises:
Create Date: 2026-09-21
"""
from alembic import op
import sqlalchemy as sa
revision='0001_initial';down_revision=None;branch_labels=None;depends_on=None
def upgrade():
    op.create_table('datasets',sa.Column('id',sa.Integer,primary_key=True),sa.Column('name',sa.String(160),nullable=False),sa.Column('version',sa.String(80),nullable=False),sa.Column('description',sa.Text),sa.Column('classes_json',sa.JSON,nullable=False),sa.Column('task',sa.String(40),nullable=False),sa.Column('image_count',sa.Integer,nullable=False),sa.Column('train_count',sa.Integer,nullable=False),sa.Column('val_count',sa.Integer,nullable=False),sa.Column('test_count',sa.Integer,nullable=False),sa.Column('source',sa.String(255)),sa.Column('storage_path',sa.String(500)),sa.Column('created_at',sa.DateTime,nullable=False),sa.Column('updated_at',sa.DateTime,nullable=False))
    op.create_table('ai_models',sa.Column('id',sa.Integer,primary_key=True),sa.Column('name',sa.String(160),nullable=False),sa.Column('version',sa.String(80),nullable=False),sa.Column('filename',sa.String(255),nullable=False),sa.Column('file_path',sa.String(500),nullable=False),sa.Column('file_size',sa.Integer,nullable=False),sa.Column('task',sa.String(40)),sa.Column('classes_json',sa.JSON),sa.Column('imgsz',sa.Integer),sa.Column('description',sa.Text),sa.Column('training_dataset_id',sa.Integer,sa.ForeignKey('datasets.id')),sa.Column('metrics_json',sa.JSON),sa.Column('uploaded_at',sa.DateTime,nullable=False),sa.Column('created_at',sa.DateTime,nullable=False),sa.Column('updated_at',sa.DateTime,nullable=False),sa.Column('is_active',sa.Boolean,nullable=False),sa.Column('status',sa.String(20),nullable=False))
    op.create_table('analysis_records',sa.Column('id',sa.Integer,primary_key=True),sa.Column('created_at',sa.DateTime,nullable=False),sa.Column('original_image',sa.String(500),nullable=False),sa.Column('annotated_image',sa.String(500)),sa.Column('latitude',sa.Float),sa.Column('longitude',sa.Float),sa.Column('drain_detected',sa.Boolean,nullable=False),sa.Column('drain_count',sa.Integer,nullable=False),sa.Column('confidence',sa.Float),sa.Column('blockage_percent',sa.Float),sa.Column('status',sa.String(30),nullable=False),sa.Column('model_id',sa.Integer,nullable=False),sa.Column('model_name',sa.String(160),nullable=False),sa.Column('model_version',sa.String(80),nullable=False),sa.Column('model_task',sa.String(40)),sa.Column('model_classes_json',sa.JSON))
def downgrade(): op.drop_table('analysis_records');op.drop_table('ai_models');op.drop_table('datasets')
