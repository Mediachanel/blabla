import { ROLES } from "@/lib/constants/roles";
import { ukpdList } from "@/data/mock";

export function canAccessMenu(role, allowedRoles = []) {
  return allowedRoles.includes(role);
}

export function filterPegawaiByRole(pegawai, user) {
  if (!user) return [];
  if (user.role === ROLES.SUPER_ADMIN) return pegawai;
  if (user.role === ROLES.ADMIN_UKPD) {
    return pegawai.filter((item) => item.nama_ukpd === user.nama_ukpd);
  }
  if (user.role === ROLES.ADMIN_WILAYAH) {
    return pegawai.filter((item) => {
      if (item.wilayah) return item.wilayah === user.wilayah;
      const allowedUkpd = ukpdList
        .filter((ukpd) => ukpd.wilayah === user.wilayah)
        .map((ukpd) => ukpd.nama_ukpd);
      return allowedUkpd.includes(item.nama_ukpd);
    });
  }
  return [];
}

export function getPegawaiWilayah(pegawai) {
  return pegawai.wilayah || ukpdList.find((ukpd) => ukpd.nama_ukpd === pegawai.nama_ukpd)?.wilayah || "-";
}
