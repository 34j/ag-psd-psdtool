{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = pkgs.lib;
        nodeFHS = pkgs.buildFHSEnv {
          name = "pnpm";
          runScript = "${pkgs.pnpm}/bin/pnpm";
          targetPackages = with pkgs; [
            openssl
            systemd
            glib
            cups
            nss
            alsa-lib
            dbus
            at-spi2-core
            libdrm
            expat
            xorg.libX11
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrandr
            xorg.libxcb
            mesa
            libxkbcommon
            pango
            cairo
            nspr
            libgbm
            libuuid
            freetype
            nodejs
          ];
        };
        wrapPrefix = if (!pkgs.stdenv.isDarwin) then "LD_LIBRARY_PATH" else "DYLD_LIBRARY_PATH";
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            nodeFHS
          ];
        };
      }
    );
}
