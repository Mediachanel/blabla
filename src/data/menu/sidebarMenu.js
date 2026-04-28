import {
  Bot,
  BriefcaseBusiness,
  ClipboardList,
  FileSpreadsheet,
  Home,
  LogOut,
  UploadCloud,
  UserCircle,
  UsersRound
} from "lucide-react";
import { ROLES } from "@/lib/constants/roles";

export const sidebarMenu = [
  { label: "Dashboard", href: "/dashboard", icon: Home, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD] },
  { label: "Data Pegawai", href: "/pegawai", icon: UsersRound, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD] },
  {
    label: "Usulan",
    icon: ClipboardList,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD],
    children: [
      { label: "Usulan Mutasi", href: "/usulan/mutasi", icon: BriefcaseBusiness, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD] },
      { label: "Usulan Putus JF", href: "/usulan/putus-jf", icon: ClipboardList, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD] }
    ]
  },
  { label: "Import Excel Pegawai", href: "/import-pegawai", icon: FileSpreadsheet, roles: [ROLES.SUPER_ADMIN] },
  { label: "Import DRH", href: "/import-drh", icon: UploadCloud, roles: [ROLES.SUPER_ADMIN] },
  { label: "Daftar Urut Kepangkatan", href: "/duk", icon: FileSpreadsheet, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD] },
  { label: "QnA Admin", href: "/qna-admin", icon: Bot, roles: [ROLES.SUPER_ADMIN] },
  { label: "Profil Akun", href: "/profil", icon: UserCircle, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD] },
  { label: "Logout", href: "/api/auth/logout", icon: LogOut, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD], action: "logout" }
];

export function filterMenuByRole(role) {
  return sidebarMenu
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.roles.includes(role))
    }));
}
