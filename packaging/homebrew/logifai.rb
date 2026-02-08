# typed: false
# frozen_string_literal: true

# This is a template. CI replaces __VERSION__ and __SHA256_*__ placeholders on release.
class Logifai < Formula
  desc "Auto-capture development logs for Claude Code"
  homepage "https://github.com/tomoyaf/logifai"
  version "__VERSION__"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/tomoyaf/logifai/releases/download/v__VERSION__/logifai-darwin-arm64"
      sha256 "__SHA256_DARWIN_ARM64__"

      def install
        bin.install "logifai-darwin-arm64" => "logifai"
      end
    else
      url "https://github.com/tomoyaf/logifai/releases/download/v__VERSION__/logifai-darwin-x64"
      sha256 "__SHA256_DARWIN_X64__"

      def install
        bin.install "logifai-darwin-x64" => "logifai"
      end
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/tomoyaf/logifai/releases/download/v__VERSION__/logifai-linux-arm64"
      sha256 "__SHA256_LINUX_ARM64__"

      def install
        bin.install "logifai-linux-arm64" => "logifai"
      end
    else
      url "https://github.com/tomoyaf/logifai/releases/download/v__VERSION__/logifai-linux-x64"
      sha256 "__SHA256_LINUX_X64__"

      def install
        bin.install "logifai-linux-x64" => "logifai"
      end
    end
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/logifai --version")
  end
end
