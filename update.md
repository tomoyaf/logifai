# logifaiの配布方法を根本から改善する

**結論：Bun compileでシングルバイナリ化し、curl|shインストールスクリプト＋GitHub Releasesベースの自動更新を組み合わせるのが最適解です。** TypeScriptコードをほぼそのまま活かしながら、nodenvなどのNode.jsバージョンマネージャーへの依存を完全に排除でき、Mac/Linux/Windows全対応の50MB前後のバイナリを単一コマンドでクロスコンパイルできます。Deno compileも有力な代替案ですが、npm互換性とビルドの手軽さでBunが一歩リードしています。

## なぜnpm i -gは問題を起こすのか

`npm i -g`の根本的な問題は、**Node.jsランタイムへの依存**です。nodenvやvoltaなどのバージョンマネージャーはshim方式でNode.jsのパスを制御するため、グローバルインストールしたCLIコマンドがshimの切り替えで見えなくなります。さらに、ユーザーのNode.jsバージョンによってCLIが動作しないリスクもあります。Deno、Bun、rustup、fnmといった成功しているCLIツールは例外なく**シングルバイナリ配布**を採用しており、Node.jsへの依存を一切持ちません。ripgrep、fd、bat、GitHub CLIなど、モダンなCLIツールはすべてこのパターンに従っています。

## 7つの選択肢を比較した結果

TypeScript CLIをバイナリ化する主要な手段を調査し、以下の評価に至りました。

| 手法 | バイナリサイズ | クロスコンパイル | ビルド難易度 | コード再利用 | 起動速度 |
|---|---|---|---|---|---|
| **Bun compile** | 50–55MB | ✅ 単一コマンド | 極めて低い | ✅ TS全活用 | ~20–50ms |
| **Deno compile** | 58–80MB | ✅ 単一コマンド | 極めて低い | ⚠️ 一部修正要 | ~30–50ms |
| **Node.js SEA** | 75–100MB | ❌ Docker/CI必須 | 高い | ✅ 全活用 | ~40–80ms |
| **Go書き直し** | 5–10MB | ✅ 最も容易 | 中程度 | ❌ 全書き直し | ~5–10ms |
| **Rust書き直し** | 1–5MB | ⚠️ macOS困難 | 高い | ❌ 全書き直し | ~1–5ms |
| **pkg (Vercel)** | 50–65MB | ✅ 内蔵 | 低い | ✅ 全活用 | ~40–80ms |
| **ncc + SEA** | 75–100MB | ❌ Docker/CI必須 | 中–高 | ✅ 全活用 |  ~40–80ms |

**pkgは2024年1月にアーカイブ済み**でセキュリティ脆弱性も未修正、Node.js 18が上限のため新規プロジェクトでは使えません。Node.js SEAは実験段階（stage 1.1）でクロスコンパイル非対応、バイナリサイズも最大です。RustやGoへの書き直しはバイナリサイズの面では圧倒的ですが、既存TypeScriptコードを捨てるコストが大きすぎます。

**Bun compileを推奨する理由は3つ**あります。第一に、`bun build --compile --target=bun-linux-x64 ./cli.ts`の1コマンドでクロスプラットフォームバイナリを生成できます。第二に、TypeScriptをネイティブにサポートしているため、esbuildやnccなどのバンドラーを挟む必要がありません。第三に、Oven社の潤沢な資金に支えられ、月に複数回のリリースが行われる活発な開発が続いています。

## 成功しているCLIツールの配布パターン

Deno、Bun、rustup、fnmなど開発者向けCLIの配布戦略を横断調査した結果、**3層構造の配布チャネル**が標準パターンとして浮かび上がりました。

**Tier 1（必須）**は、GitHub Releasesでのプリビルドバイナリ公開と`curl | sh`方式のインストールスクリプトです。Deno（`curl -fsSL https://deno.land/install.sh | sh`）、Bun（`curl -fsSL https://bun.sh/install | bash`）、rustup（`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`）はすべてこのパターンを一次的なインストール手段として採用しています。インストールスクリプトは`uname -s`でOS、`uname -m`でアーキテクチャを検出し、適切なバイナリをダウンロードして`$HOME/.logifai/bin`のようなディレクトリに配置、`.bashrc`や`.zshrc`にPATHを追加します。

**Tier 2（推奨）**は、Homebrewタップ（macOS/Linux）とScoop バケット（Windows）です。`brew tap tomoyaf/logifai && brew install logifai`の2コマンドでインストールでき、`brew upgrade`で更新も可能です。GoReleaserを使えばGitHub Actionsでリリース時にHombrewフォーミュラとScoopマニフェストを自動生成・プッシュできます。

**Tier 3（あると良い）**はChocolatey、winget、npm（後方互換のため残す）、AURパッケージなどです。

## 自動更新は「通知＋明示コマンド」方式がベスト

自動更新の実装については、**完全自動更新ではなく通知＋`logifai update`コマンド方式**を推奨します。npm ecosystemの`update-notifier`（週間700万DL）の開発者が「完全自動更新は不人気だった」と明言しており、Denoの`deno upgrade`やBunの`bun upgrade`もユーザーが明示的にコマンドを実行する設計です。

具体的な実装フローは以下の通りです。起動時にバックグラウンドでGitHub Releases API（`GET /repos/tomoyaf/logifai/releases/latest`）を非同期にチェックし、結果をローカルにキャッシュします（チェック間隔は1日に1回）。新しいバージョンがあれば次回実行時に通知メッセージを表示し、ユーザーが`logifai update`を実行すると、現在のOS/アーキテクチャに対応するアセットをダウンロードして**SHA256チェックサムを検証**後、バイナリを置換します。CI環境（`$CI`環境変数検出時）では更新チェックを自動的にスキップします。

Bun/TypeScriptでの実装には、GitHub Releases APIをfetchで叩くシンプルな実装で十分です。Rustの`self_update`クレートやGoの`go-github-selfupdate`のような専用ライブラリもありますが、Bun環境では自前実装の方が制御しやすいでしょう。

## 具体的な移行実装プラン

### Phase 1：Bun compile対応（1–2週間）

既存のTypeScriptコードをBunで実行可能にします。多くの場合、`package.json`のスクリプトを`bun`ベースに変更するだけで動作します。

```bash
# ビルドコマンド（各プラットフォーム向け）
bun build --compile --target=bun-linux-x64 ./src/cli.ts --outfile dist/logifai-linux-x64
bun build --compile --target=bun-linux-arm64 ./src/cli.ts --outfile dist/logifai-linux-arm64
bun build --compile --target=bun-darwin-x64 ./src/cli.ts --outfile dist/logifai-darwin-x64
bun build --compile --target=bun-darwin-arm64 ./src/cli.ts --outfile dist/logifai-darwin-arm64
bun build --compile --target=bun-windows-x64 ./src/cli.ts --outfile dist/logifai-windows-x64.exe
```

Bun非互換のnpmパッケージがある場合は代替ライブラリへの差し替えが必要ですが、主要パッケージの互換性は高い状態です。ネイティブアドオン（`.node`ファイル）を使用している場合は、pure JavaScript代替への切り替えが必須です。

### Phase 2：GitHub Actions CI/CDパイプライン構築（1週間）

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ["v*"]
jobs:
  build:
    strategy:
      matrix:
        include:
          - target: bun-linux-x64
            os: ubuntu-latest
            artifact: logifai-linux-x64
          - target: bun-linux-arm64
            os: ubuntu-latest
            artifact: logifai-linux-arm64
          - target: bun-darwin-x64
            os: ubuntu-latest
            artifact: logifai-darwin-x64
          - target: bun-darwin-arm64
            os: ubuntu-latest
            artifact: logifai-darwin-arm64
          - target: bun-windows-x64
            os: ubuntu-latest
            artifact: logifai-windows-x64.exe
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun build --compile --target=${{ matrix.target }} ./src/cli.ts --outfile ${{ matrix.artifact }}
      - run: sha256sum ${{ matrix.artifact }} > ${{ matrix.artifact }}.sha256
      - uses: softprops/action-gh-release@v2
        with:
          files: |
            ${{ matrix.artifact }}
            ${{ matrix.artifact }}.sha256
```

Bunのクロスコンパイル機能により、**すべてのターゲットをubuntu-latestの1種類のランナーでビルド可能**です。これはGitHub Actionsのコスト（macOSランナーはLinuxの10倍）を大幅に削減します。

### Phase 3：インストールスクリプト作成（1週間）

Unix向けインストールスクリプトの骨格：

```bash
#!/bin/sh
set -euo pipefail

INSTALL_DIR="${LOGIFAI_INSTALL:-$HOME/.logifai}"
BIN_DIR="$INSTALL_DIR/bin"

detect_platform() {
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)
  case "$OS" in
    linux*) OS="linux" ;;
    darwin*) OS="darwin" ;;
    *) echo "Unsupported OS: $OS"; exit 1 ;;
  esac
  case "$ARCH" in
    x86_64|amd64) ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) echo "Unsupported arch: $ARCH"; exit 1 ;;
  esac
}

# GitHub Releases最新版取得 → ダウンロード → SHA256検証 → 配置 → PATH設定
```

Windows向けPowerShellスクリプト：`irm https://logifai.dev/install.ps1 | iex`

最終的に、ユーザーはワンライナーでインストールできます：

```bash
curl -fsSL https://logifai.dev/install.sh | sh
```

### Phase 4：自動更新機能実装（1週間）

`logifai update`コマンドと起動時のバックグラウンド更新チェックを実装します。GitHub Releases APIからlatestリリースを取得し、semver比較で更新判定、ユーザー同意の上でバイナリを置換します。

### Phase 5：パッケージマネージャー対応（2週間）

- **Homebrew**: `homebrew-logifai`リポジトリ作成、CIで自動フォーミュラ更新
- **Scoop**: `scoop-logifai`バケット作成、`checkver`/`autoupdate`設定
- **npm**: 後方互換としてラッパーパッケージを残す（バイナリをダウンロードして実行するshim）

## Deno compileという代替案

Bun compileが万が一問題を起こした場合の代替として、**Deno compileも十分に実用的**です。`deno compile --target aarch64-apple-darwin main.ts`の1コマンドでクロスコンパイルが可能で、コード署名サポートやPermissionモデルの組み込みなどBunにはない機能もあります。ただし、既存のnpmパッケージとの互換性ではBunの方が優位で、import文の`npm:`プレフィックス追加などコード修正が必要になる点がハードルです。バイナリサイズはBunとほぼ同等の58–80MBです。

## 結論：段階的に移行し、npm依存から脱却する

移行全体で**4–6週間**の作業量です。最も重要な判断は「既存TypeScriptを活かすか、書き直すか」ですが、logifaiのようなCLIツールではBun compileによるバイナリ化が**コスト対効果で最も優れています**。50MB前後のバイナリサイズはripgrep（5MB）やgh CLI（10MB）と比較すると大きいものの、Deno（58MB）やBun自体（50MB）と同等であり、CLIツールとして十分許容範囲内です。将来的にバイナリサイズが問題になった場合は、コア部分をRustで書き直す選択肢を取れますが、まずはTypeScript資産を活かした迅速な移行を優先すべきです。