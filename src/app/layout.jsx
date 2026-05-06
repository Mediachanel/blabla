import "./globals.css";

export const metadata = {
  title: "Sistem Informasi SDM Kesehatan DKI Jakarta",
  description: "Aplikasi internal pengelolaan data pegawai Dinas Kesehatan Provinsi DKI Jakarta",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/dinkes.png",
    shortcut: "/dinkes.png",
    apple: "/dinkes.png"
  }
};

export const viewport = {
  themeColor: "#2563eb"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", function () {
                  navigator.serviceWorker.register("/service-worker.js").catch(function (error) {
                    console.error("Service worker registration failed:", error);
                  });
                });
              }
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
