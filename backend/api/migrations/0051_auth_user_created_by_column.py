from django.db import migrations


def add_created_by_column(apps, schema_editor):
    # Guarded DDL to keep this safe across environments.
    schema_editor.execute(
        """
        ALTER TABLE auth_user
        ADD COLUMN IF NOT EXISTS created_by_id integer NULL;
        """
    )
    schema_editor.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'auth_user_created_by_id_fk'
            ) THEN
                ALTER TABLE auth_user
                ADD CONSTRAINT auth_user_created_by_id_fk
                FOREIGN KEY (created_by_id) REFERENCES auth_user(id)
                ON DELETE SET NULL;
            END IF;
        END$$;
        """
    )
    schema_editor.execute(
        """
        CREATE INDEX IF NOT EXISTS auth_user_created_by_id_idx
        ON auth_user(created_by_id);
        """
    )


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0050_appversion"),
    ]

    operations = [
        migrations.RunPython(add_created_by_column, noop_reverse),
    ]
