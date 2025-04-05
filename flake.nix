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
        libPath = lib.makeLibraryPath (
          with pkgs;
          [
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
          ]
        );
        wrapPrefix = if (!pkgs.stdenv.isDarwin) then "LD_LIBRARY_PATH" else "DYLD_LIBRARY_PATH";
        patchedpnpm = (
          pkgs.symlinkJoin {
            name = "pnpm";
            paths = [ pkgs.pnpm ];
            buildInputs = [ pkgs.makeWrapper ];
            postBuild = ''
              wrapProgram "$out/bin/pnpm" --prefix ${wrapPrefix} : "${libPath}"
            '';
          }
        );
        patchednode = (
          pkgs.symlinkJoin {
            name = "node";
            paths = [ pkgs.nodejs ];
            buildInputs = [ pkgs.makeWrapper ];
            postBuild = ''
              wrapProgram "$out/bin/node" --prefix ${wrapPrefix} : "${libPath}"
            '';
          }
        );
      in
      {
        devShells.default = pkgs.mkShell {
          packages =
            (with pkgs; [
              # project dependencies
              pre-commit
            ])
            ++ [
              patchednode
              patchedpnpm
            ];
        };
      }
    );
}
