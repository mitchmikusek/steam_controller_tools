{ pkgs ? import <nixpkgs> {} }:

let
  electronDeps = with pkgs; [
    glib
    nss
    nspr
    atk
    cups
    dbus
    libdrm
    gtk3
    pango
    cairo
    libx11
    libxcomposite
    libxdamage
    libxext
    libxfixes
    libxrandr
    libxcb
    libgbm
    mesa
    expat
    alsa-lib
    libxkbcommon
  ];
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs
    pnpm
    typescript
  ] ++ electronDeps;

  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath electronDeps;
}
