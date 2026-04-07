# mycommicplan
# MainComMicPlan
# ComMicPlanV2

## Docker quickstart (local)
1) Review and edit `docker.env` (DB credentials, secret key, allowed hosts).
2) Build and run: `docker compose up --build`
3) Open `http://localhost:8080`

## Docker Hub build/push
1) Update image names in `docker-compose.yml` if your Docker Hub org/user is different.
2) Login: `docker login`
3) Build images: `docker compose build backend nginx`
4) Push images: `docker compose push backend nginx`

## Docker dev (hot reload)
1) Build and run: `docker compose -f docker-compose.dev.yml up --build`
2) Frontend: `http://localhost:5173`
3) Backend: `http://localhost:8000`
# ComMicPlanV2_BRAC_NEW_UPDATE
# microstatification
