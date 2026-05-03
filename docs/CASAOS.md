# CasaOS Deployment

Alur ini mengikuti pola PasarKita: deploy dijalankan dari terminal CasaOS/DietPi, source ditarik dari GitHub, lalu container dibuild di server.

Deployment ini hanya untuk SI Kepegawaian:

- App container: `sisdmk2-app`
- App folder: `/DATA/AppData/si-kepegawaian`
- Database utama: `si_data`
- PostgreSQL existing: `pasir-postgres`
- Docker network: `sisdmk2-network`

PasarKita tidak perlu dideploy ulang dan tidak disentuh oleh script ini.

## Deploy dari CasaOS via GitHub

Jalankan command ini langsung di terminal CasaOS/DietPi sebagai root. Pastikan perubahan terbaru sudah dipush ke GitHub branch `main`.

```bash
mkdir -p /DATA/AppData/si-kepegawaian
cd /DATA/AppData/si-kepegawaian
curl -fsSL https://raw.githubusercontent.com/Mediachanel/SI_DATA_pgAdmin4/main/scripts/deploy-casaos-github.sh -o deploy-casaos-github.sh
sh deploy-casaos-github.sh --install-deps --force-env --app-origin https://info.kepegawaian.media --postgres-container pasir-postgres
```

Jika `curl` belum ada:

```bash
apt-get update
apt-get install -y curl
```

Script akan clone/pull repo ke `/DATA/AppData/si-kepegawaian/source`, membuat `.env.casaos`, membuat/cek database `si_data`, lalu menjalankan:

```bash
docker compose -f docker-compose.casaos.yml up -d --build
docker exec sisdmk2-app npm run check:postgres
```

## Restore Data `si_data`

Karena data pegawai tidak berasal dari seed dummy di repo, upload dump lokal `si_data.pg16.sql.tgz` lewat File Manager CasaOS dulu. Misalnya file berada di `/DATA/Downloads/si_data.pg16.sql.tgz`.

Lalu jalankan deploy sekaligus restore:

```bash
cd /DATA/AppData/si-kepegawaian
sh deploy-casaos-github.sh \
  --force-env \
  --app-origin https://info.kepegawaian.media \
  --postgres-container pasir-postgres \
  --restore-dump /DATA/Downloads/si_data.pg16.sql.tgz
```

Jika dump sudah diekstrak menjadi `.sql`, path `.sql` juga bisa dipakai:

```bash
sh deploy-casaos-github.sh --restore-dump /DATA/Downloads/si_data.pg16.sql
```

Jangan restore `pasar_kita` untuk alur ini, karena database PasarKita sudah ada dan aplikasi PasarKita terpisah.

## Validasi

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs --tail 80 sisdmk2-app
docker exec sisdmk2-app npm run check:postgres
docker exec -it pasir-postgres psql -U postgres -d si_data -c "\dt"
```

## Deploy Ulang Tanpa Restore

Untuk update kode berikutnya setelah push ke GitHub:

```bash
cd /DATA/AppData/si-kepegawaian
sh deploy-casaos-github.sh --app-origin https://info.kepegawaian.media --postgres-container pasir-postgres
```

## Jika User PostgreSQL Bukan `postgres`

Jika container PostgreSQL CasaOS tidak punya role `postgres`, jalankan dengan user admin yang benar:

```bash
sh deploy-casaos-github.sh \
  --postgres-container pasir-postgres \
  --postgres-admin-user NAMA_USER_ADMIN \
  --postgres-user NAMA_USER_APP \
  --postgres-password 'PASSWORD_USER_APP' \
  --force-env \
  --app-origin https://info.kepegawaian.media
```

## Cloudflare Tunnel

Jika memakai domain `info.kepegawaian.media`, arahkan ingress Cloudflare Tunnel ke port host aplikasi:

```yaml
ingress:
  - hostname: info.kepegawaian.media
    service: http://localhost:3000
  - service: http_status:404
```

Jika Anda memilih `--app-port 8080`, service tunnel harus menjadi `http://localhost:8080`.
