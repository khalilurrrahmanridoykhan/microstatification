# Target server work list

Use this on the destination VPS `72.61.170.115` after logging in as `root`.

## 1. Install base packages

```bash
apt update
apt install -y python3 python3-venv python3-pip build-essential libpq-dev postgresql postgresql-client redis-server nginx rsync curl unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
systemctl enable --now postgresql redis-server nginx
```

## 2. Copy the project from the source VPS

Choose a source SSH user that can read `/var/www/ComMicPlanV2_clone_2_Mar` on the current VPS.

```bash
mkdir -p /var/www/ComMicPlanV2_clone_2_Mar
rsync -avz --progress \
  <SOURCE_SSH_USER>@119.40.87.37:/var/www/ComMicPlanV2_clone_2_Mar/migration_bundle_20260328/ \
  /var/www/ComMicPlanV2_clone_2_Mar/migration_bundle_20260328/
rsync -avz --progress \
  --exclude-from=/var/www/ComMicPlanV2_clone_2_Mar/migration_bundle_20260328/rsync-excludes.txt \
  <SOURCE_SSH_USER>@119.40.87.37:/var/www/ComMicPlanV2_clone_2_Mar/ \
  /var/www/ComMicPlanV2_clone_2_Mar/
```

For a full independent Enketo clone, also copy the live Enketo runtime:

```bash
mkdir -p /opt/enketo/packages/enketo-express
rsync -avz --progress \
  <SOURCE_SSH_USER>@119.40.87.37:/opt/enketo/packages/enketo-express/ \
  /opt/enketo/packages/enketo-express/
```

If direct `rsync` is not possible, copy these from the source another way:
- `/var/www/ComMicPlanV2_clone_2_Mar`
- `/opt/enketo/packages/enketo-express` for full Enketo independence

## 3. Edit the cloned env files on the target

Edit these files and replace old source URLs/IPs with the new target IP or final domain:
- `/var/www/ComMicPlanV2_clone_2_Mar/.env`
- `/var/www/ComMicPlanV2_clone_2_Mar/frontend/.env`
- `/var/www/ComMicPlanV2_clone_2_Mar/frontend/.env.development`
- `/var/www/ComMicPlanV2_clone_2_Mar/frontend/.env.production.nmcp`

Set at minimum:
- `FRONTEND_URL=http://72.61.170.115:9200`
- `OPENROSA_SERVER_URL=http://72.61.170.115:9200/api/openrosa`
- `ALLOWED_HOSTS=127.0.0.1,localhost,72.61.170.115`
- `CSRF_TRUSTED_ORIGINS=http://72.61.170.115:9200`
- `ENKETO_ALLOWED_ORIGINS=http://72.61.170.115:9200`
- `VITE_BACKEND_URL=http://72.61.170.115:9200`
- `VITE_OPENROSA_SERVER_URL=http://72.61.170.115:9200/api/openrosa`

If you are not cloning Enketo yet, leave:
- `ENKETO_URL=https://enketo2.commicplan.com`
- `VITE_ENKETO_URL=https://enketo2.commicplan.com`

If you want a fully independent local Enketo on the target, also edit:
- `/opt/enketo/packages/enketo-express/.env`

Then set those Enketo values to the target IP or domain instead of the old source domain.

## 4. Restore the database and rebuild the app

Run the helper script already staged in the bundle:

```bash
bash /var/www/ComMicPlanV2_clone_2_Mar/migration_bundle_20260328/target/setup_target.sh
```

This script will:
- create the Postgres role/database if missing
- restore the staged dump
- create `/var/www/ComMicPlanV2_clone_2_Mar/.venv`
- install backend requirements
- install frontend packages and rebuild `frontend/dist`
- run Django migrations and `collectstatic`

## 5. Install Nginx config for the clone

```bash
cp /var/www/ComMicPlanV2_clone_2_Mar/migration_bundle_20260328/config/nginx/commicplan_clone_2_mar_9200.conf \
  /etc/nginx/sites-available/commicplan_clone_2_mar_9200.conf
ln -sf /etc/nginx/sites-available/commicplan_clone_2_mar_9200.conf \
  /etc/nginx/sites-enabled/commicplan_clone_2_mar_9200.conf
nginx -t
systemctl reload nginx
```

## 6. Start the Django clone services

Use the bundled systemd unit:

```bash
cp /var/www/ComMicPlanV2_clone_2_Mar/migration_bundle_20260328/target/commicplan-clone.service \
  /etc/systemd/system/commicplan-clone.service
sed -i 's#__PROJECT_DIR__#/var/www/ComMicPlanV2_clone_2_Mar#g' /etc/systemd/system/commicplan-clone.service
systemctl daemon-reload
systemctl enable --now commicplan-clone.service
systemctl status commicplan-clone.service --no-pager
```

## 7. Optional: start local Enketo on the target

Skip this if you are temporarily reusing the existing `https://enketo2.commicplan.com`.

```bash
bash /var/www/ComMicPlanV2_clone_2_Mar/migration_bundle_20260328/target/start_enketo_pm2.sh
```

If you want Nginx in front of local Enketo too, use the saved reference file:
- `/var/www/ComMicPlanV2_clone_2_Mar/migration_bundle_20260328/config/nginx/enketo2.conf`

That file assumes a real domain and TLS certificate, so adjust it before enabling it.

## 8. Verify

Run these checks:

```bash
curl -I http://72.61.170.115:9200/
curl -I http://72.61.170.115:9200/api/
ss -ltnp | grep -E '9200|9202|9212|8005'
systemctl status nginx postgresql redis-server --no-pager
systemctl status commicplan-clone.service --no-pager
```

If local Enketo is enabled, also verify:

```bash
pm2 list
curl -I http://127.0.0.1:8005/
```
