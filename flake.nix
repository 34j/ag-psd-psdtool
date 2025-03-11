{
  inputs = {
    devenv-root = {
      url = "file+file:///dev/null";
      flake = false;
    };
    nix-ml-ops = {
      url = "github:Atry/nix-ml-ops/upgrade--devenv-1.0";
      inputs.systems.url = "github:nix-systems/default";
    };
  };
  outputs = inputs:
    inputs.nix-ml-ops.lib.mkFlake { inherit inputs; } {
      imports = [
        inputs.nix-ml-ops.flakeModules.devcontainer
        inputs.nix-ml-ops.flakeModules.nixIde
        inputs.nix-ml-ops.flakeModules.nixLd
        inputs.nix-ml-ops.flakeModules.ldFallbackManylinux
      ];
      perSystem = { pkgs, config, lib, system, ... }: {
        ml-ops.devcontainer = {
          nixago.requests = {
            ".vscode/extensions.json".data = {
              "recommendations" = [
                "esbenp.prettier-vscode"
                "vivaxy.vscode-conventional-commits"
              ];
            };
          };
          devenvShellModule = {
            dotenv.disableHint = true;
            languages = {
              javascript = {
                enable = true;
                npm = {
                  enable = true;
                  install.enable = true;
                };
              };
            };
          };
        };

      };
    };
}
