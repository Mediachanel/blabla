import "./globals.css";

export const metadata = {
  title: "Sistem Informasi SDM Kesehatan DKI Jakarta",
  description: "Aplikasi internal pengelolaan data pegawai Dinas Kesehatan Provinsi DKI Jakarta",
  icons: {
    icon: "/dinkes.png",
    shortcut: "/dinkes.png",
    apple: "/dinkes.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
